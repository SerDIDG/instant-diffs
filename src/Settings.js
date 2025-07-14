import id from './id';
import * as utils from './utils';
import { applyOoUiPolyfill, getWindowManager } from './utils-oojs';

import './styles/settings.less';

/**
 * Class representing a Settings container.
 * @mixes OO.EventEmitter
 */
class Settings {
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
    isSaving = false;

    /**
     * Mixin a Settings instance.
     */
    mixin() {
        // Mixin constructor
        OO.EventEmitter.call( this );
    }

    /******* DEPENDENCIES *******/

    /**
     * Request a Settings dialog dependencies.
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

        this.loadPromise = $.when( mw.loader.using( utils.getDependencies( id.config.dependencies.settings ) ) )
            .then( this.onLoadSuccess.bind( this ) )
            .fail( this.onLoadError.bind( this ) );

        return this.loadPromise;
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
            message: error?.message,
        };

        utils.notifyError( 'error-dependencies-generic', this.error );
    }

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
     * Import and construct an instance of the Settings dialog.
     */
    construct() {
        this.isConstructed = true;

        // Import the Settings dialog constructor
        const SettingsDialog = require( './SettingsDialog' ).default;

        // Construct the Settings dialog and attach it to the Window Managers
        this.dialog = new SettingsDialog();
        this.manager = getWindowManager();
        this.manager.addWindows( [ this.dialog ] );
    };

    /**
     * Open the Settings dialog.
     */
    open() {
        if ( this.isOpen ) return;

        if ( !this.isConstructed ) {
            this.construct();
        }

        this.windowInstance = this.manager.openWindow( this.dialog );
        this.windowInstance.opening.then( this.onOpening.bind( this ) );
        this.windowInstance.opened.then( this.onOpen.bind( this ) );
        this.windowInstance.closing.then( this.onClosing.bind( this ) );
        this.windowInstance.closed.then( this.onClose.bind( this ) );
    }

    /**
     * Event that emits after the Settings dialog starts opening.
     */
    onOpening() {
        this.emit( 'opening' );
    }

    /**
     * Event that emits after the Settings dialog opens.
     */
    onOpen() {
        this.isOpen = true;
        this.emit( 'opened' );
    }

    /**
     * Event that emits after the View Settings starts closing.
     */
    onClosing() {
        this.emit( 'closing' );
    }

    /**
     * Event that emits after the Settings dialog closes.
     */
    onClose() {
        this.isOpen = false;
        this.emit( 'closed' );
    }

    /******* USER OPTIONS *******/

    /**
     * Request user options.
     * @returns {Promise|boolean}
     */
    request() {
        // Guest settings can be stored only in the Local Storage
        if ( id.local.mwIsAnon ) return $.Deferred().resolve().promise();

        this.isRequesting = true;

        const params = {
            action: 'query',
            meta: 'userinfo',
            uiprop: 'options',
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
        };
        return id.local.mwApi
            .post( params )
            .always( this.onRequestResponse.bind( this ) );
    };

    /**
     * Event that emits after user options request returned response.
     */
    onRequestResponse() {
        this.isRequesting = false;
    }

    /**
     * Save user options.
     * @param {Object} options
     * @returns {Promise|boolean}
     */
    save( options ) {
        // Update settings stored in the Local Storage and in the local User Options
        utils.setDefaults( options, true );

        // Guest settings can be stored only in the Local Storage
        if ( id.local.mwIsAnon ) return $.Deferred().resolve().promise();

        this.isSaving = true;

        // Check if the Global Preferences extension is available
        const dependencies = utils.getDependencies( [ 'ext.GlobalPreferences.global' ] );
        if ( dependencies.length > 0 ) {
            return this.saveGlobal( options );
        }

        return this.saveLocal( options );
    }

    /**
     * Post user options on the local project.
     * @param {Object} options
     * @returns {Promise}
     */
    saveLocal( options ) {
        const params = [
            `${ id.config.settingsPrefix }-settings`,
            JSON.stringify( options ),
        ];

        return id.local.mwApi.saveOption.apply( id.local.mwApi, params )
            .always( this.onSaveResponse.bind( this ) );
    }

    /**
     * Post user options on the global project.
     * @param {Object} options
     * @returns {Promise}
     */
    saveGlobal( options ) {
        const params = {
            action: 'globalpreferences',
            optionname: `${ id.config.settingsPrefix }-settings`,
            optionvalue: JSON.stringify( options ),
        };

        return id.local.mwApi.postWithEditToken( params )
            .always( this.onSaveResponse.bind( this ) );
    }

    /**
     * Event that emits after save request returned response.
     */
    onSaveResponse() {
        this.isSaving = false;
    }
}

export default new Settings();