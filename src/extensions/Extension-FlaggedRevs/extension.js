/**
 * EXTENSION: FLAGGED REVS
 *
 * Adds enhancements to the "Revision Review" special page:
 * - marks the diff list lines as ready to be processed.
 * Adds enhancements to the Page view:
 * - requests FlaggedRevs form and renders review button.
 * @see {@link https://www.mediawiki.org/wiki/Extension:FlaggedRevs}
 */

import id from '../../id';
import * as utils from '../../utils';

import ReviewForm from './ReviewForm';

/**
 * Marks the diff list lines as ready to be processed.
 */
function processRevisionReview() {
	const $container = utils.getContentNode();
	$container
		.find( 'ul li' )
		.attr( 'data-instantdiffs-line', 'all' );
}

mw.hook( `${ id.config.prefix }.page.renderSuccess` ).add(
	/**
	 * @param {import('../../Page').Page.Any} page
	 */
	( page ) => {
		if ( !page ) return;
		new ReviewForm( page );
	},
);

mw.hook( `${ id.config.prefix }.pageAdjustments` ).add( ( id ) => {
	// Process Special:RevisionReview
	if ( id.local.mwCanonicalSpecialPageName === 'RevisionReview' ) {
		processRevisionReview();
	}
} );