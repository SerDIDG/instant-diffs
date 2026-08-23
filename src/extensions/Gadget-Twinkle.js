/**
 * GADGET: TWINKLE
 *
 * Adds the ability to close the View dialog when reverting a revision using Twinkle.
 * @see {@link https://en.wikipedia.org/wiki/Wikipedia:Twinkle}
 * @see {@link https://meta.wikimedia.org/wiki/User:Xiplus/TwinkleGlobal}
 */

/**
 * Extension configuration options.
 * @type {import('../Extensions').ExtenstionOptions}
 */
export const schema = {
	name: 'Gadget-Twinkle',
	enabled: true,
	hooks: {
		'page.complete': process,
	},
};

/**
 * Process Twinkle gadget.
 * @param {import('../Page').Page.Any} page
 */
function process( page ) {
	if ( !page || page.error ) return;

	const $links = page.getContainer().find( '[id^="tw-revert"] a' );
	$links.each( ( i, node ) => {
		node.addEventListener( 'click', () => page.close() );
	} );
}