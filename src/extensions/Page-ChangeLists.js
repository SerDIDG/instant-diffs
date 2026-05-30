import id from '../id';

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

mw.hook( `${ id.config.prefix }.applyPageAdjustments` ).add( ( id ) => {
	// Process GlobalWatchlist extension
	if ( id.local.mwCanonicalSpecialPageName === 'GlobalWatchlist' ) {
		processGlobalWatchlist();
	}
} );