import id from '../id';
import * as utils from '../utils';

/**
 * Process user contribution pages.
 * Fills empty diff links with placeholders and handles GlobalContributions.
 */
export function process() {
	// Fill empty links
	const $contributionsLines = $( '.mw-contributions-list .mw-changeslist-links:not(.mw-pager-tools) > span:first-child' );
	$contributionsLines.each( ( i, node ) => {
		const $node = $( node );
		if ( $node.find( 'a' ).length === 0 ) {
			$node.wrapInner( utils.renderPlaceholder() );
		}
	} );

	// Process GlobalContributions extension
	if ( id.local.mwCanonicalSpecialPageName === 'GlobalContributions' ) {
		processGlobal();
	}
}

/**
 * Process GlobalContributions extension pages.
 * Fixes relative links in edit summaries by adding base URLs.
 * @see {@link https://phabricator.wikimedia.org/T398108}
 */
function processGlobal() {
	// Fix relative links in the edit comments
	// The bug was particularly fixed in MediaWiki 1.45.0 (T398108)
	// ToDo: deprecate after the fix for links in the Wikidata edit summaries
	const $contributionsLines = $( '.mw-contributions-list li' );
	$contributionsLines.each( ( i, node ) => {
		const $node = $( node );
		const $link = $node.find( 'a.mw-changeslist-date, a.mw-changeslist-history' );
		if ( $link.length === 0 ) return;

		try {
			const url = new URL( $link.prop( 'href' ) );
			utils.addBaseToLinks( $node, url.origin );
		} catch {}
	} );
}