/**
 * EXTENSION: FLAGGED REVS
 *
 * Requests FlaggedRevs form and renders review button.
 * @see {@link https://www.mediawiki.org/wiki/Extension:FlaggedRevs}
 */

import id from '../id';
import * as utils from '../utils';
import { executeModuleScript, tweakUserOoUiClass } from '../utils-oojs';





mw.hook( `${ id.config.prefix }.page.renderSuccess` ).add( ( page ) => {
	if ( !page ) return;
	new ReviewForm( page );
} );