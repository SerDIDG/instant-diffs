import id from './id';
import * as utils from './utils';
import { applyOoUiPolyfill, getWindowManager } from './utils-oojs';

import Link from './Link';
import Diff from './Diff';
import Snapshot from './Snapshot';

import './styles/view.less';

/**
 * Class representing a View container.
 */
class View {
    /**
     * @type {import('./Link').default|import('./ViewButton').default}
     */
    link;

    /**
     * @type {import('./Diff').default}
     */
    diff;

    /**
     * @type {object}
     */
    options = {};

    /**
     * @type {object}
     */
    opener = {
        link: null,
        options: {},
    };

    /**
     * @type {object}
     */
    initiator = {
        link: null,
        options: {},
    };

    /**
     * @type {object}
     */
    previousInitiator = {
        link: null,
        options: {},
    };

    /**
     * @type {object}
     */
    mwConfigBackup;

    /**
     * @type {object}
     */
    mwUserOptionsBackup;

    /**
     * @type {object}
     */
    document = {};

    /**
     * @type {Promise}
     */
    loadPromise;

    /**
     * @type {boolean}
     */
    isDependenciesLoaded = false;

    /**
     * @type {boolean}
     */
    isConstructed = false;

    /**
     * @type {boolean}
     */
    isOpen = false;

    /**
     * @type {boolean}
     */
    isLoading = false;

    /**
     * @type {boolean}
     */
    isRequesting = false;

    /**
     * @type {boolean}
     */
    isProcessing = false;

    /**
     * Setup configuration options.
     * @param {import('./Link').default|import('./ViewButton').default} link a Link, or a ViewButton instance
     * @param {object} [options] configuration options
     */
    setup( link, options ) {
        // Track on dialog process start time
        id.timers.dialogProcesStart = Date.now();

        this.link = link;
        this.options = {
            initiatorDiff: null,
            onOpen: () => {},
            onClose: () => {},
            ...options,
        };

        if ( !this.isOpen ) {
            this.opener.link = this.link;
            this.opener.options = { ...this.options };

            // Get a new snapshot of the links to properly calculate indexes for navigation between them
            id.local.snapshot = new Snapshot();
        }

        if ( this.link instanceof Link ) {
            const initiatorLink = this.link.getInitiatorLink();
            if ( id.local.snapshot.hasLink( initiatorLink ) ) {
                this.previousInitiator = { ...this.initiator };
                this.initiator.link = initiatorLink;
                this.initiator.options = { ...this.options };

                // Set only the initiator links for the current point of navigation
                id.local.snapshot.setLink( this.initiator.link );
            }
        }
    }

    /******* DEPENDENCIES *******/

    /**
     * Request a View dialog dependencies.
     * @returns {Promise|boolean}
     */
    load() {
        if ( this.isLoading ) return this.loadPromise;

        if ( this.isDependenciesLoaded ) {
            this.open();
            return true;
        }

        this.isLoading = true;
        this.error = null;

        this.loadPromise = $.when( mw.loader.using( this.getDependencies() ) )
            .then( this.onLoadSuccess.bind( this ) )
            .fail( this.onLoadError.bind( this ) );

        return this.loadPromise;
    };

    /**
     * Join a dialog and a dialog content dependencies.
     * @returns {array}
     */
    getDependencies() {
        return utils.getDependencies( [ ...id.config.dependencies.window, ...id.config.dependencies.content ] );
    }

    /**
     * Event that emits after dependency loading failed.
     * @param {object} [error]
     */
    onLoadError( error ) {
        this.isLoading = false;
        this.isDependenciesLoaded = false;

        this.error = {
            type: 'dependencies',
            message: error && error.message ? error.message : null,
        };

        utils.notifyError( 'error-dependencies-generic', this.error );
    };

    /**
     * Event that emits after dependency loading successive.
     */
    onLoadSuccess() {
        this.isLoading = false;
        this.isDependenciesLoaded = true;

        // Apply polyfills for the legacy wikis
        applyOoUiPolyfill();

        this.open();
    }

    /******* DIALOG *******/

    /**
     * Import and construct an instance of the View dialog.
     */
    construct() {
        this.isConstructed = true;

        // Import the View dialog constructor
        const ViewDialog = require( './ViewDialog' ).default;

        // Construct the View dialog and attach it to the View Managers
        this.dialog = new ViewDialog();
        this.manager = getWindowManager();
        this.manager.addWindows( [ this.dialog ] );
    }

