/**
 * Partially copied from:
 * @see {@link https://github.com/jwbth/convenient-discussions/blob/main/misc/utils.js}
 */

export function isEmpty( value ) {
    return !value || value.length === 0;
}

/**
 * @param {string} string
 * @return {string}
 */
export function replaceEntitiesInI18n( string ) {
    return string
        .replace( /&nbsp;/g, '\xa0' )
        .replace( /&#32;/g, ' ' )
        .replace( /&rlm;/g, '\u200f' )
        .replace( /&lrm;/g, '\u200e' );
}

export function hideText( text, regexp, hidden ) {
    return text.replace( regexp, ( s ) => '\x01' + hidden.push( s ) + '\x02' );
}

export function unhideText( text, hidden ) {
    while ( text.match( /\x01\d+\x02/ ) ) {
        text = text.replace( /\x01(\d+)\x02/g, ( s, num ) => hidden[ num - 1 ] );
    }
    return text;
}