/**
 * PAGE: EDIT TAGS
 *
 * Adds enhancements to the "Edit Tags" pages:
 * - marks the Selected revision list lines as ready to be processed.
 * @see {@link https://www.mediawiki.org/wiki/Manual:Tags}
 */

import id from '../id';
import * as utils from '../utils';

/**
 * Marks the Selected revision list lines as ready to be processed.
 */
function process() {
	const $container = utils.getContentNode();
	$container
		.find( 'li[class^="mw-tag"]' )
		.attr( 'data-instantdiffs-line', 'all' );
}

mw.hook( `${ id.config.prefix }.pageAdjustments` ).add( ( id ) => {
	if ( id.local.mwCanonicalSpecialPageName === 'EditTags' ) {
		process();
	}
} );