/**
 * GADGET: TWINKLE
 * @see {@link https://en.wikipedia.org/wiki/Wikipedia:Twinkle}
 * @see {@link https://meta.wikimedia.org/wiki/User:Xiplus/TwinkleGlobal}
 */

import id from '../id';

mw.hook( `${ id.config.prefix }.page.complete` ).add(
	/**
	 * @param {import('../Page').default} page
	 */
	( page ) => {
		if ( !page ) return;

		const $links = page.getContainer()?.find( '[id^="tw-revert"] a' );
		$links.each( ( i, node ) => {
			node.addEventListener( 'click', () => page.close() );
		} );
	},
);