/**
 * EXTENSION: FLAGGED REVS
 *
 * Requests FlaggedRevs form and renders review button.
 * @see {@link https://www.mediawiki.org/wiki/Extension:FlaggedRevs}
 */

import id from '../id';
import { executeModuleScript } from '../utils-oojs';
import settings from '../settings';

/**
 * Requests FlaggedRevs form and renders review button.
 * @param {import('./Page').default} page
 */
function request( page ) {
	if (
		!settings.get( 'showDiffTools' ) ||
		!( page?.type === 'local' ) ||
		!page.getArticle().get( 'actions' ).review
	) {
		return;
	}

	// Render popup button
	page.nodes.flaggedRevsButton = new OO.ui.PopupButtonWidget( {
		icon: 'eyeClosed',
		label: 'Review',
		popup: {
			padded: false,
			align: 'force-right',
		},
	} );
	page.nodes.$diffTablePrefix.prepend( page.nodes.flaggedRevsButton.$element );

	// Toggle diff tools visibility
	page.diffTablePrefixTools.push( 'flaggedRevsButton' );
	page.checkDiffTablePrefix();

	// Request page HTML
	const articleParams = {
		action: 'view',
		useskin: 'apioutput',
	};
	const params = {
		url: id.local.mwEndPoint,
		dataType: 'html',
		data: $.extend( page.requestParams, articleParams ),
	};
	page.requestManager.ajax( params )
		.done( ( data ) => render( page, data ) );
}

/**
 * Finds and appends review form intro review button popover.
 * @param {import('./Page').default} page
 * @param {string} data
 */
function render( page, data ) {
	const $nodes = $( $.parseHTML( data ) );

	// Find and append review form
	const $reviewForm = $nodes.find( '#mw-fr-reviewform' );
	page.nodes.flaggedRevsButton.getPopup().$body.append( $reviewForm );

	// Restore review form JS code
	executeModuleScript( 'ext.flaggedRevs.review', 'review.js' );
}

mw.hook( `${ id.config.prefix }.page.complete` ).add( request );