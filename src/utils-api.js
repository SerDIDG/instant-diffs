import id from './id';
import { isEmpty, isEmptyObject, spacesToUnderlines } from './utils';

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

/**
 * Checks if a title meets the Wikibase entity criteria
 * @param {string} title
 * @return {boolean}
 */
export function isProbablyWbTitle( title ) {
    return !isEmpty( title ) && /^[QPL][0-9]+$/.test( title );
}

/**
 * Checks if a content model meets the Wikibase entity criteria
 * @param {string} contentModel
 * @return {boolean}
 */
export function isWbContentModel( contentModel ) {
    return !isEmpty( contentModel ) && contentModel.includes( 'wikibase' );
}

/**
 * Checks if a content model is probably editable.
 * @param {string} contentModel
 * @return {boolean}
 */
export function isEditableContentModel( contentModel ) {
    return !id.config.nonEditableContentModels.includes( contentModel );
}

/**
 * Gets a label for the Wikibse EntitySchema from the display title.
 * @param {string} displayTitle
 * @return {string|*}
 */
export function getEntitySchemaLabel( displayTitle ) {
    const $html = $( displayTitle );
    return $html.find( '.entityschema-title-label' ).text();
}

/**
 * Gets a label for the Wikilambda entity from the page props.
 * @param {Object} props
 * @return {string|*}
 */
export function getWikilambdaLabel( props ) {
    return !isEmptyObject( props ) && (
        props[ `wikilambda-label-${ id.local.userLanguage }` ] ||
        props[ 'wikilambda-label-en' ]
    );
}