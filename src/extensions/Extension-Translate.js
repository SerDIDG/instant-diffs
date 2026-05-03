/**
 * EXTENSION: TRANSLATE
 * @see {@link https://www.mediawiki.org/wiki/Extension:Translate}
 */

import id from '../id';
import * as utils from '../utils';

mw.hook( 'mw.translate.editor.showTranslationHelpers' ).add(
	/**
	 * @param {Object} helpers
	 * @param {JQuery<HTMLElement>} $context
	 */
	( helpers, $context ) => {
		if ( !$context || !utils.isAllowed() ) return;

		mw.hook( `${ id.config.prefix }.process` ).fire( $context );
	},
);