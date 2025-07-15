import id from './id';
import { defaults, isEmptyObject, isNew, notifyError, spacesToUnderlines } from './utils';

import Api from './Api';

/**
 * Requests localized special page names.
 * @param [hostname]
 * @returns {Promise<*|{}>}
 */
export async function getSpecialPages( hostname ) {
    // Convert data array to the pairs
    if ( isEmptyObject( id.local.specialPages ) ) {
        id.config.specialPages.forEach( name => {
            id.local.specialPages[ name ] = name;
        } );
    }

    // Try to get cached data from the local storage
    if ( !isNew() && isEmptyObject( id.local.specialPagesLocal ) ) {
        id.local.specialPagesLocal = mw.storage.getObject( `${ id.config.prefix }-specialPagesLocal` ) || {};
    }

    // Ty to get data from the singleton
    if (
        !isEmptyObject( id.local.specialPagesLocal ) &&
        Object.keys( id.local.specialPagesLocal ).length === Object.keys( id.local.specialPages ).length
    ) {
        return id.local.specialPagesLocal;
    }

    // Set the fallback specialPages pairs
    for ( const [ key, value ] of Object.entries( id.local.specialPages ) ) {
        id.local.specialPagesLocal[ key ] = value;
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
                id.local.specialPagesLocal[ item.from ] = item.to;
            } );
        }

        // Cache data with expiry
        mw.storage.setObject( `${ id.config.prefix }-specialPagesLocal`, id.local.specialPagesLocal, defaults( 'storageExpiry' ) );

        return id.local.specialPagesLocal;
    } catch ( error ) {
        notifyError( 'error-api-generic', {
            type: 'api',
            message: error?.message || error,
        }, null, true );
    }
}

/**
 * Requests namespaces and formats them for the mw.config.
 * @param [hostname]
 * @returns {Promise<*|{}>}
 */
export async function getNamespaceConfig( hostname ) {
    const data = await Api.getNamespaces( hostname );
    if ( isEmptyObject( data ) ) return;

    return {
        wgFormattedNamespaces: Object.values( data.namespaces ).reduce( ( obj, value ) => {
            obj[ value.id ] = value.canonical || '';
            return obj;
        }, {} ),

        wgNamespaceIds: {
            ...Object.values( data.namespaces ).reduce( ( obj, value ) => {
                obj[ spacesToUnderlines( value.name.toLowerCase() ) ] = value.id;
                if ( value.canonical ) {
                    obj[ spacesToUnderlines( value.canonical.toLowerCase() ) ] = value.id;
                }
                return obj;
            }, {} ),
            ...data.namespaceAliases.reduce( ( obj, alias ) => {
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
}