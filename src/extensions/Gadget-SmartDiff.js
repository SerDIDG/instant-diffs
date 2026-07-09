/**
 * GADGET: SMART DIFF
 *
 * Adds base url and target to anchor links in the diff table.
 * @see {@link https://en.wikipedia.org/wiki/User:Nardog/SmartDiff}
 */

import id from '../id';
import * as utils from '../utils';

/**
 * Adds base url and target to anchor links in the diff table.
 * @param {import('../Page').default} page
 */
function process( page ) {
	if ( !page ) return;

	const deletedHref = page.getArticle().get( 'deletedHref' );
	const $deletedLinks = page.getContainer().find( 'td.diff-side-deleted a.smartdiff-link' );
	if ( !utils.isEmpty( deletedHref ) && $deletedLinks.length > 0 ) {
		utils.addBaseToAnchors( $deletedLinks, deletedHref );
		utils.addTargetToLinks( $deletedLinks );
	}

	const addedHref = page.getArticle().get( 'addedHref' );
	const $addedLinks = page.getContainer().find( 'td.diff-side-added a.smartdiff-link' );
	if ( !utils.isEmpty( addedHref ) && $addedLinks.length > 0 ) {
		utils.addBaseToAnchors( $addedLinks, addedHref );
		utils.addTargetToLinks( $addedLinks );
	}
}

mw.hook( `${ id.config.prefix }.page.complete` ).add( process );