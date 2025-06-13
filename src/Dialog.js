import $ from 'jquery';
import mw from 'mediawiki';

import id from './id';
import * as utils from './utils';

import Link from './Link';
import Diff from './Diff';
import Snapshot from './Snapshot';

import './styles/dialog.less';

/**
 * Class representing a diff dialog.
 */
class Dialog {
    link;
    diff;
    options = {};

    opener = {
        link: null,
        options: {},
    };

    initiator = {
        link: null,
        options: {},
    };

    previousInitiator = {
        link: null,
        options: {},
    };

    isDependenciesLoaded = false;
    isConstructed = false;
    isOpen = false;
    isLoading = false;

    mwConfigBackup;

    constructor( link, options ) {
        this.process.apply( this, arguments );
    }

    process( link, options ) {
        this.link = link;
        this.options = {
            initiatorDiff: null,
            onOpen: function () {},
            onClose: function () {},
            ...options,
        };

        if ( !this.isOpen ) {
            this.opener.link = this.link;
            this.opener.options = $.extend( true, {}, this.options );

            // Get a new snapshot of the links to properly calculate indexes for navigation between them
            id.local.snapshot = new Snapshot();
        }

        if ( this.link instanceof Link ) {
            const initiatorLink = this.link.getInitiatorLink();
            if ( id.local.snapshot.hasLink( initiatorLink ) ) {
                this.previousInitiator = $.extend( true, {}, this.initiator );
                this.initiator.link = initiatorLink;
                this.initiator.options = $.extend( true, {}, this.options );

                // Set only the initiator links for the current point of navigation
                id.local.snapshot.setLink( this.initiator.link );
            }
        }
    }

    load() {
        if ( this.isLoading ) return;

        if ( this.isDependenciesLoaded ) {
            return this.request();
        }

        this.isLoading = true;
        this.error = null;

        return $.when( mw.loader.using( this.getDependencies() ) )
            .then( this.onLoadSuccess.bind( this ) )
            .fail( this.onLoadError.bind( this ) );
    };

    getDependencies() {
        return utils.getDependencies( [ ...id.config.dependencies.dialog, ...id.config.dependencies.content ] );
    }

    onLoadError( error ) {
        this.isLoading = false;
        this.isDependenciesLoaded = false;
        this.error = {
            type: 'dependencies',
            message: error && error.message ? error.message : null,
        };
        utils.notifyError( 'error-dependencies-generic', null, this.error );
    };

    onLoadSuccess() {
        this.isLoading = false;
        this.isDependenciesLoaded = true;
        return this.request();
    }

    async construct() {
        this.isConstructed = true;

        // Import a DiffDialog constructor
        const { DiffDialog } = await import('./DiffDialog');

        // Construct DiffDialog and attach it to the Window Managers
        this.dialog = new DiffDialog( this );
        this.manager = utils.getWindowManager();
        this.manager.addWindows( [ this.dialog ] );
    }

    async request() {
        if ( !this.isConstructed ) {
            await this.construct();
        }

        this.isLoading = true;
        this.error = null;

        // When the Diff is about to change, restore the mw.config to the initial state
        if ( this.mwConfigBackup ) {
            utils.restoreMWConfig( this.mwConfigBackup );
        }
        if ( !this.mwConfigBackup ) {
            this.mwConfigBackup = utils.backupMWConfig();
        }

        // Construct the Diff options
        const page = this.link.getPage();
        const options = {
            type: this.link.getType(),
            typeVariant: this.link.getTypeVariant(),
            initiatorDiff: this.options.initiatorDiff,
            initiatorDialog: this,
        };

        // Load the Diff content
        this.previousDiff = this.diff;
        this.diff = new Diff( page, options );
        return $.when( this.diff.load() )
            .then( this.onRequestSuccess.bind( this ) )
            .fail( this.onRequestError.bind( this ) );
    }

    onRequestError() {
        this.isLoading = false;
        this.open();
    }

    onRequestSuccess() {
        this.isLoading = false;
        this.open();
    }

    open() {
        const options = {
            title: this.diff.getPageTitleText(),
            message: this.diff.getContainer(),
        };

        if ( this.isOpen ) {
            this.dialog.update( options ).then( this.onUpdate.bind( this ) );
        } else {
            this.windowInstance = this.manager.openWindow( this.dialog, options );
            this.windowInstance.opened.then( this.onOpen.bind( this ) );
            this.windowInstance.closed.then( this.onClose.bind( this ) );
        }
    }

    onOpen() {
        this.isOpen = true;
        this.fire();

        if ( utils.isFunction( this.options.onOpen ) ) {
            this.options.onOpen( this );
        }
    }

    onClose() {
        this.isOpen = false;

        if ( this.diff ) {
            this.diff.detach();
            this.diff = null;
        }

        if ( this.mwConfigBackup ) {
            utils.restoreMWConfig( this.mwConfigBackup );
            this.mwConfigBackup = null;
        }

        if ( utils.isFunction( this.options.onClose ) ) {
            this.options.onClose( this );
        }
        if ( utils.isFunction( this.opener.options.onClose ) && this.opener.link !== this.link ) {
            this.opener.options.onClose( this );
        }
        if ( utils.isFunction( this.initiator.options.onClose ) ) {
            this.initiator.options.onClose( this );
        }
    }

    onUpdate() {
        this.fire();

        if (
            this.previousInitiator.link instanceof Link &&
            this.opener.link !== this.previousInitiator.link &&
            utils.isFunction( this.previousInitiator.options.onClose )
        ) {
            this.previousInitiator.options.onClose( this );
        }
        if (
            this.initiator.link instanceof Link &&
            this.opener.link !== this.initiator.link &&
            utils.isFunction( this.initiator.options.onOpen )
        ) {
            this.initiator.options.onOpen( this );
        }
    }

    onScroll( event ) {
        // Update diff content positions and sizes
        this.diff.redraw( {
            top: event.target.scrollTop,
        } );
    }

    /******* ACTIONS *******/

    fire() {
        // Detach previous Diff if exists
        if ( this.previousDiff instanceof Diff ) {
            this.previousDiff.detach();
        }

        // Fire the Diff hooks
        this.diff.fire();

        // Refresh the dialog content height
        this.dialog.updateSize();
    }

    focus() {
        this.dialog.focus();
    }

    getDiff() {
        return this.diff;
    }

    getOverlay() {
        return this.dialog.$overlay;
    }

    isParent( node ) {
        return $.contains( this.dialog.$content.get( 0 ), node );
    }
}

export default Dialog;