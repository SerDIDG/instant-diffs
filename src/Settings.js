import $ from 'jquery';
import mw from 'mediawiki';

import id from './id';
import * as utils from './utils';

import './styles/settings.less';

/**
 * Class representing a settings dialog.
 */
class Settings {
    options = {};

    isDependenciesLoaded = false;
    isConstructed = false;
    isOpen = false;
    isLoading = false;

    constructor( options ) {
        this.process.apply( this, arguments );
    }

    process( options ) {
        this.options = {
            onOpen: function () {},
            onClose: function () {},
            ...options,
        };
    }

    /******* DEPENDENCIES *******/

    load() {
        if ( this.isLoading ) return;

        if ( this.isDependenciesLoaded ) {
            return this.request();
        }

        this.isLoading = true;
        this.error = null;

        return $.when( mw.loader.using( utils.getDependencies( id.config.dependencies.settings ) ) )
            .then( this.onLoadSuccess.bind( this ) )
            .fail( this.onLoadError.bind( this ) );
    }

    onLoadError( error ) {
        this.isLoading = false;
        this.isDependenciesLoaded = false;
        this.error = {
            type: 'dependencies',
            message: error && error.message ? error.message : null,
        };
        utils.notifyError( 'error-dependencies-generic', null, this.error );
    }

    onLoadSuccess() {
        this.isLoading = false;
        this.isDependenciesLoaded = true;
        return this.request();
    }

    /******* DIALOG *******/

    async construct() {
        this.isConstructed = true;

        // Import a SettingsDialog constructor
        const { SettingsDialog } = await import('./SettingsDialog');

        // Construct SettingsDialog and attach it to the Window Managers
        this.dialog = new SettingsDialog( this );
        this.manager = utils.getWindowManager();
        this.manager.addWindows( [ this.dialog ] );
    };

    /******* USER OPTIONS *******/

    async request() {
        if ( !this.isConstructed ) {
            await this.construct();
        }
        if ( id.local.mwIsAnon ) {
            return this.open();
        }

        this.isLoading = true;
        this.error = null;

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
            .then( this.onRequestSuccess.bind( this ) )
            .fail( this.onRequestError.bind( this ) );
    };

    onRequestError( error, data ) {
        this.isLoading = false;

        this.error = {
            type: 'settings',
            message: error,
        };
        if ( data?.error ) {
            this.error.code = data.error.code;
            this.error.message = data.error.info;
        }
        utils.notifyError( 'error-setting-request', null, this.error );

        this.open();
    }

    onRequestSuccess( data ) {
        this.isLoading = false;

        // Render error if the userinfo request is completely failed
        const options = data?.query?.userinfo?.options;
        if ( !options ) {
            return this.onRequestError();
        }

        try {
            const settings = JSON.parse( options[ `${ id.config.settingsPrefix }-settings` ] );
            utils.setDefaults( settings, true );
        } catch ( e ) {}

        this.open();
    }

    save( settings ) {
        // Update settings stored in the Local Storage
        mw.storage.setObject( `${ id.config.prefix }-settings`, settings );

        // Guest settings stored only in the Local Storage
        if ( id.local.mwIsAnon ) return true;

        // Check if the Global Preferences extension is available
        const dependencies = utils.getDependencies( [ 'ext.GlobalPreferences.global' ] );
        if ( dependencies.length > 0 ) {
            return this.saveGlobal( settings );
        }

        return this.saveLocal( settings );
    }

    saveLocal( settings ) {
        const params = [
            `${ id.config.settingsPrefix }-settings`,
            JSON.stringify( settings ),
        ];
        return id.local.mwApi.saveOption.apply( id.local.mwApi, params );
    }

    saveGlobal( settings ) {
        const params = {
            action: 'globalpreferences',
            optionname: `${ id.config.settingsPrefix }-settings`,
            optionvalue: JSON.stringify( settings ),
        };
        return id.local.mwApi.postWithEditToken( params );
    }

    /******* ACTIONS *******/

    open() {
        if ( this.isOpen ) return;

        if ( !this.isConstructed ) {
            this.construct();
        } else {
            this.dialog.update();
        }

        this.windowInstance = this.manager.openWindow( this.dialog );
        this.windowInstance.opened.then( this.onOpen.bind( this ) );
        this.windowInstance.closed.then( this.onClose.bind( this ) );
    }

    onOpen() {
        this.isOpen = true;
        if ( utils.isFunction( this.options.onOpen ) ) {
            this.options.onOpen( this );
        }
    }

    onClose() {
        this.isOpen = false;
        if ( utils.isFunction( this.options.onClose ) ) {
            this.options.onClose( this );
        }
    }
}

export default Settings;