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

import './styles.less';

/**
 * Extension config.
 * @type {Record<string, Record>}
 */
export const schema = {
	name: 'Extension-FlaggedRevs',
	enabled: true,
	enabledCondition: () => utils.hasModules( [ 'ext.flaggedRevs.basic' ] ),
	dependencies: {
		page: {
			'*': [
				'ext.flaggedRevs.basic',
				'ext.flaggedRevs.review',
			],
		},
	},
	selectors: {
		linkSelector: [
			'.mw-fr-reviewlink a',              // Changelists: pending changes link
			'#mw-fr-revision-messages a',       // Mobile warning
			'#mw-fr-revision-details a',        // Desktop popup
		],
		mwLink: {
			closestTo: [
				'.mw-fr-hist-difflink',         // Page history: pending review link
				'#mw-fr-reviewnotice',
				'#mw-fr-revisiontag',
				'#mw-fr-revisiontag-edit',
				'#mw-fr-revision-tag-edit',
			],
		},
		mwLinkAltTitle: {
			closestTo: [
				'.mw-fr-reviewlink',            // Changelists: pending changes link
			],
		},
	},
	hooks: {
		'pageAdjustments': processPageAdjustments,
		'page.renderSuccess': processPage,
	},
};

/**
 * Processes special pages.
 */
function processPageAdjustments() {
	if ( id.local.mwCanonicalSpecialPageName === 'RevisionReview' ) {
		processRevisionReview();
	}
	if ( id.local.mwCanonicalSpecialPageName === 'PendingChanges' ) {
		processPendingChanges();
	}
}

/**
 * Processes Special:RevisionReview.
 */
function processRevisionReview() {
	const $container = utils.getContentNode();

	// Mark the diff list lines as ready to be processed
	$container
		.find( 'ul li' )
		.attr( 'data-instantdiffs-line', 'all' );
}

/**
 * Processes Special:PendingChanges.
 */
function processPendingChanges() {
	const $container = utils
		.getContentNode()
		.find( '.mw-fr-pending-changes-table' );

	// Mark the diff list lines as ready to be processed
	$container
		.find( 'tr' )
		.attr( 'data-instantdiffs-line', '' );

	// Mark elements that contain page titles to be collected for diff links
	$container
		.find( '.mw-fr-pending-changes-page-title' )
		.attr( 'data-instantdiffs-line-title', '' );

	// Mark links as ready to be processed
	$container
		.find( 'a.cdx-docs-link' )
		.attr( 'data-instantdiffs-link', 'mw' );
}

/**
 * Processes Page view.
 * @param {import('../../Page').Page.Any} page
 */
function processPage( page ) {
	if ( !page ) return;
	new ReviewForm( page );
}