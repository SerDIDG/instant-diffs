/**
 * EXTENSION: IPInfo
 * @see {@link https://www.mediawiki.org/wiki/Extension:IPInfo}
 */

import id from '../id';
import * as utils from '../utils';

import view from '../view';

/**
 * Attached IPInfo popups store.
 * @type {JQuery<HTMLElement>[]}
 */
const $ATTACHED_POPUPS = [];

/**
 * Attach IPInfo popups from the default overlay to the View dialog.
 * @param {import('../Page').default} page
 */
function attachPopups( page ) {
	const $defaultOverlay = OO.ui.getDefaultOverlay();
	const $viewOverlay = view.getDialog().getOverlay();

	const $buttons = page.getContainer()?.find( '.ext-ipinfo-button .oo-ui-buttonElement-button' );
	$buttons.each( ( i, node ) => {
		const ariaOwns = node.getAttribute( 'aria-owns' );
		if ( utils.isEmpty( ariaOwns ) ) return;

		const $popup = $defaultOverlay.find( `#${ ariaOwns }` );
		if ( $popup.length > 0 ) {
			$popup.appendTo( $viewOverlay );
			$ATTACHED_POPUPS.push( $popup );
		}
	} );
}

/**
 * Detach all IPInfo popups from the View dialog.
 * @param {import('../Page').default} page
 */
function detachPopups( page ) {
	$ATTACHED_POPUPS.forEach( $popup => $popup.detach() );
	$ATTACHED_POPUPS.length = 0;
}

mw.hook( `${ id.config.prefix }.page.complete` ).add( attachPopups );
mw.hook( `${ id.config.prefix }.page.beforeDetach` ).add( detachPopups );