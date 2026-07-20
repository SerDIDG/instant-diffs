import id from './id';
import * as utils from './utils';
import { getHostname } from './utils-article';

import Api from './Api';
import settings from './settings';

class Site {
	/**
	 * @type {Object<string, Object>}
	 */
	static info = {};

	/**
	 * @type {Object<string, Object>}
	 */
	static aliases = {};

	/**
	 * @type {Object<string, Object>}
	 */
	static namespaceConfig = {};

	/**
	 * @type {Object<string, Object>}
	 */
	static CORSConfig = {};

	/**
	 * Gets the site info.
	 * @param {Array} [fields=['general', 'skins']]
	 * @param {import('./Article').default|string} [articleOrHostname]
	 * @param {import('./RequestManager').default} [requestManager]
	 * @return {Promise<*|{}>}
	 */
	static async getInfo(
		fields = [ 'general', 'skins', 'crosssiteajaxdomains' ],
		articleOrHostname,
		requestManager,
	) {
		const hostname = getHostname( articleOrHostname );

		// Try to get cached data from the local storage
		if ( !utils.isNew() && utils.isEmptyObject( this.info ) ) {
			this.info = mw.storage.getObject( `${ id.config.prefix }-siteInfo` ) || {};
			this.processInfo();
		}

		// Ty to get data from the static property
		if ( this.checkInfo( hostname, fields ) ) {
			return this.aliases[ hostname ] || this.info[ hostname ];
		}

		// Request data via API
		const params = {
			action: 'query',
			meta: 'siteinfo',
			siprop: fields,
			format: 'json',
			formatversion: 2,
			uselang: id.local.userLanguage,
		};
		const api = requestManager ? requestManager : Api;

		try {
			const { query } = await api.get( params, hostname );

			if ( !this.info[ hostname ] ) {
				this.info[ hostname ] = {};
			}
			for ( const [ key, value ] of Object.entries( query ) ) {
				this.info[ hostname ][ key ] = value;
			}

			// Cache data with expiry
			mw.storage.setObject( `${ id.config.prefix }-siteInfo`, this.info, settings.get( 'storageExpiry' ) );

			this.processAliases( this.info[ hostname ] );
			return this.info[ hostname ];
		} catch ( error ) {
			Api.notifyError( error );
		}
	}

	/**
	 * @private
	 */
	static processInfo() {
		if ( utils.isEmptyObject( this.info ) ) return;

		for ( const site of Object.values( this.info ) ) {
			this.processAliases( site );
		}
	}

	/**
	 * @private
	 */
	static processAliases( site ) {
		if ( utils.isEmptyObject( site?.general ) ) return;

		this.aliases[ site.general.servername ] = site;
		if ( !utils.isEmpty( site.general.mobileserver ) ) {
			site.general.mobileservername = utils.getComponentFromUrl( 'hostname', site.general.mobileserver );
			this.aliases[ site.general.mobileservername ] = site;
		}
	}

	/**
	 * @private
	 */
	static checkInfo( hostname, fields = [] ) {
		if ( this.aliases[ hostname ] ) {
			return utils.isEmpty( fields ) || fields.every( field => this.aliases[ hostname ][ field ] );
		}
		if ( this.info[ hostname ] ) {
			return utils.isEmpty( fields ) || fields.every( field => this.info[ hostname ][ field ] );
		}
		return false;
	}

	/**
	 * Gets the site namespace config.
	 * @param {import('./Article').default|string} [articleOrHostname] - Article instance or hostname
	 * @returns {Object<string, Object>|undefined}
	 */
	static getNamespaceConfig( articleOrHostname ) {
		const hostname = getHostname( articleOrHostname );

		// Get config from the cache
		if ( this.namespaceConfig[ hostname ] ) return this.namespaceConfig[ hostname ];

		// Get site info
		const data = this.aliases[ hostname ];
		if ( utils.isEmptyObject( data ) ) return;

		// Process namespace config
		this.namespaceConfig[ hostname ] = {
			wgFormattedNamespaces: Object.values( data.namespaces ).reduce( ( obj, value ) => {
				obj[ value.id ] = value.canonical || '';
				return obj;
			}, {} ),

			wgNamespaceIds: {
				...Object.values( data.namespaces ).reduce( ( obj, value ) => {
					obj[ utils.spacesToUnderlines( value.name.toLowerCase() ) ] = value.id;
					if ( value.canonical ) {
						obj[ utils.spacesToUnderlines( value.canonical.toLowerCase() ) ] = value.id;
					}
					return obj;
				}, {} ),
				...data.namespacealiases.reduce( ( obj, alias ) => {
					obj[ alias.alias.toLowerCase() ] = alias.id;
					return obj;
				}, {} ),
			},

			wgCaseSensitiveNamespaces: Object.values( data.namespaces )
				.filter( ( value ) => value.case === 'case-sensitive' )
				.map( ( value ) => value.id ),

			wgContentNamespaces: Object.values( data.namespaces )
				.filter( ( value ) => value.content )
				.map( ( value ) => value.id ),
		};

		return this.namespaceConfig[ hostname ];
	}

	/**
	 * Gets the site cross site ajax domains config.
	 * @param {import('./Article').default|string} [articleOrHostname] - Article instance or hostname
	 * @returns {{ exact: Set<string>, wildcardBases: Set<string>, globRegexes: RegExp[] }|undefined}
	 */
	static getCORSConfig( articleOrHostname ) {
		const hostname = getHostname( articleOrHostname );

		// Get config from the cache
		if ( this.CORSConfig[ hostname ] ) return this.CORSConfig[ hostname ];

		// Get site info
		const { crosssiteajaxdomains } = this.aliases[ hostname ] || {};
		if ( utils.isEmpty( crosssiteajaxdomains ) ) return;

		// Process CORS config
		const exact = new Set();
		const wildcardBases = new Set();
		const globRegexes = [];

		crosssiteajaxdomains.forEach( ( raw ) => {
			const pattern = raw.trim().toLowerCase();
			if ( pattern.startsWith( '*.' ) ) {
				wildcardBases.add( pattern.slice( 2 ) );
			} else if ( /[*?]/.test( pattern ) ) {
				const reStr = '^' + pattern
					.replace( /[.+^${}()|[\]\\]/g, '\\$&' )
					.replace( /\*/g, '.*' )
					.replace( /\?/g, '.' ) + '$';
				globRegexes.push( new RegExp( reStr ) );
			} else {
				exact.add( pattern );
			}
		} );

		this.CORSConfig[ hostname ] = { exact, wildcardBases, globRegexes };

		return this.CORSConfig[ hostname ];
	}

	/**
	 * Gets the site interwiki map.
	 * @param {import('./Article').default|string} [articleOrHostname] - Article instance or hostname
	 * @returns {Array|undefined}
	 */
	static async getInterwikiMap( articleOrHostname ) {
		const { interwikimap } = await Site.getInfo( [ 'interwikimap' ], articleOrHostname ) || {};
		return interwikimap;
	}

	/**
	 * Check if the site has a specified registered skin.
	 * @param {string} name - Skin code name
	 * @param {import('./Article').default|string} [articleOrHostname] - Article instance or hostname
	 * @returns {Promise<*>}
	 */
	static async hasSkin( name, articleOrHostname ) {
		const { skins } = await Site.getInfo( [ 'skins' ], articleOrHostname ) || {};
		return skins?.some( skin => skin.code === name );
	}
}

export default Site;