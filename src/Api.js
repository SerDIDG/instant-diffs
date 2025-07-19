import id from './id';
import * as utils from './utils';
import * as utilsApi from './utils-api';

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
     * Gets instance of the Api.
     * @param {string} [hostname]
     * @return {mw.Api|mw.ForeignApi}
     */
    static getApi( hostname ) {
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
     * mw.Api.get wrapper.
     * @param {Object} params
     * @param {string} [hostname]
     * @return {mw.Api.AbortablePromise}
     */
    static get( params, hostname ) {
        return this.getApi( hostname ).get( params );
    }

    /**
     * mw.Api.post wrapper.
     * @param {Object} params
     * @param {string} [hostname]
     * @return {mw.Api.AbortablePromise}
     */
    static post( params, hostname ) {
        return this.getApi( hostname ).post( params );
    }

    /******* PARSE *******/

    static async parseWikitext( params, hostname ) {
        params = {
            action: 'parse',
            contentmodel: 'wikitext',
            format: 'json',
            formatversion: 2,
            uselang: id.local.language,
            ...params,
        };
        const data = await this.post( params, hostname );

        try {
            return data.parse.text;
        } catch ( error ) {
            utils.notifyError( 'error-api-generic', {
                type: 'api',
                message: error?.message || error,
            }, null, true );
        }
    }

    /******* MESSAGES *******/

    /**
     *
     * Requests interface messages if missing.
     * @param {array|string} messages
     * @param {string} [hostname]
     * @returns {JQuery.Promise|mw.Api.Promise}
     */
    static loadMessage( messages, hostname ) {
        messages = typeof messages === 'string' ? [ messages ] : messages;

        // Return results as soon as possible
        const missing = messages.filter( msg => !mw.message( msg ).exists() );
        if ( missing.length === 0 ) return $.Deferred().resolve().promise();

        return this.getApi( hostname ).loadMessagesIfMissing( messages, {
            uselang: id.local.userLanguage,
        } );
    }

    /******* SITE INFO *******/

    /**
     * @type {Object<string, Object>}
     */
    static siteInfo = {};

    /**
     * @type {Object<string, Object>}
     */
    static siteInfoAliases = {};

    /**
     *
     * @param {Array} fields
     * @param {string} [hostname]
     * @return {Promise<Object>}
     */
    static async getSiteInfo( fields = [], hostname ) {
        if ( utils.isEmpty( hostname ) ) {
            hostname = mw.config.get( 'wgServerName' );
        }

        // Try to get cached data from the local storage
        if ( !utils.isNew() && utils.isEmptyObject( this.siteInfo ) ) {
            this.siteInfo = mw.storage.getObject( `${ id.config.prefix }-siteInfo` ) || {};
            this.processSiteInfo();
        }

        // Ty to get data from the static property
        if ( !utils.isEmptyObject( this.siteInfoAliases[ hostname ] ) || !utils.isEmptyObject( this.siteInfo[ hostname ] ) ) {
            return this.siteInfoAliases[ hostname ] || this.siteInfo[ hostname ];
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
        const data = await this.get( params, hostname );

        try {
            if ( !this.siteInfo[ hostname ] ) {
                this.siteInfo[ hostname ] = {};
            }
            for ( const [ key, value ] of Object.entries( data.query ) ) {
                this.siteInfo[ hostname ][ key ] = value;
            }

            // Cache data with expiry
            mw.storage.setObject( `${ id.config.prefix }-siteInfo`, this.siteInfo, utils.defaults( 'storageExpiry' ) );

            this.processSiteInfoAliases( this.siteInfo[ hostname ] );
            return this.siteInfo[ hostname ];
        } catch ( error ) {
            utils.notifyError( 'error-api-generic', {
                type: 'api',
                message: error?.message || error,
            }, null, true );
        }
    }

    /**
     * @private
     */
    static processSiteInfo() {
        if ( utils.isEmptyObject( this.siteInfo ) ) return;

        for ( const site of Object.values( this.siteInfo ) ) {
            this.processSiteInfoAliases( site );
        }
    }

    /**
     * @private
     */
    static processSiteInfoAliases( site ) {
        if ( utils.isEmptyObject( site?.general ) ) return;

        this.siteInfoAliases[ site.general.servername ] = site;
        if ( !utils.isEmpty( site.general.mobileserver ) ) {
            site.general.mobileservername = utils.getComponentFromUrl( 'hostname', site.general.mobileserver );
            this.siteInfoAliases[ site.general.mobileservername ] = site;
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
     * @param {string} [hostname]
     * @returns {Promise<*|{}>}
     */
    static async getSpecialPages( hostname ) {
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
        const data = await Api.get( params, hostname );

        try {
            // Set the localized specialPages pairs
            if ( data.query.normalized ) {
                data.query.normalized.forEach( item => {
                    this.specialPagesLocal[ item.from ] = item.to;
                } );
            }

            // Cache data with expiry
            mw.storage.setObject( `${ id.config.prefix }-specialPagesLocal`, this.specialPagesLocal, utils.defaults( 'storageExpiry' ) );

            return this.specialPagesLocal;
        } catch ( error ) {
            utils.notifyError( 'error-api-generic', {
                type: 'api',
                message: error?.message || error,
            }, null, true );
        }
    }

    /******* INTERWIKI MAP *******/

    /**
     * @type {Array}
     */
    static interwikiMap = [];

    static async getInterwikiMap( hostname ) {
        // Try to get cached data from the local storage
        if ( !utils.isNew() && utils.isEmpty( this.interwikiMap ) ) {
            this.interwikiMap = mw.storage.getObject( `${ id.config.prefix }-interwikiMap` ) || [];
        }

        // Ty to get data from the static property
        if ( !utils.isEmpty( this.interwikiMap ) ) {
            return this.interwikiMap;
        }

        // Request data via API
        const params = {
            action: 'query',
            meta: 'siteinfo',
            siprop: 'interwikimap',
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
        };
        const data = await this.get( params, hostname );

        try {
            // Cache data with expiry
            this.interwikiMap = data.query.interwikimap;
            mw.storage.setObject( `${ id.config.prefix }-interwikiMap`, this.interwikiMap, utils.defaults( 'storageExpiry' ) );

            return this.interwikiMap;
        } catch ( error ) {
            utils.notifyError( 'error-api-generic', {
                type: 'api',
                message: error?.message || error,
            }, null, true );
        }
    }

    /******* WIKIBASE LABEL *******/

    static async getWBLabel( entityId, hostname ) {
        if ( utils.isEmpty( entityId ) || !/^[QPL][0-9]+$/.test( entityId ) ) return;

        // Request data via API
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
        const data = await this.get( params, hostname );

        try {
            const entity = data.entities[ entityId ];
            if ( entity.type === 'lexeme' ) {
                return Object.values( entity.lemmas )
                    .map( lemma => lemma.value )
                    .join( '/' );
            }
            return entity.labels[ language ].value;
        } catch ( error ) {
            utils.notifyError( 'error-api-generic', {
                type: 'api',
                message: error?.message || error,
            }, null, true );
        }
    }
}

export default Api;