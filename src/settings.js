import id from './id';
import * as utils from './utils';
import * as utilsSettings from './utils-settings';
import { applyOoUiPolyfill, getWindowManager } from './utils-oojs';

import Api from './Api';

import './styles/settings.less';

/**
 * Class representing a Settings container.
 * @mixes OO.EventEmitter
 */
class Settings {
	/**
	 * @type {typeof utilsSettings}
	 */
	static utils = utilsSettings;

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
			.then( this.onLoadSuccess )
			.fail( this.onLoadError );

		return this.loadPromise;
	}

	/**
	 * Event that emits after dependency loading failed.
	 * @param {Object} [error]
	 * @private
	 */
	onLoadError = ( error ) => {
		this.isLoading = false;
		this.isDependenciesLoaded = false;

		this.error = {
			type: 'dependencies',
			message: error?.message,
		};

		utils.notifyError( 'error-dependencies-generic', this.error );
	};

	/**
	 * Event that emits after dependency loading successively.
	 * @private
	 */
	onLoadSuccess = () => {
		this.isLoading = false;
		this.isDependenciesLoaded = true;

		// Apply polyfills for the legacy wikis
		applyOoUiPolyfill();

		this.open();
	};

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
		this.windowInstance.opening.then( this.onOpening );
		this.windowInstance.opened.then( this.onOpen );
		this.windowInstance.closing.then( this.onClosing );
		this.windowInstance.closed.then( this.onClose );
	}

	/**
	 * Event that emits after the Settings dialog starts opening.
	 * @private
	 */
	onOpening = () => {
		this.emit( 'opening' );
	};

	/**
	 * Event that emits after the Settings dialog opens.
	 * @private
	 */
	onOpen = () => {
		this.isOpen = true;
		this.emit( 'opened' );
	};

	/**
	 * Event that emits after the View Settings starts closing.
	 * @private
	 */
	onClosing = () => {
		this.emit( 'closing' );
	};

	/**
	 * Event that emits after the Settings dialog closes.
	 * @private
	 */
	onClose = () => {
		this.isOpen = false;
		this.emit( 'closed' );
	};

	/******* USER OPTIONS *******/

	/**
	 * Request user options.
	 * @returns {mw.Api.Promise}
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
		return Api.post( params )
			.always( this.onRequestResponse );
	};

	/**
	 * Event that emits after user options request returned response.
	 * @private
	 */
	onRequestResponse = () => {
		this.isRequesting = false;
	};

	/**
	 * Save user options.
	 * @param {Object} options
	 * @returns {mw.Api.Promise}
	 */
	save( options ) {
		// Update settings stored in the Local Storage and in the local User Options
		this.set( options, true );

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
	 * @returns {mw.Api.Promise}
	 */
	saveLocal( options ) {
		const params = [
			`${ id.config.settingsPrefix }-settings`,
			JSON.stringify( options ),
		];

		const api = Api.getApi();
		return api.saveOption.apply( api, params )
			.always( this.onSaveResponse );
	}

	/**
	 * Post user options on the global project.
	 * @param {Object} options
	 * @returns {mw.Api.Promise}
	 */
	saveGlobal( options ) {
		const params = {
			action: 'globalpreferences',
			optionname: `${ id.config.settingsPrefix }-settings`,
			optionvalue: JSON.stringify( options ),
		};

		return Api.getApi().postWithEditToken( params )
			.always( this.onSaveResponse );
	}

	/**
	 * Event that emits after save request returned response.
	 * @private
	 */
	onSaveResponse = () => {
		this.isSaving = false;
	};

	/******* DEFAULTS *******/

	/**
	 * Get a setting default stored in the config.
	 * @param {string} [key] for specific option, or undefined for the option's object
	 * @param {boolean} [userOption] get an option only declarative in the settings schema
	 * @returns {*|object} a specific option, or the option's object
	 */
	get( key, userOption ) {
		if ( userOption ) {
			const userOptions = Object.fromEntries(
				Object
					.entries( id.local.defaults )
					.filter( ( [ key ] ) => key in id.config.settings ),
			);
			return key ? userOptions[ key ] : userOptions;
		}
		return key ? id.local.defaults[ key ] : id.local.defaults;
	}

	/**
	 * Check is a setting option stored in the config is enabled.
	 * @param {string} [key] for specific option, or undefined for the option's object
	 * @returns {*|object} a specific option, or the option's object
	 */
	check( key ) {
		return key ? id.local.settings[ key ] : id.local.settings;
	}

	/**
	 * Apply the setting defaults to the singleton and saves to the Local Storage.
	 * If the second parameter is true, also saves to the Greasemonkey storage (if available)
	 * and to the local MW User Options.
	 * @param {Object} options the setting options data
	 * @param {boolean} [saveUserOptions] save the setting options to the local objects
	 */
	set( options, saveUserOptions ) {
		id.local.defaults = { ...id.local.defaults, ...options };

		// Get options only declarative in the settings schema
		const userOptions = this.get( undefined, true );

		// Save defaults to the Local Storage
		mw.storage.setObject( `${ id.config.prefix }-settings`, userOptions );

		if ( saveUserOptions ) {
			const json = JSON.stringify( userOptions );

			// Save defaults to the Greasemonkey storage
			if ( utils.isFunction( id.GM?.setValue ) ) {
				id.GM.setValue( 'settings', json );
			}

			// Save defaults to the local MW User Options
			if ( !id.local.mwIsAnon ) {
				mw.user?.options?.set( id.config.settingsPrefix, json );
			}
		}
	}

	/**
	 * Merge the settings defaults stored in the different storages:
	 * Local Storage, Greasemonkey storage (if available), local MW User Options;
	 * then sets them to the singleton without saving.
	 */
	async processDefaults() {
		let options = {};

		// Get settings stored in the Local Storage
		try {
			options = { ...options, ...mw.storage.getObject( `${ id.config.prefix }-settings` ) };
		} catch {}

		// Get settings stored in the Greasemonkey storage
		if ( utils.isFunction( id.GM?.getValue ) ) {
			try {
				options = { ...options, ...JSON.parse( await id.GM.getValue( 'settings' ) ) };
			} catch {}
		}

		// Get settings stored in the local MW User Options
		if ( !id.local.mwIsAnon ) {
			try {
				options = { ...options, ...JSON.parse( mw.user.options.get( `${ id.config.settingsPrefix }-settings` ) ) };
			} catch {}
		}

		this.set( options, false );
	}
}

export default new Settings();