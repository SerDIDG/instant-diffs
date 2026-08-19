/**
 * EXTENSION: FLAGGED REVS
 *
 * Adds enhancements to the Special:RevisionReview and Special:PendingChanges pages:
 * - marks the diff list lines as ready to be processed;
 * - marks links as ready to be processed.
 * Adds enhancements to the Page view:
 * - requests FlaggedRevs form and renders the review button.
 * @see {@link https://www.mediawiki.org/wiki/Extension:FlaggedRevs}
 */

import id from '../../id';
import * as utils from '../../utils';

import ReviewForm from './ReviewForm';

/**
 * Processes Special:RevisionReview.
 */
function processRevisionReview() {
	const $container = utils.getContentNode();
	$container
		.find( 'ul li' )
		.attr( 'data-instantdiffs-line', 'all' );
}

/**
 * Processes Special:PendingChanges.
 */
function processPendingChanges() {
	const $container = utils.getContentNode();

	// Mark the diff list lines as ready to be processed
	$container
		.find( '.mw-fr-pending-changes-table tr' )
		.attr( 'data-instantdiffs-line', '' );

	// Mark links as ready to be processed
	$container
		.find( '.mw-fr-pending-changes-table a.cdx-docs-link' )
		.attr( 'data-instantdiffs-link', 'mw' );
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
	if ( id.local.mwCanonicalSpecialPageName === 'RevisionReview' ) {
		processRevisionReview();
	}
	if ( id.local.mwCanonicalSpecialPageName === 'PendingChanges' ) {
		processPendingChanges();
	}
} );