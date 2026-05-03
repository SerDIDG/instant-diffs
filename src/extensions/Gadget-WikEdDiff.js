/**
 * GADGET: WIKI ED DIFF
 * @see {@link https://en.wikipedia.org/wiki/User:Cacycle/wikEdDiff}
 */

import id from '../id';

mw.hook( `${ id.config.prefix }.page.beforeDetach` ).add(
	/**
	 * @param {import('../Page').default} page
	 */
	( page ) => {
		if ( !page ) return;

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
	},
);