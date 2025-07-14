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

export async function getSpecialPages( origin ) {
    // Convert data array to the pairs
    if ( utils.isEmptyObject( id.local.specialPages ) ) {
        id.config.specialPages.forEach( name => {
            id.local.specialPages[ name ] = name;
        } );
    }

    // Try to get cached data from the local storage
    if ( utils.isEmptyObject( id.local.specialPagesLocal ) && !utils.isNew() ) {
        id.local.specialPagesLocal = mw.storage.getObject( `${ id.config.prefix }-specialPagesLocal` ) || {};
    }

    // Ty to get data from the singleton
    if (
        !utils.isEmptyObject( id.local.specialPagesLocal ) &&
        Object.keys( id.local.specialPagesLocal ).length === Object.keys( id.local.specialPages ).length
    ) {
        return id.local.specialPagesLocal;
    }

    // Set the fallback specialPages pairs
    for ( const [ key, value ] of Object.entries( id.local.specialPages ) ) {
        id.local.specialPagesLocal[ key ] = value;
    }

    // Request localized specialPages for the current content language
    const api = getForeignApi( origin );
    const data = await api.get( {
        action: 'query',
        titles: id.config.specialPages,
        format: 'json',
        formatversion: 2,
        uselang: mw.config.get( 'wgContentLanguage' ),
    } );

    try {
        // Set the localized specialPages pairs
        if ( data.query.normalized ) {
            data.query.normalized.forEach( item => {
                id.local.specialPagesLocal[ item.from ] = item.to;
            } );
        }

        // Cache data with expiry
        mw.storage.setObject( `${ id.config.prefix }-specialPagesLocal`, id.local.specialPagesLocal, utils.defaults( 'storageExpiry' ) );

        return id.local.specialPagesLocal;
    } catch ( error ) {
        utils.notifyError( 'error-api-generic', {
            type: 'api',
            message: error?.message || error,
        }, null, true );
    }
}

export async function getInterwikiMap( origin ) {
    // Try to get cached data from the local storage
    if ( utils.isEmpty( id.local.mwInterwikiMap ) && !utils.isNew() ) {
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
    // Try to get cached data from the local storage
    if ( utils.isEmptyObject( id.local.mwForeignNamespaces ) && !utils.isNew() ) {
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
        const namespaces = { ...data.query.namespaces };
        for ( const value of Object.values( namespaces ) ) {
            value.nameDb = value.name?.trim().toLowerCase().replace( ' ', '_' ) || '';
            value.canonicalDb = value.canonical?.trim().toLowerCase().replace( ' ', '_' ) || '';
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
    const language = id.local.userLanguage;
    const api = getForeignApi( origin );
    const data = await api.get( {
        action: 'wbgetentities',
        props: 'labels',
        ids: entityId,
        languages: language,
        languagefallback: 1,
        format: 'json',
        formatversion: 2,
        uselang: language,
    } );

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