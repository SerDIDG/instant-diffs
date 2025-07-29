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
     * // @param {import('types-mediawiki/api_params').UnknownApiParams} params
     * @param {Object} params
     * @param {string} [hostname]
     * @return {mw.Api.AbortablePromise}
     */
    static get( params, hostname ) {
        return this.getApi( hostname ).get( params );
    }

    /**
     * mw.Api.post wrapper.
     * //@param {import('types-mediawiki/api_params').UnknownApiParams} params
     * @param {Object} params
     * @param {string} [hostname]
     * @return {mw.Api.AbortablePromise}
     */
    static post( params, hostname ) {
        return this.getApi( hostname ).post( params );
    }

    /**
     * mw.Api.watch wrapper.
     * @param {string|Array<string>} pages
     * @param {string} [expiry]
     * @param {string} [hostname]
     * @return {jQuery.Promise<mw.Api.WatchedPage|mw.Api.WatchedPage[]>}
     */
    static watch( pages, expiry, hostname ) {
        return this.getApi( hostname ).watch( pages, expiry );
    }

    /**
     * mw.Api.unwatch wrapper.
     * @param {string|Array<string>} pages
     * @param {string} [hostname]
     * @return {jQuery.Promise<mw.Api.WatchedPage|mw.Api.WatchedPage[]>}
     */
    static unwatch( pages, hostname ) {
        return this.getApi( hostname ).unwatch( pages );
    }

    /**
     * Logs an error.
     * @param {Error} error
     */
    static notifyError( error ) {
        utils.notifyError( 'error-api-generic', {
            type: 'api',
            message: error?.message || error,
        }, null, true );
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

        try {
            const { parse } = await this.post( params, hostname );
            return parse.text;
        } catch ( error ) {
            this.notifyError( error );
        }
    }

    /******* PAGE INFO *******/

    static async getPageInfo( params, hostname, requestManager ) {
        params = {
            action: 'query',
            prop: [ 'info', 'pageprops' ],
            inprop: [ 'watched', 'notificationtimestamp' ],
            intestactions: [ 'edit' ],
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
            ...params,
        };
        const api = requestManager ? requestManager : this;

        try {
            const data = await api.get( params, hostname );
            return data.query.pages[ 0 ];
        } catch ( error ) {
            this.notifyError( error );
        }
    }

    static async markAsSeen( params, hostname ) {
        params = {
            action: 'setnotificationtimestamp',
            redirects: 1,
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
            ...params,
        };

        try {
            const data = await Api.getApi( hostname ).postWithEditToken( params );
            return data.setnotificationtimestamp.notificationtimestamp;
        } catch ( error ) {
            this.notifyError( error );
        }
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
     * Gets the project info.
     * @param {Array} fields
     * @param {string} [hostname]
     * @param {import('./RequestManager').default} [requestManager]
     * @return {Promise<Object>}
     */
    static async getSiteInfo( fields = [], hostname, requestManager ) {
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
        const api = requestManager ? requestManager : this;

        try {
            const { query } = await api.get( params, hostname );

            if ( !this.siteInfo[ hostname ] ) {
                this.siteInfo[ hostname ] = {};
            }
            for ( const [ key, value ] of Object.entries( query ) ) {
                this.siteInfo[ hostname ][ key ] = value;
            }

            // Cache data with expiry
            mw.storage.setObject( `${ id.config.prefix }-siteInfo`, this.siteInfo, utils.defaults( 'storageExpiry' ) );

            this.processSiteInfoAliases( this.siteInfo[ hostname ] );
            return this.siteInfo[ hostname ];
        } catch ( error ) {
            this.notifyError( error );
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

        try {
            const { query } = await Api.get( params, hostname );

            // Set the localized specialPages pairs
            if ( query.normalized ) {
                query.normalized.forEach( item => {
                    this.specialPagesLocal[ item.from ] = item.to;
                } );
            }

            // Cache data with expiry
            mw.storage.setObject( `${ id.config.prefix }-specialPagesLocal`, this.specialPagesLocal, utils.defaults( 'storageExpiry' ) );

            return this.specialPagesLocal;
        } catch ( error ) {
            this.notifyError( error );
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

        try {
            const { query } = await this.get( params, hostname );

            // Cache data with expiry
            this.interwikiMap = query.interwikimap;
            mw.storage.setObject( `${ id.config.prefix }-interwikiMap`, this.interwikiMap, utils.defaults( 'storageExpiry' ) );

            return this.interwikiMap;
        } catch ( error ) {
            this.notifyError( error );
        }
    }

    /******* WIKIBASE LABEL *******/

    /**
     * Geta a localized page label from Wikibase.
     * @param {string} entityId
     * @param {string} [hostname]
     * @param {import('./RequestManager').default} [requestManager]
     * @return {Promise<*|string>}
     */
    static async getWBLabel( entityId, hostname, requestManager ) {
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
        const api = requestManager ? requestManager : this;

        try {
            const { entities } = await api.get( params, hostname );

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