    /**
     * Open the View dialog.
     */
    open() {
        // Construct the Dialog instance
        if ( !this.isConstructed ) {
            this.construct();
        }

        if ( !this.isOpen ) {
            // Save document scroll top position before the dialog opens.
            this.document.scrollableRoot = OO.ui.Element.static.getRootScrollableElement( document.body );
            this.document.scrollTop = this.document.scrollableRoot.scrollTop;

            // Initial dialog options
            const page = this.link.getPage();
            const options = {
                title: page.titleText || page.title,
            };

            // Open a dialog window through the windows manager
            this.windowInstance = this.manager.openWindow( this.dialog, options );
            this.windowInstance.opened.then( this.onOpen.bind( this ) );
            this.windowInstance.closed.then( this.onClose.bind( this ) );
        }

        // Construct the Diff instance
        this.request();
    }

    /**
     * Event that emits after the View dialog opens.
     */
    onOpen() {
        this.isOpen = true;

        if ( utils.isFunction( this.options.onOpen ) ) {
            this.options.onOpen( this );
        }
    }

    /**
     * Event that emits after the View dialog closes.
     */
    onClose() {
        this.isOpen = false;
        this.isRequesting = false;
        this.isProcessing = false;

        if ( this.diff ) {
            this.diff.detach();
            this.diff = null;
        }

        // Restore the mw.config to the initial state
        if ( this.mwConfigBackup ) {
            utils.restoreMWConfig( this.mwConfigBackup );
            this.mwConfigBackup = null;
        }
        if ( this.mwUserOptionsBackup ) {
            utils.restoreMWUserOptions( this.mwUserOptionsBackup );
            this.mwUserOptionsBackup = null;
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

        // Restore document scroll top position after the dialog closes.
        // In the revision view, some module dependencies cause the page
        // to scroll to the top after loading, for some reason.
        this.document.scrollableRoot.scrollTop = this.document.scrollTop;
    }

    /**
     * Event that emits after the View dialog updates.
     */
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

    /******* DIFF *******/

    /**
     * Construct an instance of the Diff and request its content.
     */
    request() {
        if ( this.isRequesting || this.isProcessing ) return;

        this.isRequesting = true;
        this.isProcessing = true;
        this.error = null;
        this.previousDiff = this.diff;

        // Show progress bar in the dialog
        this.dialog.toggleProgress( true );

        // When the Diff is about to change, restore the mw.config to the initial state
        if ( this.mwConfigBackup ) {
            utils.restoreMWConfig( this.mwConfigBackup );
        }
        if ( !this.mwConfigBackup ) {
            this.mwConfigBackup = utils.backupMWConfig();
        }
        if ( this.mwUserOptionsBackup ) {
            utils.restoreMWUserOptions( this.mwUserOptionsBackup );
        }
        if ( !this.mwUserOptionsBackup ) {
            this.mwUserOptionsBackup = utils.backupMWUserOptions();
        }

        // Construct the Diff instance
        const page = this.link.getPage();
        const options = {
            initiatorDiff: this.options.initiatorDiff,
        };

        this.diff = new Diff( page, options );
        this.diff.on( 'focus', () => this.focus() );

        // Load the Diff content
        $.when( this.diff.load() )
            .always( this.onRequestResponse.bind( this ) );
    }

    /**
     * Event that emits after the Diff request response.
     */
    onRequestResponse() {
        this.isRequesting = false;

        // The Diff can be already detached from the DOM once the dialog closes
        if ( !this.diff || this.diff.isDetached ) return;

        // Embed the Diff's content to the dialog
        const options = {
            title: this.diff.getPageTitleText(),
            message: this.diff.getContainer(),
        };
        this.dialog.update( options )
            .then( this.onUpdate.bind( this ) );
    }

    /******* ACTIONS *******/

    /**
     * Fire hooks in the attached diff.
     */
    fire() {
        // Detach previous Diff if exists
        if ( this.previousDiff instanceof Diff ) {
            this.previousDiff.detach();
            this.previousDiff = null;
        }

        // Fire the Diff hooks
        this.diff.fire();

        // Refresh the dialog content height
        this.redraw();

        // Track on dialog process end time
        id.timers.dialogProcesEnd = Date.now();

        // Log timers for the dialog process
        if ( utils.defaults( 'logTimers' ) ) {
            utils.logTimer( 'dialog process time', id.timers.dialogProcesStart, id.timers.dialogProcesEnd );
        }

        this.isProcessing = false;
    }

    /**
     * Set focus on the dialog.
     */
    focus() {
        this.dialog.focus();
    }

    /**
     * Refresh the dialog content height.
     */
    redraw() {
        if ( !this.isOpen ) return;

        // Refresh the dialog content height
        this.dialog.updateSize();
    }

    /**
     * Get a diff instance.
     * @returns {import('./Diff').default} a Diff instance
     */
    getDiff() {
        return this.diff;
    }

    /**
     * Check if the View dialog contains a node.
     * @param {Element} node
     * @returns {boolean}
     */
    isContains( node ) {
        return this.dialog?.$content.get( 0 ).contains( node );
    }
}

export default new View();