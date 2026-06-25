/**
 * PAGE: HISTORY
 *
 * Adds enhancements to page history pages:
 * - adds instantDiffs-line CSS class that adds spacing between selector checkboxes
 * - fills empty diff links with placeholders
 * - adds a compare button to the revision selector
 * @see {@link https://www.mediawiki.org/wiki/Help:History}
 */

import id from '../id';
import * as utils from '../utils';

import HistoryCompareButton from '../HistoryCompareButton';

/**
 * Process page history pages.
 * Adds styling, fills empty diff links, and creates compare buttons.
 */
function process() {
	// Add an instantDiffs-line CSS class that adds spaces between selector checkboxes
	const $revisionLines = $( '#pagehistory > li, #pagehistory .mw-contributions-list > li' )
		.addClass( 'instantDiffs-line--history' );

	// Add a compare button only if the number of lines is greater than 1
	if ( $revisionLines.length <= 1 ) return;

	// Fill empty links
	$revisionLines.each( ( i, node ) => {
		const $container = $( node );
		const $cur = $container.find( '.mw-history-histlinks > span:first-child' );
		const $prev = $container.find( '.mw-history-histlinks > span:last-child' );
		if ( $cur.find( 'a' ).length === 0 ) {
			$cur.wrapInner( utils.renderPlaceholder() );
		}
		if ( $prev.find( 'a' ).length === 0 ) {
			$prev.wrapInner( utils.renderPlaceholder() );
		}
	} );

	// Dynamic revision selector
	const $revisionSelector = $( '.mw-history-compareselectedversions' );
	$revisionSelector.each( ( i, node ) => {
		const $container = $( node );
		const $button = $container.find( '.mw-history-compareselectedversions-button' );

		new HistoryCompareButton( {
			label: utils.msg( 'compare-label', id.config.labels.diff ),
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

mw.hook( `${ id.config.prefix }.applyPageAdjustments` ).add( ( id ) => {
	// Process local history pages
	if ( id.local.mwAction === 'history' ) {
		return process();
	}
} );