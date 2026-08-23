/**
 * PAGE: ABUSE LOG
 *
 * Adds enhancements to the "Abuse Log" pages:
 * - marks the diff list lines as ready to be processed.
 * @see {@link https://www.mediawiki.org/wiki/Extension:AbuseFilter}
 */

import * as utils from '../utils';

/**
 * Extension configuration options.
 * @type {import('../Extensions').ExtenstionOptions}
 */
export const schema = {
	name: 'Page-AbuseLog',
	enabled: true,
	hooks: {
		'pageAdjustments': processPageAdjustments,
	},
};

/**
 * Processes special pages.
 * @param {import('../id').InstantDiffsNamespace} id
 */
function processPageAdjustments( id ) {
	if ( id.local.mwCanonicalSpecialPageName !== 'AbuseLog' ) return;

	// Mark the diff list lines as ready to be processed
	const $container = utils.getContentNode();
	$container
		.find( 'li[data-afl-log-id]' )
		.attr( 'data-instantdiffs-line', 'all' );
}