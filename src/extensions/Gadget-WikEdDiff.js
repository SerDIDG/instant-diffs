/**
 * GADGET: WIKI ED DIFF
 *
 * Fixes the diff table linking issue that prevents wikEdDiff
 * from updating its contents when loading a new diff.
 * @see {@link https://en.wikipedia.org/wiki/User:Cacycle/wikEdDiff}
 */

/**
 * Extension config.
 * @type {Record<string, any>}
 */
export const schema = {
	name: 'Gadget-WikEdDiff',
	enabled: true,
	hooks: {
		'page.beforeDetach': process,
	},
};

/**
 * Process wikEdDiff gadget.
 * @param {import('../Page').Page.Any} page
 */
function process( page ) {
	if ( !page || page.error ) return;

	// Reset diff table linking
	// FixMe: Suggest a better solution
	const $diffTable = page.getDiffTable();
	if (
		typeof wikEd !== 'undefined' &&
		wikEd.diffTableLinkified &&
		( $diffTable?.length > 0 && wikEd.diffTable === $diffTable.get( 0 ) )
	) {
		wikEd.diffTableLinkified = false;
	}
}