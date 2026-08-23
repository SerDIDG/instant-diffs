/**
 * EXTENSION: GLOBAL WATCHLIST
 *
 * Adds enhancements to the Global Watchlist:
 * - marks the diff list lines as ready to be processed;
 * - marks links as ready to be processed;
 * - fires Instant Diffs proces hook.
 * @see {@link https://www.mediawiki.org/wiki/Extension:GlobalWatchlist}
 */

import id from '../id';
import * as utils from '../utils';

/**
 * Extension configuration options.
 * @type {import('../Extensions').ExtenstionOptions}
 */
export const schema = {
	name: 'Extension-GlobalWatchlist',
	enabled: true,
	onReady: ready,
};

/**
 * Extension ready.
 */
function ready() {
	mw.hook( 'ext.globalwatchlist.rebuild' ).add( process );
}

/**
 * Processes Global Watchlist.
 * @param {Object} context
 * @param {HTMLElement} context.root
 * @param {boolean} context.inLive
 * @param {boolean} context.fastMode
 * @param {Date} context.timestamp
 */
function process( context ) {
	if ( !utils.isAllowed() || !context?.root ) return;

	const $container = $( context.root );

	// Mark the diff list lines as ready to be processed
	$container
		.find( '.ext-globalwatchlist-site li' )
		.attr( 'data-instantdiffs-line', '' );

	// Mark links as ready to be processed
	$container
		.find( 'a.ext-globalwatchlist-diff' )
		.attr( 'data-instantdiffs-link', 'mw' );

	mw.hook( `${ id.config.prefix }.process` ).fire( $container );
}