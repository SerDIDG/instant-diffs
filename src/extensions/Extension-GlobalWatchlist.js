/**
 * EXTENSION: GLOBAL WATCHLIST
 *
 * Adds support for links in the Global Watchlist.
 * @see {@link https://www.mediawiki.org/wiki/Extension:GlobalWatchlist}
 */

import id from '../id';
import * as utils from '../utils';

/**
 * Adds support for links in the Global Watchlist.
 * @param {Object} context
 * @param {HTMLElement} context.root
 * @param {boolean} context.inLive
 * @param {boolean} context.fastMode
 * @param {Date} context.timestamp
 */
function process( context ) {
	if ( !context?.root || !utils.isAllowed() ) return;

	mw.hook( `${ id.config.prefix }.process` ).fire( $( context.root ) );
}

mw.hook( 'ext.globalwatchlist.rebuild' ).add( process );