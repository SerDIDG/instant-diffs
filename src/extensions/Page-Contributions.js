/**
 * PAGE: CONTRIBUTIONS
 *
 * Adds enhancements to user contribution pages:
 * - makes diff links for the first page edit if possible;
 * - wraps empty diff links with placeholders;
 * - fixes relative links in edit summaries by adding base URLs in GlobalContributions.
 * @see {@link https://www.mediawiki.org/wiki/Help:User_contributions}
 * @see {@link https://www.mediawiki.org/wiki/Extension:GlobalContributions}
 */

import id from '../id';
import * as utils from '../utils';

/**
 * Process user contribution pages:
 * - makes diff links for the first page edit if possible;
 * - wraps empty diff links with placeholders and handles.
 */
function process() {
	const $contributionsLines = $( '.mw-contributions-list li' );
	$contributionsLines.each( ( i, node ) => {
		const $line = $( node );
		const $span = $line.find( '.mw-changeslist-links:not(.mw-pager-tools, .mw-usertoollinks) > span:first-child' );
		if ( $span.find( 'a' ).length === 0 ) {
			utils.wrapContributionsDiffLink( $line, $span );
		}
	} );
}

/**
 * Process GlobalContributions extension pages:
 * - fixes relative links in edit summaries by adding base URLs.
 * @see {@link https://phabricator.wikimedia.org/T398108}
 */
function processGlobal() {
	// Fix relative links in the edit comments
	// The bug was particularly fixed in MediaWiki 1.45.0 (T398108)
	// ToDo: deprecate after the fix for links in the Wikidata edit summaries
	const $contributionsLines = $( '.mw-contributions-list li' );
	$contributionsLines.each( ( i, node ) => {
		const $line = $( node );
		const $link = $line.find( 'a.mw-changeslist-date, a.mw-changeslist-history' );
		if ( $link.length === 0 ) return;

		try {
			const url = new URL( $link.prop( 'href' ) );
			utils.addBaseToLinks( $line, url.origin );
		} catch {}
	} );
}

mw.hook( `${ id.config.prefix }.applyPageAdjustments` ).add( ( id ) => {
	// Process local user contributions
	if ( id.config.contributionLists.includes( id.local.mwCanonicalSpecialPageName ) ) {
		process();
	}

	// Process GlobalContributions extension
	if ( id.local.mwCanonicalSpecialPageName === 'GlobalContributions' ) {
		processGlobal();
	}
} );