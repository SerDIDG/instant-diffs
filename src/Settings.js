import id from './id';
import * as utils from './utils';

import './styles/settings.less';

/**
 * Class representing a Settings container.
 */
class Settings {
    /**
     * @type {object}
     */
    options = {};

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
     * Get or construct a Settings dialog instance.
     * @param {object} [options] configuration options
     * @returns {import('./Settings').default|undefined}
     * @static
     */
    static getInstance( options ) {
        if ( id.local.settings && id.local.settings.isLoading ) return;
        if ( !id.local.settings ) {
            id.local.settings = new Settings( options );
        } else {
            id.local.settings.setup( options );
        }
        return id.local.settings;
    }

    /**
     * Create a Settings dialog.
     * @param {object} [options] configuration options
     */
    constructor( options ) {
        this.setup.apply( this, arguments );
    }

    /**
     * Setup configuration options.
     * @param {object} [options] configuration options
     */
    setup( options ) {
        this.options = {
            onOpen: () => {},
            onClose: () => {},
            ...options,
        };
    }

    /******* DEPENDENCIES *******/

    /**
     * Request a Settings dialog dependencies.
     * @returns {Promise|boolean}
     */
    load() {
        if ( this.isLoading ) return false;

        if ( this.isDependenciesLoaded ) {
            this.open();
            return true;
        }

        this.isLoading = true;
        this.error = null;

        return $.when( mw.loader.using( utils.getDependencies( id.config.dependencies.settings ) ) )
            .then( this.onLoadSuccess.bind( this ) )
            .fail( this.onLoadError.bind( this ) );
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
            message: error?.message,
        };

        utils.notifyError( 'error-dependencies-generic', this.error );
    }

    /**
     * Event that emits after dependency loading successive.
     * @returns {Promise}
     */
    onLoadSuccess() {
        this.isLoading = false;
        this.isDependenciesLoaded = true;

        this.open();
    }

    /******* DIALOG *******/

    /**
     * Import and construct an instance of the Settings dialog.
     */
    construct() {
        this.isConstructed = true;

        // Import the Settings dialog constructor
        const SettingsDialog = require( './SettingsDialog' ).default;

        // Construct the Settings dialog and attach it to the Window Managers
        this.dialog = new SettingsDialog( this );
        this.manager = utils.getWindowManager();
        this.manager.addWindows( [ this.dialog ] );
    };

    /******* USER OPTIONS *******/

    /**
     * Request user options.
     * @returns {Promise|boolean}
     */
    request() {
        // Guest settings can be stored only in the Local Storage
        if ( id.local.mwIsAnon ) return $.Deferred().resolve();

        this.isLoading = true;

        const params = {
            action: 'query',
            meta: 'userinfo',
            uiprop: 'options',
            format: 'json',
            formatversion: 2,
            uselang: id.local.language,
        };
        return id.local.mwApi
            .post( params )
            .always( this.onRequestResponse.bind( this ) );
    };

    /**
     * Event that emits after user options request returned response.
     */
    onRequestResponse() {
        this.isLoading = false;
    }

    /**
     * Save user options.
     * @returns {Promise|boolean}
     */
    save( settings ) {
        // Update settings stored in the Local Storage and in the local User Options
        utils.setDefaults( settings, true );

        // Guest settings can be stored only in the Local Storage
        if ( id.local.mwIsAnon ) return $.Deferred().resolve();

        this.isLoading = true;

        // Check if the Global Preferences extension is available
        const dependencies = utils.getDependencies( [ 'ext.GlobalPreferences.global' ] );
        if ( dependencies.length > 0 ) {
            return this.saveGlobal( settings );
        }

        return this.saveLocal( settings );
    }

    /**
     * Post user options on the local project.
     * @returns {Promise}
     */
    saveLocal( settings ) {
        const params = [
            `${ id.config.settingsPrefix }-settings`,
            JSON.stringify( settings ),
        ];

        return id.local.mwApi.saveOption.apply( id.local.mwApi, params )
            .always( this.onSaveResponse.bind( this ) );
    }

    /**
     * Post user options on the global project.
     * @returns {Promise}
     */
    saveGlobal( settings ) {
        const params = {
            action: 'globalpreferences',
            optionname: `${ id.config.settingsPrefix }-settings`,
            optionvalue: JSON.stringify( settings ),
        };

        return id.local.mwApi.postWithEditToken( params )
            .always( this.onSaveResponse.bind( this ) );
    }

    /**
     * Event that emits after save request returned response.
     */
    onSaveResponse() {
        this.isLoading = false;
    }

    /******* ACTIONS *******/

    /**
     * Open the Settings dialog.
     */
    open() {
        if ( this.isOpen ) return;

        if ( !this.isConstructed ) {
            this.construct();
        }

        this.windowInstance = this.manager.openWindow( this.dialog );
        this.windowInstance.opened.then( this.onOpen.bind( this ) );
        this.windowInstance.closed.then( this.onClose.bind( this ) );
    }

    /**
     * Event that emits after the Settings dialog opens.
     */
    onOpen() {
        this.isOpen = true;
        if ( utils.isFunction( this.options.onOpen ) ) {
            this.options.onOpen( this );
        }
    }

    /**
     * Event that emits after the Settings dialog closes.
     */
    onClose() {
        this.isOpen = false;
        if ( utils.isFunction( this.options.onClose ) ) {
            this.options.onClose( this );
        }
    }
}

export default Settings;