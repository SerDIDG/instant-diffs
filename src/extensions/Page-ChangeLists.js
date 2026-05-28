import id from '../id';

/**
 * Process changelists (RecentChanges, Watchlist, etc.).
 * Adds styling classes to changelist lines.
 */
export function process() {
	// Mark changelist lines with Instant Diffs CSS class
	if ( id.config.changeLists.includes( id.local.mwCanonicalSpecialPageName ) ) {
		$( '.mw-changeslist-line' ).addClass( 'instantDiffs-line' );
	}

	// Process GlobalWatchlist extension
	if ( id.local.mwCanonicalSpecialPageName === 'GlobalWatchlist' ) {
		return processGlobalWatchlist();
	}
}

/**
 * Process GlobalWatchlist extension pages.
 * Sets up mutation observer to detect dynamic content changes.
 * @see {@link https://phabricator.wikimedia.org/T275159}
 */
function processGlobalWatchlist() {
	// ToDo: remove mutation observer after hooks are implemented (T275159)
	const container = document.getElementById( 'ext-globalwatchlist-watchlistsfeed' );
	id.local.mutationObserver.observe( container, {
		childList: true,
	} );
}