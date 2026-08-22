/**
 * PAGE: HISTORY
 *
 * Adds enhancements to page history pages:
 * - adds instantDiffs-line CSS class that adds spacing between selector checkboxes;
 * - adds a compare button to the revision selector;
 * - makes diff links for the first page edit if possible;
 * - wraps empty diff links with placeholders.
 * @see {@link https://www.mediawiki.org/wiki/Help:History}
 */

import * as utils from '../utils';

import HistoryCompareButton from '../HistoryCompareButton';

/**
 * Extension config.
 * @type {Record<string, any>}
 */
export const schema = {
	name: 'Page-History',
	enabled: true,
	hooks: {
		'pageAdjustments': processPageAdjustments,
	},
};

/**
 * Process page history pages.
 * @param {import('../id').InstantDiffsNamespace} id
 */
function processPageAdjustments( id ) {
	if ( id.local.mwAction !== 'history' ) return;

	// Add an instantDiffs-line CSS class that adds spaces between selector checkboxes
	const $revisionLines = $( '#pagehistory > li, #pagehistory .mw-contributions-list > li' )
		.addClass( 'instantDiffs-line--history' );

	// Makes diff links and wrap empty links
	$revisionLines.each( ( i, node ) => {
		const $line = $( node );
		const $cur = $line.find( '.mw-history-histlinks > span:first-child' );
		const $prev = $line.find( '.mw-history-histlinks > span:last-child' );
		if ( $cur.find( 'a' ).length === 0 ) {
			$cur.wrapInner( utils.renderPlaceholder() );
		}
		if ( $prev.find( 'a' ).length === 0 ) {
			utils.wrapContributionsDiffLink( $line, $prev, [ 'mw-history-histlinks-previous' ] );
		}
	} );

	// Add a compare button only if the number of lines is greater than 1
	if ( $revisionLines.length <= 1 ) return;

	// Dynamic revision selector
	const $revisionSelector = $( '.mw-history-compareselectedversions' );
	$revisionSelector.each( ( i, node ) => {
		const $container = $( node );
		const $button = $container.find( '.mw-history-compareselectedversions-button' );

		new HistoryCompareButton( {
			label: utils.msg( 'compare-label', utils.getLabel( 'diff' ) ),
			title: utils.msg( 'compare-title', utils.msg( 'script-name' ) ),
			classes: [ 'mw-ui-button', 'cdx-button', 'instantDiffs-button--compare' ],
			insertMethod: 'insertAfter',
			container: $button,
		} );

		$( '<span>' )
			.text( ' ' )
			.addClass( 'instantDiffs-spacer' )
			.insertAfter( $button );
	} );
}