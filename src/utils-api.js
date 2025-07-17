import { isEmptyObject, spacesToUnderlines } from './utils';

import Api from './Api';

/**
 * Get namespaces and formats them for the mw.config.
 * @param hostname
 * @returns {Object|undefined}
 */
export function getNamespaceConfig( hostname ) {
    const data = Api.siteInfoAliases[ hostname ];
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
}