/**
 * GADGET: TWINKLE
 *
 * Adds the ability to close the View dialog when reverting a revision using Twinkle.
 * @see {@link https://en.wikipedia.org/wiki/Wikipedia:Twinkle}
 * @see {@link https://meta.wikimedia.org/wiki/User:Xiplus/TwinkleGlobal}
 */

import id from '../id';

/**
 * Process Twinkle gadget.
 * @param {import('../Page').default} page
 */
function process( page ) {
	if ( !page || page.error ) return;

	const $links = page.getContainer()?.find( '[id^="tw-revert"] a' );
	$links.each( ( i, node ) => {
		node.addEventListener( 'click', () => page.close() );
	} );
}

mw.hook( `${ id.config.prefix }.page.complete` ).add( process );