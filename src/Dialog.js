import $ from 'jquery';
import mw from 'mediawiki';
import OO from 'oojs';
import OoUi from 'oojs-ui';

import id from './id';
import * as utils from './utils';

import Link from './Link';
import Diff from './Diff';
import Snapshot from './Snapshot';

import './styles/dialog.less';

function Dialog( link, options ) {
    this.isDependenciesLoaded = false;
    this.isConstructed = false;
    this.isOpen = false;
    this.isLoading = false;

    this.options = {};
    this.opener = {
        link: null,
        options: {},
    };
    this.initiator = {
        link: null,
        options: {},
    };
    this.previousInitiator = {
        link: null,
        options: {},
    };

    this.link = null;
    this.diff = null;
    this.mwConfigBackup = null;

    this.process.apply( this, arguments );
}

Dialog.prototype.process = function ( link, options ) {
    this.link = link;
    this.options = $.extend( true, {
        initiatorDiff: null,
        onOpen: function () {},
        onClose: function () {},
    }, options );

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
};

Dialog.prototype.load = function () {
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

Dialog.prototype.getDependencies = function () {
    return utils.getDependencies( [ ...id.config.dependencies.dialog, ...id.config.dependencies.content ] );
};

Dialog.prototype.onLoadError = function ( error ) {
    this.isLoading = false;
    this.isDependenciesLoaded = false;
    this.error = {
        type: 'dependencies',
        message: error && error.message ? error.message : null,
    };
    utils.notifyError( 'error-dependencies-generic', null, this.error );
};

Dialog.prototype.onLoadSuccess = function () {
    this.isLoading = false;
    this.isDependenciesLoaded = true;
    return this.request();
};

Dialog.prototype.construct = function () {
    const that = this;
    this.isConstructed = true;

    // Construct a custom MessageDialog
    this.MessageDialog = function () {
        that.MessageDialog.super.call( this, {
            classes: [ 'instantDiffs-dialog' ],
        } );
    };
    OO.inheritClass( this.MessageDialog, OoUi.MessageDialog );

    this.MessageDialog.static.name = 'Instant Diffs Dialog';
    this.MessageDialog.static.size = 'instantDiffs';
    this.MessageDialog.static.actions = [
        {
            action: 'close',
            label: utils.msg( 'close' ),
        },
    ];

    this.MessageDialog.prototype.initialize = function () {
        // Parent method
        that.MessageDialog.super.prototype.initialize.apply( this, arguments );

        // Close the dialog by clicking on the overlay
        this.$overlay.on( 'click', this.close.bind( this ) );

        // Set content scroll events.
        // FixMe: maybe we need to use a promise like in WindowManager?
        this.container.$element.on( 'scroll', that.onScroll.bind( that ) );
    };

    this.MessageDialog.prototype.getSetupProcess = function ( data ) {
        data = data || {};

        // Parent method
        return that.MessageDialog.super.prototype.getSetupProcess.call( this, data )
            .next( function () {
                // Close the dialog by click on the overlay
                this.$overlay.on( 'click', this.close.bind( this ) );

                // Workaround for a label click focus
                this.appendHiddenInput();

                // Set a vertical scroll position to the top of the content
                this.container.$element.scrollTop( 0 );
            }, this );
    };

    this.MessageDialog.prototype.getUpdateProcess = function ( data ) {
        data = data || {};

        return new OoUi.Process()
            .next( function () {
                this.title.setLabel(
                    data.title !== undefined ? data.title : this.constructor.static.title,
                );
                this.message.setLabel(
                    data.message !== undefined ? data.message : this.constructor.static.message,
                );

                // Label click workaround
                this.appendHiddenInput();

                // Set focus on the dialog to restore emitting close event by pressing esc key
                this.focus();

                // Set a vertical scroll position to the top of the content
                this.container.$element.scrollTop( 0 );
            }, this );
    };

    this.MessageDialog.prototype.update = function ( data ) {
        return this.getUpdateProcess( data ).execute();
    };

    this.MessageDialog.prototype.focus = function () {
        this.$content.trigger( 'focus' );
    };

    this.MessageDialog.prototype.appendHiddenInput = function () {
        // Workaround, because we don't want the first input to be focused on click almost anywhere in
        // the dialog, which happens because the whole message is wrapped in the <label> element.
        // @see {@link https://github.com/jwbth/convenient-discussions/blob/20a7e7410b8331f1678c66851abbd5eeb4c4e51f/src/js/modal.js#L281}
        this.$dummyInput = $( '<input>' )
            .addClass( 'instantDiffs-hidden' )
            .prependTo( this.message.$element );
    };

    // Construct MessageDialog and attach it to the Window Managers
    this.dialog = new this.MessageDialog();
    this.manager = utils.getWindowManager();
    this.manager.addWindows( [ this.dialog ] );
};

Dialog.prototype.request = function () {
    if ( !this.isConstructed ) {
        this.construct();
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
};

Dialog.prototype.onRequestError = function () {
    this.isLoading = false;
    this.open();
};

Dialog.prototype.onRequestSuccess = function () {
    this.isLoading = false;
    this.open();
};

Dialog.prototype.open = function () {
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
};

Dialog.prototype.onOpen = function () {
    this.isOpen = true;
    this.fire();

    if ( utils.isFunction( this.options.onOpen ) ) {
        this.options.onOpen( this );
    }
};

Dialog.prototype.onClose = function () {
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
};

Dialog.prototype.onUpdate = function () {
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
};

Dialog.prototype.onScroll = function ( event ) {
    // Update diff content positions and sizes
    this.diff.redraw( {
        top: event.target.scrollTop,
    } );
};

/*** ACTIONS ***/

Dialog.prototype.fire = function () {
    // Detach previous Diff if exists
    if ( this.previousDiff instanceof Diff ) {
        this.previousDiff.detach();
    }

    // Fire the Diff hooks
    this.diff.fire();

    // Refresh the dialog content height
    this.dialog.updateSize();
};

Dialog.prototype.focus = function () {
    this.dialog.focus();
};

Dialog.prototype.getDiff = function () {
    return this.diff;
};

Dialog.prototype.isParent = function ( node ) {
    return $.contains( this.dialog.$content.get( 0 ), node );
};

export default Dialog;