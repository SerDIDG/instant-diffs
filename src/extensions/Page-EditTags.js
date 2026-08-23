/**
 * PAGE: EDIT TAGS
 *
 * Adds enhancements to the "Edit Tags" pages:
 * - marks the "Selected revision" list lines as ready to be processed.
 * @see {@link https://www.mediawiki.org/wiki/Manual:Tags}
 */

import * as utils from '../utils';

/**
 * Extension configuration options.
 * @type {import('../Extensions').ExtenstionOptions}
 */
export const schema = {
	name: 'Page-EditTags',
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
	if ( id.local.mwCanonicalSpecialPageName !== 'EditTags' ) return;

	// Mark the "Selected revision" list lines as ready to be processed
	const $container = utils.getContentNode();
	$container
		.find( 'li[class^="mw-tag"]' )
		.attr( 'data-instantdiffs-line', 'all' );
}