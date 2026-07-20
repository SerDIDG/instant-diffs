import id from './id';
import * as utils from './utils';
import * as utilsApi from './utils-api';
import { getHostname } from './utils-article';

import settings from './settings';

class Api {
	/**
	 * @type {typeof utilsApi}
	 */
	static utils = utilsApi;

	/**
	 * @type {mw.Api}
	 */
	static api;

	/**
	 * @type {Object<mw.ForeignApi>}
	 */
	static foreignApi = {};

	/**
	 * Gets the Api instance (local or foreign based on hostname).
	 * @param {import('./Article').default|string} [articleOrHostname] - Article instance or hostname
	 * @returns {mw.Api} mw.Api or mw.ForeignApi instance
	 */
	static getApi( articleOrHostname ) {
		const hostname = getHostname( articleOrHostname );

		if ( !utils.isForeign( hostname ) ) {
			if ( !this.api ) {
				this.api = new mw.Api();
			}
			return this.api;
		}

		if ( !this.foreignApi[ hostname ] ) {
			const endPoint = `https://${ hostname }${ mw.util.wikiScript( 'api' ) }`;
			this.foreignApi[ hostname ] = new mw.ForeignApi( endPoint );
		}

		return this.foreignApi[ hostname ];
	}

	/**
	 * mw.Api.get wrapper for GET requests.
	 * @param {Object} params - API request parameters
	 * @param {import('./Article').default|string} [articleOrHostname] - Article instance or hostname
	 * @returns {JQuery.Promise} Promise that resolves with API response data
	 */
	static get( params, articleOrHostname ) {
		return this.getApi( articleOrHostname ).get( params );
	}

	/**
	 * mw.Api.post wrapper for POST requests.
	 * @param {Object} params - API request parameters
	 * @param {import('./Article').default|string} [articleOrHostname] - Article instance or hostname
	 * @returns {JQuery.Promise} Promise that resolves with API response data
	 */
	static post( params, articleOrHostname ) {
		return this.getApi( articleOrHostname ).post( params );
	}

	/**
	 * mw.Api.postWithToken wrapper for authenticated POST requests.
	 * @param {string} action - Token type (e.g., 'csrf', 'watch')
	 * @param {Object} params - API request parameters
	 * @param {import('./Article').default|string} [articleOrHostname] - Article instance or hostname
	 * @returns {JQuery.Promise} Promise that resolves with API response data
	 */
	static postWithToken( action, params, articleOrHostname ) {
		return this.getApi( articleOrHostname ).postWithToken( action, params );
	}

	/**
	 * mw.Api.watch wrapper.
	 * @param {string|Array<string>} pages
	 * @param {string} [expiry]
	 * @param {import('./Article').default|string} [articleOrHostname]
	 * @return {jQuery.Promise<mw.Api.WatchedPage|mw.Api.WatchedPage[]>}
	 */
	static watch( pages, expiry, articleOrHostname ) {
		return this.getApi( articleOrHostname ).watch( pages, expiry );
	}

	/**
	 * mw.Api.unwatch wrapper.
	 * @param {string|Array<string>} pages
	 * @param {import('./Article').default|string} [articleOrHostname]
	 * @return {jQuery.Promise<mw.Api.WatchedPage|mw.Api.WatchedPage[]>}
	 */
	static unwatch( pages, articleOrHostname ) {
		return this.getApi( articleOrHostname ).unwatch( pages );
	}

	/**
	 * Logs an error.
	 * @param {Error} error
	 */
	static notifyError( error ) {
		utils.notifyError( 'error-api-generic', {
			tag: 'api',
			message: error?.message || error,
			silent: true,
		} );
	}

	/******* TOKENS *******/

	static getAuthToken( articleOrHostname ) {
		const params = {
			action: 'centralauthtoken',
			format: 'json',
			formatversion: 2,
			uselang: id.local.language,
		};
		return this.get( params, articleOrHostname );
	}

	/******* MESSAGES *******/

	/**
	 * Gets the interface messages if missing.
	 * @param {array|string} messages
	 * @param {import('./Article').default|string} [articleOrHostname]
	 * @returns {JQuery.Promise|mw.Api.Promise}
	 */
	static loadMessage( messages, articleOrHostname ) {
		messages = typeof messages === 'string' ? [ messages ] : messages;

		// Return results as soon as possible
		const missing = messages.filter( msg => !mw.message( msg ).exists() );
		if ( missing.length === 0 ) return $.Deferred().resolve().promise();

		return this.getApi( articleOrHostname )
			.loadMessagesIfMissing( messages, {
				uselang: id.local.userLanguage,
			} );
	}

	/******* PARSE *******/

	/**
	 * Gets a parsed wikitext.
	 * @param {Object} params
	 * @param {import('./Article').default|string} [articleOrHostname]
	 * @return {Promise<*|string>}
	 */
	static async parseWikitext( params, articleOrHostname ) {
		params = {
			action: 'parse',
			contentmodel: 'wikitext',
			format: 'json',
			formatversion: 2,
			uselang: id.local.language,
			useskin: mw.config.get( 'skin' ),
			...params,
		};

		try {
			const { parse } = await this.post( params, articleOrHostname );
			return parse.text;
		} catch ( error ) {
			this.notifyError( error );
		}
	}

