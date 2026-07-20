import id from './id';
import * as utils from './utils';

import Site from './Site';

export function getSplitSpecialUrl( title ) {
	const titleParts = title.split( '/' );
	const values = {};

	// Check for the 'Special:PermanentLink'
	if (
		utils.checkSpecialPageTitle( 'Special:PermanentLink', titleParts[ 0 ] ) ||
		utils.checkSpecialPageTitle( 'Special:Permalink', titleParts[ 0 ] )
	) {
		values.oldid = titleParts[ 1 ];
		return values;
	}

	// Check for the 'Special:Redirect'
	if ( utils.checkSpecialPageTitle( 'Special:Redirect', titleParts[ 0 ] ) ) {
		if ( titleParts[ 1 ] === 'revision' ) {
			values.oldid = titleParts[ 2 ];
			return values;
		}
		if ( titleParts[ 1 ] === 'page' ) {
			values.curid = titleParts[ 2 ];
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
 * @param {Array} [preset.endsWith]
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
		isConfirmed = preset.id.includes( node.id );
		if ( isConfirmed ) return isConfirmed;
	}

	// Check if a node contains a className
	if ( preset.hasClass ) {
		isConfirmed = preset.hasClass.some( entry => node.classList.contains( entry ) );
		if ( isConfirmed ) return isConfirmed;
	}

	// Check if a node text content ends with a character
	if ( preset.endsWith ) {
		const text = node.textContent.trim();
		isConfirmed = preset.endsWith.some( entry => text.endsWith( entry ) );
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
	// Get title from the data attribute if container has one.
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

export function isAllowedAction( action ) {
	return !id.config.exclude.linkActions.includes( action );
}

/**
 * Memoizes hostname → domain-pattern-match results for the current page load.
 * @type {Map<string, boolean>}
 */
const domainMatchCache = new Map();

/**
 * Tests whether a hostname is allowed by the site's domain patterns config.
 * Checks the current site's own server names first, since most links
 * on a page point back to the same site.
 * @param {string} hostname
 * @returns {boolean}
 */
export function isAllowedDomain( hostname ) {
	const h = hostname.toLowerCase();
	if ( domainMatchCache.has( h ) ) return domainMatchCache.get( h );

	const isLocal = id.local.mwServerNames.some( ( name ) => name.toLowerCase() === h );
	if ( isLocal ) {
		domainMatchCache.set( h, true );
		return true;
	}

	const config = Site.getCORSConfig();
	if ( !config ) return false;

	let result = config.exact.has( h );
	if ( !result ) {
		let idx = h.indexOf( '.' );
		while ( idx !== -1 && !result ) {
			if ( config.wildcardBases.has( h.slice( idx + 1 ) ) ) result = true;
			idx = h.indexOf( '.', idx + 1 );
		}
	}
	if ( !result ) {
		result = config.globRegexes.some( ( re ) => re.test( h ) );
	}

	domainMatchCache.set( h, result );
	return result;
}