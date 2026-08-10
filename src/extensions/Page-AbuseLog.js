/**
 * PAGE: ABUSE LOG
 *
 * Adds enhancements to the "Abuse Log" pages:
 * - marks the diff list lines as ready to be processed.
 * @see {@link https://www.mediawiki.org/wiki/Extension:AbuseFilter}
 */

import id from '../id';
import * as utils from '../utils';

/**
 * Marks the diff list lines as ready to be processed.
 */
function process() {
	const $container = utils.getContentNode();
	$container
		.find( 'li[data-afl-log-id]' )
		.attr( 'data-instantdiffs-line', 'all' );
}

mw.hook( `${ id.config.prefix }.pageAdjustments` ).add( ( id ) => {
	if ( id.local.mwCanonicalSpecialPageName === 'AbuseLog' ) {
		process();
	}
} );