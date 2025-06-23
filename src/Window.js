import id from './id';
import * as utils from './utils';

import Link from './Link';
import Diff from './Diff';
import Snapshot from './Snapshot';

import './styles/window.less';

/**
 * Class representing a Dialog container.
 */
class Window {
    /**
     * @type {import('./Link').default|import('./WindowButton').default}
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
     * Get or construct a Window instance.
     * @param {import('./Link').default|import('./WindowButton').default} link a Link instance, or a WindowButton instance
     * @param {object} [options] configuration options
     * @returns {import('./Window').default|undefined}
     * @static
     */
    static getInstance( link, options ) {
        if ( id.local.window && id.local.window.isLoading ) return;
        if ( !id.local.window ) {
            id.local.window = new Window( link, options );
        } else {
            id.local.window.setup( link, options );
        }
        return id.local.window;
    }

    /**
     * Create a Dialog.
     * @param {import('./Link').default|import('./WindowButton').default} link a Link, or a WindowButton instance
     * @param {object} [options] configuration options
     */
    constructor( link, options ) {
        this.setup.apply( this, arguments );
    }

    /**
     * Setup configuration options.
     * @param {import('./Link').default|import('./WindowButton').default} link a Link, or a WindowButton instance
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
     * Request a Window dialog dependencies.
     * @returns {Promise|undefined}
     */
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
     * @returns {Promise}
     */
    onLoadSuccess() {
        this.isLoading = false;
        this.isDependenciesLoaded = true;
        return this.request();
    }

    /******* DIALOG *******/

    /**
     * Import and construct an instance of the Window dialog.
     */
    construct() {
        this.isConstructed = true;

        // Import the Window dialog constructor
        const WindowDialog = require( '././WindowDialog' ).default;

        // Construct the Window dialog and attach it to the Window Managers
        this.dialog = new WindowDialog( this );
        this.manager = utils.getWindowManager();
        this.manager.addWindows( [ this.dialog ] );
    }

    /******* DIFF *******/

    /**
     * Construct an instance of the Diff and request its content.
     * @returns {Promise}
     */
    request() {
        if ( !this.isConstructed ) {
            this.construct();
        }

        this.isLoading = true;
        this.error = null;
        this.previousDiff = this.diff;

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

        // Construct the Diff options
        const page = this.link.getPage();
        const options = {
            initiatorDiff: this.options.initiatorDiff,
            onFocus: () => this.focus(),
            onResize: () => this.redraw(),
        };

        // Load the Diff content
        this.diff = new Diff( page, options );
        return $.when( this.diff.load() )
            .then( this.onRequestSuccess.bind( this ) )
            .fail( this.onRequestError.bind( this ) );
    }

    /**
     * Event that emits after the Diff request failed.
     */
    onRequestError() {
        this.isLoading = false;
        this.open();
    }

    /**
     * Event that emits after the Diff request successive.
     */
    onRequestSuccess() {
        this.isLoading = false;
        this.open();
    }

    /**
     * Open the Window dialog.
     */
    open() {
        const options = {
            title: this.diff.getPageTitleText(),
            message: this.diff.getContainer(),
        };

        if ( this.isOpen ) {
            this.dialog.update( options ).then( this.onUpdate.bind( this ) );
        } else {
            // Save document scroll top position before the dialog opens.
            this.document.scrollableRoot = OO.ui.Element.static.getRootScrollableElement( document.body );
            this.document.scrollTop = this.document.scrollableRoot.scrollTop;

            // Open a dialog window throw the windows manager
            this.windowInstance = this.manager.openWindow( this.dialog, options );
            this.windowInstance.opened.then( this.onOpen.bind( this ) );
            this.windowInstance.closed.then( this.onClose.bind( this ) );
        }
    }

    /**
     * Event that emits after the Window dialog opens.
     */
    onOpen() {
        this.isOpen = true;
        this.fire();

        if ( utils.isFunction( this.options.onOpen ) ) {
            this.options.onOpen( this );
        }
    }

    /**
     * Event that emits after the Window dialog closes.
     */
    onClose() {
        this.isOpen = false;

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
     * Event that emits after the Window dialog updates.
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

    /**
     * Event that emits after the Window dialog scrolls.
     */
    onScroll( event ) {
        // Update diff content positions and sizes
        if ( this.previousDiff instanceof Diff ) {
            this.previousDiff.redraw( {
                top: event.target.scrollTop,
            } );
        }
        this.diff.redraw( {
            top: event.target.scrollTop,
        } );
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

        // Update diff content positions and sizes
        this.diff.redraw( {
            top: this.dialog.getContainerElement().scrollTop,
        } );
    }

    /**
     * Get a diff instance.
     * @returns {import('./Diff').default}
     */
    getDiff() {
        return this.diff;
    }

    /**
     * Check if a node contains in the dialog.
     * @param {Element} node
     * @returns {boolean}
     */
    isParent( node ) {
        return $.contains( this.dialog.$content.get( 0 ), node );
    }
}

export default Window;