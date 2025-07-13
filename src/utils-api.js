import id from './id';
import * as utils from './utils';

export function getForeignApi( origin ) {
    if ( utils.isEmpty( origin ) ) return id.local.mwApi;

    if ( !id.local.mwForeignApi[ origin ] ) {
        const apiEndPoint = `${ origin }${ mw.util.wikiScript( 'api' ) }`;
        id.local.mwForeignApi[ origin ] = new mw.ForeignApi( apiEndPoint );
    }

    return id.local.mwForeignApi[ origin ];
}

export async function getInterwikiMap( origin ) {
    // Try to get data from the local storage
    if ( utils.isEmpty( id.local.mwInterwikiMap ) ) {
        id.local.mwInterwikiMap = mw.storage.getObject( `${ id.config.prefix }-interwikiMap` ) || [];
    }

    // Ty to get data from the singleton
    if ( !utils.isEmpty( id.local.mwInterwikiMap ) ) {
        return id.local.mwInterwikiMap;
    }

    // Request data via API
    const api = getForeignApi( origin );
    const data = await api.get( {
        action: 'query',
        meta: 'siteinfo',
        siprop: 'interwikimap',
        format: 'json',
        formatversion: 2,
        uselang: id.local.userLanguage,
    } );

    try {
        // Cache data with expiry
        id.local.mwInterwikiMap = data.query.interwikimap;
        mw.storage.setObject( `${ id.config.prefix }-interwikiMap`, id.local.mwInterwikiMap, utils.defaults( 'storageExpiry' ) );

        return id.local.mwInterwikiMap;
    } catch ( error ) {
        utils.notifyError( 'error-api-generic', {
            type: 'api',
            message: error?.message || error,
        }, null, true );
    }
}

export async function getNamespaces( origin ) {
    // Try to get data from the local storage
    if ( utils.isEmptyObject( id.local.mwForeignNamespaces ) ) {
        id.local.mwForeignNamespaces = mw.storage.getObject( `${ id.config.prefix }-namespaces` ) || {};
    }

    // Ty to get data from the singleton
    if ( !utils.isEmpty( id.local.mwForeignNamespaces[ origin ] ) ) {
        return id.local.mwForeignNamespaces[ origin ];
    }

    // Request data via API
    const api = getForeignApi( origin );
    const data = await api.get( {
        action: 'query',
        meta: 'siteinfo',
        siprop: 'namespaces',
        format: 'json',
        formatversion: 2,
        uselang: id.local.userLanguage,
    } );

    try {
        const namespaces = {};
        for ( const [ key, value ] of Object.entries( data.query.namespaces ) ) {
            namespaces[ key ] = value.canonical;
        }

        // Cache data with expiry
        id.local.mwForeignNamespaces[ origin ] = namespaces;
        mw.storage.setObject( `${ id.config.prefix }-namespaces`, id.local.mwForeignNamespaces, utils.defaults( 'storageExpiry' ) );

        return namespaces;
    } catch ( error ) {
        utils.notifyError( 'error-api-generic', {
            type: 'api',
            message: error?.message || error,
        }, null, true );
    }
}

export async function getWBLabel( entityId, origin ) {
    if ( utils.isEmpty( entityId ) || !/^[QPL][0-9]+$/.test( entityId ) ) return;

    // Request data via API
    const api = getForeignApi( origin );
    const data = await api.get( {
        action: 'wbgetentities',
        props: 'labels',
        ids: entityId,
        languages: id.local.userLanguage,
        languagefallback: 1,
        format: 'json',
        formatversion: 2,
        uselang: id.local.userLanguage,
    } );

    try {
        const entity = data.entities[ entityId ];
        if ( entity.type === 'lexeme' ) {
            return Object.values( entity.lemmas )
                .map( lemma => lemma.value )
                .join( '/' );
        }
        return entity.labels[ id.local.userLanguage ].value;
    } catch ( error ) {
        utils.notifyError( 'error-api-generic', {
            type: 'api',
            message: error?.message || error,
        }, null, true );
    }
}