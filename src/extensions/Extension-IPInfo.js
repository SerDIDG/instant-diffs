/**
 * EXTENSION: IPINFO
 *
 * Fixes inaccessible IP info popups in the Instant Diffs View dialog
 * by attaching them from the default overlay (@since 1.47) to the View dialog overlay.
 * @see {@link https://www.mediawiki.org/wiki/Extension:IPInfo}
 */

import * as utils from '../utils';

import view from '../view';

/**
 * Extension configuration options.
 * @type {import('../Extensions').ExtenstionOptions}
 */
export const schema = {
	name: 'Extension-IPInfo',
	enabled: true,
	hooks: {
		'page.complete': attachPopups,
		'page.beforeDetach': detachPopups,
	},
};

/**
 * Attached IPInfo popups store.
 * @type {JQuery<HTMLElement>[]}
 */
const $ATTACHED_POPUPS = [];

/**
 * Attach IPInfo popups from the default overlay to the View dialog.
 * @param {import('../Page').Page.Any} page
 */
function attachPopups( page ) {
	if ( !page ) return;

	const $defaultOverlay = OO.ui.getDefaultOverlay();
	const $viewOverlay = view.getDialog().getOverlay();

	const $buttons = page.getContainer().find( '.ext-ipinfo-button .oo-ui-buttonElement-button' );
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
 * @param {import('../Page').Page.Any} page
 */
function detachPopups( page ) {
	if ( !page ) return;

	$ATTACHED_POPUPS.forEach( $popup => $popup.detach() );
	$ATTACHED_POPUPS.length = 0;
}