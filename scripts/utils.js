/**
 * Partially copied from:
 * @see {@link https://github.com/jwbth/convenient-discussions/blob/main/misc/utils.js}
 */

/**
 * @param {string} string
 * @return {string}
 */
function replaceEntitiesInI18n( string ) {
    return string
        .replace( /&nbsp;/g, '\xa0' )
        .replace( /&#32;/g, ' ' )
        .replace( /&rlm;/g, '\u200f' )
        .replace( /&lrm;/g, '\u200e' );
}

function hideText( text, regexp, hidden ) {
    return text.replace( regexp, ( s ) => '\x01' + hidden.push( s ) + '\x02' );
}

function unhideText( text, hidden ) {
    while ( text.match( /\x01\d+\x02/ ) ) {
        text = text.replace( /\x01(\d+)\x02/g, ( s, num ) => hidden[ num - 1 ] );
    }
    return text;
}

module.exports = { replaceEntitiesInI18n, hideText, unhideText };