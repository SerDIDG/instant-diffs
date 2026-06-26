/**
 * PAGE: CHANGELISTS
 *
 * Adds enhancements to watchlist pages:
 * - sets up a mutation observer to detect dynamic content changes in GlobalWatchlist.
 * @see {@link https://www.mediawiki.org/wiki/Help:Watchlist}
 * @see {@link https://www.mediawiki.org/wiki/Manual:Watchlist}
 * @see {@link https://www.mediawiki.org/wiki/Extension:GlobalWatchlist}
 */

import id from '../id';

/**
 * Process GlobalWatchlist extension pages:
 * - sets up a mutation observer to detect dynamic content changes.
 * @see {@link https://phabricator.wikimedia.org/T275159}
 */
function processGlobalWatchlist() {
	// ToDo: remove mutation observer after hooks are implemented (T275159)
	const container = document.getElementById( 'ext-globalwatchlist-watchlistsfeed' );
	id.local.mutationObserver.observe( container, {
		childList: true,
	} );
}

mw.hook( `${ id.config.prefix }.applyPageAdjustments` ).add( ( id ) => {
	// Process GlobalWatchlist extension
	if ( id.local.mwCanonicalSpecialPageName === 'GlobalWatchlist' ) {
		processGlobalWatchlist();
	}
} );