	/******* PAGE INFO *******/

	static async getCompare( params, articleOrHostname, requestManager ) {
		params = {
			action: 'compare',
			prop: [ 'title', 'ids', 'timestamp', 'comment' ],
			format: 'json',
			formatversion: 2,
			uselang: id.local.userLanguage,
			...params,
		};
		const api = requestManager ? requestManager : this;

		try {
			const data = await api.get( params, articleOrHostname );
			return data.compare;
		} catch ( error ) {
			this.notifyError( error );
		}
	}

	static async getPageInfo( params, articleOrHostname, requestManager ) {
		const language = id.local.userLanguage;
		params = {
			action: 'query',
			prop: [ 'info', 'pageprops', 'pageterms', 'entityterms' ],
			inprop: [ 'watched', 'notificationtimestamp' ],
			wbetterms: [ 'label' ],
			wbetlanguage: language,
			wbptterms: [ 'label' ],
			wbptlanguage: language,
			intestactions: [ 'edit' ],
			format: 'json',
			formatversion: 2,
			uselang: language,
			...params,
		};
		const api = requestManager ? requestManager : this;

		try {
			const { query } = await api.get( params, articleOrHostname );
			const page = query.pages?.[ 0 ];
			const error = utilsApi.getQueryPageError( query );
			return { page, error };
		} catch ( error ) {
			this.notifyError( error );
		}
	}

	static async markAsSeen( params, articleOrHostname ) {
		params = {
			action: 'setnotificationtimestamp',
			redirects: 1,
			format: 'json',
			formatversion: 2,
			uselang: id.local.userLanguage,
			...params,
		};

		try {
			const data = await this.postWithToken( 'csrf', params, articleOrHostname );
			return data.setnotificationtimestamp[ 0 ].notificationtimestamp;
		} catch ( error ) {
			this.notifyError( error );
		}
	}

	/******* SPECIAL PAGES *******/

	/**
	 * @type {Object<string, string>}
	 */
	static specialPages = {};

	/**
	 * @type {Object<string, string>}
	 */
	static specialPagesLocal = {};

	/**
	 * Requests localized special page names.
	 * @param {import('./Article').default|string} [articleOrHostname]
	 * @returns {Promise<*|{}>}
	 */
	static async getSpecialPages( articleOrHostname ) {
		// Convert data array to the pairs
		if ( utils.isEmptyObject( this.specialPages ) ) {
			id.config.specialPages.forEach( name => {
				this.specialPages[ name ] = name;
			} );
		}

		// Try to get cached data from the local storage
		if ( !utils.isNew() && utils.isEmptyObject( this.specialPagesLocal ) ) {
			this.specialPagesLocal = mw.storage.getObject( `${ id.config.prefix }-specialPagesLocal` ) || {};
		}

		// Ty to get data from the static property
		if ( !utils.isEmptyObject( this.specialPagesLocal ) ) {
			return this.specialPagesLocal;
		}

		// Set the fallback specialPages pairs
		for ( const [ key, value ] of Object.entries( this.specialPages ) ) {
			this.specialPagesLocal[ key ] = value;
		}

		// Request localized specialPages for the current content language
		const params = {
			action: 'query',
			titles: id.config.specialPages,
			format: 'json',
			formatversion: 2,
			uselang: mw.config.get( 'wgContentLanguage' ),
		};

		try {
			const { query } = await this.get( params, articleOrHostname );

			// Set the localized specialPages pairs
			if ( query.normalized ) {
				query.normalized.forEach( item => {
					this.specialPagesLocal[ item.from ] = item.to;
				} );
			}

			// Cache data with expiry
			mw.storage.setObject( `${ id.config.prefix }-specialPagesLocal`, this.specialPagesLocal, settings.get( 'storageExpiry' ) );

			return this.specialPagesLocal;
		} catch ( error ) {
			this.notifyError( error );
		}
	}

	/******* WIKIBASE LABEL *******/

	/**
	 * Geta a localized page label from Wikibase.
	 * @param {string} entityId
	 * @param {import('./Article').default|string} [articleOrHostname]
	 * @param {import('./RequestManager').default} [requestManager]
	 * @return {Promise<*|string>}
	 */
	static async getWBLabel( entityId, articleOrHostname, requestManager ) {
		if ( !utilsApi.isProbablyWbTitle( entityId ) ) return;

		const language = id.local.userLanguage;
		const params = {
			action: 'wbgetentities',
			props: 'labels',
			ids: entityId,
			languages: language,
			languagefallback: 1,
			format: 'json',
			formatversion: 2,
			uselang: language,
		};
		const api = requestManager ? requestManager : this;

		try {
			const { entities } = await api.get( params, articleOrHostname );
			const entity = entities[ entityId ];

			if ( entity.type === 'lexeme' ) {
				return Object.values( entity.lemmas )
					.map( lemma => lemma.value )
					.join( '/' );
			}

			return entity.labels[ language ].value;
		} catch ( error ) {
			this.notifyError( error );
		}
	}
}

export default Api;