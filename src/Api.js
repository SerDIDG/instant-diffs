import id from './id';
import { defaults, isEmpty, isEmptyObject, isNew, notifyError } from './utils';

class Api {
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
        if ( isEmpty( hostname ) || hostname === window.location.hostname ) {
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

    /******* NAMESPACES *******/

    /**
     * @type {Object}
     */
    static namespaces = {};

    /**
     * @type {Object}
     */
    static namespaceAliases = {};

    static async getNamespaces( hostname ) {
        // Try to get cached data from the local storage
        if ( !isNew() && isEmptyObject( this.namespaces ) ) {
            this.namespaces = mw.storage.getObject( `${ id.config.prefix }-namespaces` ) || {};
            this.namespaceAliases = mw.storage.getObject( `${ id.config.prefix }-namespaceAliases` ) || {};
        }

        // Ty to get data from the singleton
        if ( !isEmptyObject( this.namespaces[ hostname ] ) ) {
            return {
                namespaces: this.namespaces[ hostname ] || {},
                namespaceAliases: this.namespaceAliases[ hostname ] || [],
            };
        }

        // Request data via API
        const params = {
            action: 'query',
            meta: 'siteinfo',
            siprop: [ 'namespaces', 'namespacealiases' ],
            format: 'json',
            formatversion: 2,
            uselang: id.local.userLanguage,
        };
        const data = await this.get( params, hostname );

        try {
            // Cache data with expiry
            this.namespaces[ hostname ] = data.query.namespaces || {};
            this.namespaceAliases[ hostname ] = data.query.namespacealiases || [];
            mw.storage.setObject( `${ id.config.prefix }-namespaces`, this.namespaces, defaults( 'storageExpiry' ) );
            mw.storage.setObject( `${ id.config.prefix }-namespaceAliases`, this.namespaceAliases, defaults( 'storageExpiry' ) );

            return {
                namespaces: this.namespaces[ hostname ],
                namespaceAliases: this.namespaceAliases[ hostname ],
            };
        } catch ( error ) {
            notifyError( 'error-api-generic', {
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
        if ( !isNew() && isEmpty( this.interwikiMap ) ) {
            this.interwikiMap = mw.storage.getObject( `${ id.config.prefix }-interwikiMap` ) || [];
        }

        // Ty to get data from the singleton
        if ( !isEmpty( this.interwikiMap ) ) {
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
            mw.storage.setObject( `${ id.config.prefix }-interwikiMap`, this.interwikiMap, defaults( 'storageExpiry' ) );

            return this.interwikiMap;
        } catch ( error ) {
            notifyError( 'error-api-generic', {
                type: 'api',
                message: error?.message || error,
            }, null, true );
        }
    }

    /******* WIKIBASE LABEL *******/

    static async getWBLabel( entityId, hostname ) {
        if ( isEmpty( entityId ) || !/^[QPL][0-9]+$/.test( entityId ) ) return;

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
            notifyError( 'error-api-generic', {
                type: 'api',
                message: error?.message || error,
            }, null, true );
        }
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
            notifyError( 'error-api-generic', {
                type: 'api',
                message: error?.message || error,
            }, null, true );
        }
    }
}

export default Api;