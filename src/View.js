import id from './id';
import * as utils from './utils';
import { applyOoUiPolyfill, getWindowManager } from './utils-oojs';

import Link from './Link';
import Page from './Page';
import LocalPage from './LocalPage';
import GlobalPage from './GlobalPage';
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
     * @type {import('./Page').default}
     */
    page;

    /**
     * @type {Object}
     */
    options = {};

    /**
     * @type {Object}
     */
    opener = {
        link: null,
        options: {},
    };

    /**
     * @type {Object}
     */
    initiator = {
        link: null,
        options: {},
    };

    /**
     * @type {Object}
     */
    previousInitiator = {
        link: null,
        options: {},
    };

    /**
     * @type {Object}
     */
    mwConfigBackup;

    /**
     * @type {Object}
     */
    mwUserOptionsBackup;

    /**
     * @type {Object}
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
     * Create a View instance.
     */
    constructor() {
        // Mixin constructor
        OO.EventEmitter.call( this );
    }

    /**
     * Setup configuration options.
     * @param {import('./Link').default|import('./ViewButton').default} link a Link, or a ViewButton instance
     * @param {Object} [options] configuration options
     * @param {import('./Page').default} [options.initiatorPage] a Page instance
     * @param {Function} [options.onOpen] a callback
     * @param {Function} [options.onClose] a callback
     * @returns {boolean} a ready state
     */
    setup( link, options ) {
        if ( this.isRequesting || this.isProcessing ) return false;

        // Track on dialog process start time
        id.timers.dialogProcesStart = Date.now();

        this.link = link;
        this.options = {
            initiatorPage: null,
            onOpen: () => {},
            onClose: () => {},
            ...options,
        };

        if ( !this.isOpen ) {
            this.opener.link = this.link;
            this.opener.options = { ...this.options };

            // Get a new snapshot of the links to properly calculate indexes for navigation between them
            const options = {};

            // Add filter by article type when link generated my MediaWiki in the changes lists
            if ( this.opener.link.getMW?.().hasLine ) {
                options.filterType = this.opener.link.getArticle().get( 'type' );
                options.filterMWLine = true;
            }

            id.local.snapshot = new Snapshot( options );
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

        return true;
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
     * @returns {Array}
     */
    getDependencies() {
        return utils.getDependencies( [ ...id.config.dependencies.window, ...id.config.dependencies.content ] );
    }

    /**
     * Event that emits after dependency loading failed.
     * @param {Object} [error]
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
        this.dialog.connect( this, {
            hotkey: event => this.emit( 'hotkey', event ),
        } );

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
            const article = this.link.getArticle();
            const options = {
                title: article.get( 'titleText' ) || article.get( 'title' ),
            };

            // Open a dialog window through the windows manager
            this.windowInstance = this.manager.openWindow( this.dialog, options );
            this.windowInstance.opening.then( this.onOpening.bind( this ) );
            this.windowInstance.opened.then( this.onOpen.bind( this ) );
            this.windowInstance.closing.then( this.onClosing.bind( this ) );
            this.windowInstance.closed.then( this.onClose.bind( this ) );
        }

        // Construct the Page instance
        this.request();
    }

    /**
     * Event that emits after the View dialog starts opening.
     */
    onOpening() {
        this.emit( 'opening' );
    }

    /**
     * Event that emits after the View dialog opens.
     */
    onOpen() {
        this.isOpen = true;

        if ( utils.isFunction( this.options.onOpen ) ) {
            this.options.onOpen( this );
        }

        this.emit( 'opened' );
    }

    /**
     * Event that emits after the View dialog starts closing.
     */
    onClosing() {
        this.emit( 'closing' );
    }

    /**
     * Event that emits after the View dialog closes.
     */
    onClose() {
        this.isOpen = false;
        this.isRequesting = false;
        this.isProcessing = false;

        if ( this.page ) {
            this.page.detach();
            this.page = null;
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

        this.emit( 'closed' );
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

        this.emit( 'updated' );
    }

    /******* PAGE *******/

    /**
     * Construct the Page instance and request its content.
     */
    request() {
        this.isRequesting = true;
        this.isProcessing = true;
        this.error = null;
        this.previousPage = this.page;

        // Show progress bar in the dialog
        this.dialog.toggleProgress( true );

        // When the Page is about to change, restore the mw.config to the initial state
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

        // Get a Page params
        const article = this.link.getArticle();
        const options = {
            initiatorAction: this.previousPage?.getNavigation()?.getActionRegister(),
            initiatorPage: this.options.initiatorPage,
        };

        // Get a Page controller dependent of local or global lists
        const origin = article.get( 'origin' );
        const PageController = !origin || window.location.origin === origin ? LocalPage : GlobalPage;

        // Construct the Page instance
        this.page = new PageController( article, options );
        this.page.connect( this, {
            focus: 'focus',
            close: 'close',
        } );

        // Load the Page content
        $.when( this.page.load() )
            .always( this.onRequestResponse.bind( this ) );
    }

    /**
     * Event that emits after the Page request response.
     */
    onRequestResponse() {
        this.isRequesting = false;

        // The Page can be already detached from the DOM once the dialog closes
        if ( !this.page || this.page.isDetached ) return;

        // Embed the Pages's content to the dialog
        const options = {
            title: this.page.getArticleTitleText(),
            message: this.page.getContainer(),
        };
        this.dialog.update( options )
            .then( this.onUpdate.bind( this ) );
    }

    /******* ACTIONS *******/

    /**
     * Fire hooks in the attached Page.
     */
    fire() {
        // Detach previous Page if exists
        if ( this.previousPage instanceof Page ) {
            this.previousPage.detach();
            this.previousPage = null;
        }

        // Fire the Page hooks and events
        $.when( this.page.fire() )
            .always( () => {
                // Track on dialog process end time
                id.timers.dialogProcesEnd = Date.now();

                // Log timers for the dialog process
                if ( utils.defaults( 'logTimers' ) ) {
                    utils.logTimer( 'dialog process time', id.timers.dialogProcesStart, id.timers.dialogProcesEnd );
                }

                this.isProcessing = false;
            } );
    }

    /**
     * Set focus on the dialog.
     */
    focus() {
        this.dialog.focus();
    }

    /**
     * Close the dialog.
     */
    close() {
        this.dialog.close();
    }

    /**
     * Get the Page instance.
     * @returns {import('./Page').default} a Page instance
     */
    getPage() {
        return this.page;
    }

    /**
     * Get the Dialog instance.
     * @returns {import('./ViewDialog').default} a Dialog instance
     */
    getDialog() {
        return this.dialog;
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