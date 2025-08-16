import id from './id';
import * as utils from './utils';

export function getSplitSpecialUrl( title ) {
    const titleParts = title.split( '/' );
    const values = {};

    // Check for the 'Special:PermanentLink'
    const permanentLink = id.local.specialPagesAliasesPrefixed[ 'Special:PermanentLink' ];
    if ( permanentLink.includes( titleParts[ 0 ] ) ) {
        values.oldid = titleParts[ 1 ];
        return values;
    }

    // Check for the 'Special:Redirect'
    const redirect = id.local.specialPagesAliasesPrefixed[ 'Special:Redirect' ];
    if ( redirect.includes( titleParts[ 0 ] ) ) {
        if ( titleParts[ 1 ] === 'revision' ) {
            values.oldid = titleParts[ 2 ];
            return values;
        }
        return values;
    }

    // Other special pages
    if ( titleParts.length > 1 ) {
        values.diff = titleParts.pop();
    }
    if ( titleParts.length > 1 ) {
        values.oldid = titleParts.pop();
    }
    return values;
}

/**
 * Checks if a link matches a given selectors preset.
 * @param {Element} node
 * @param {Object} [preset]
 * @param {Array} [preset.id]
 * @param {Array} [preset.hasClass]
 * @param {Array} [preset.hasChild]
 * @param {Array} [preset.closestTo]
 * @returns {boolean}
 */
export function isMWLink( node, preset ) {
    let isConfirmed = false;

    // Validate preset
    preset = preset || id.config.mwLink;

    // Check if a node id matches
    if ( preset.id ) {
        isConfirmed = preset.id.some( entry => ( node.id === entry ) );
        if ( isConfirmed ) return isConfirmed;
    }

    // Check if a node contains a className
    if ( preset.hasClass ) {
        isConfirmed = preset.hasClass.some( entry => node.classList.contains( entry ) );
        if ( isConfirmed ) return isConfirmed;
    }

    // Check if a node contains children by a selector
    if ( preset.hasChild ) {
        isConfirmed = preset.hasChild.some( entry => node.querySelector( entry ) );
        if ( isConfirmed ) return isConfirmed;
    }

    // Check if a node is a child of a parent by a selector
    if ( preset.closestTo ) {
        isConfirmed = preset.closestTo.some( entry => node.closest( entry ) );
    }
    return isConfirmed;
}

export function getMWLine( node ) {
    return node.closest( id.config.mwLine.selector.join( ',' ) );
}

export function getMWLineTitle( container ) {
    // Get title from the data attribute, if the container has one.
    const title = container.dataset.title;
    if ( !utils.isEmpty( title ) ) {
        return decodeURIComponent( title );
    }

    // Get nodes from the selector list
    const selector = id.config.mwLineTitle.selector.join( ',' );
    const node = container.querySelector( selector );
    if ( !node ) return;

    return !utils.isEmpty( node.title ) ? node.title : node.innerText;
}