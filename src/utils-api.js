import id from './id';
import * as utils from './utils';

export function getForeignApi( origin ) {
    if ( !id.local.mwForeignApi[ origin ] ) {
        const apiEndPoint = `${ origin }${ mw.util.wikiScript( 'api' ) }`;
        id.local.mwForeignApi[ origin ] = new mw.ForeignApi( apiEndPoint );
    }
    return id.local.mwForeignApi[ origin ];
}

export async function getInterwikiMap() {
    if ( !utils.isEmpty( id.local.interwikiMap ) ) {
        return id.local.interwikiMap;
    }

    const data = await id.local.mwApi.get( {
        action: 'query',
        meta: 'siteinfo',
        siprop: 'interwikimap',
        format: 'json',
        formatversion: 2,
        uselang: id.local.userLanguage,
    } );

    try {
        return id.local.interwikiMap = data.query.interwikimap;
    } catch ( error ) {
        utils.notifyError( 'error-api-generic', {
            type: 'api',
            message: error?.message || error,
        }, null, true );
    }
}

export async function getNamespaces( origin ) {
    if ( !utils.isEmpty( id.local.mwForeignNamespaces[ origin ] ) ) {
        return id.local.mwForeignNamespaces[ origin ];
    }

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
        return id.local.mwForeignNamespaces[ origin ] = namespaces;
    } catch ( error ) {
        utils.notifyError( 'error-api-generic', {
            type: 'api',
            message: error?.message || error,
        }, null, true );
    }
}