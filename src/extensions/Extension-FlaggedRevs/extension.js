/**
 * EXTENSION: FLAGGED REVS
 *
 * Requests FlaggedRevs form and renders review button.
 * @see {@link https://www.mediawiki.org/wiki/Extension:FlaggedRevs}
 */

import id from '../../id';
import ReviewForm from './ReviewForm';

mw.hook( `${ id.config.prefix }.page.renderSuccess` ).add(
	/**
	 * @param {import('../../Page').Page.Any} page
	 */
	( page ) => {
		if ( !page ) return;
		new ReviewForm( page );
	},
);