import * as utils from './utils';
import { es6ClassToOoJsClass, mixIntoClass } from './utils-oojs';
import { getHrefAbsolute } from './utils-article';

import ButtonWidgetMixin from './ButtonWidgetMixin';
import settings from './settings';

/**
 * MenuButton's own configuration options.
 * @typedef {Object} MenuButtonOwnOptions
 * @property {'default'|'navigation'|'pin'|'menu'} [type='default'] - A Button view type
 * @property {import('./Article').default} [article] - An Article instance
 * @property {(button: MenuButton, event: (MouseEvent|KeyboardEvent)) => void} [handler] - A click handler
 */

/**
 * MenuButton's configuration options.
 * @typedef {OO.ui.ButtonWidget.ConfigOptions & import('./ButtonWidgetMixin').ButtonWidgetMixin.Options & MenuButtonOwnOptions} MenuButton.Options
 */

/**
 * Class representing a custom ButtonWidget for the navigation menu.
 * @augments OO.ui.ButtonWidget
 * @augments {import('./ButtonWidgetMixin').default}
 */
class MenuButton extends mixIntoClass( OO.ui.ButtonWidget, ButtonWidgetMixin ) {
	/**
	 * Creates a MenuButton instance.
	 * @param {MenuButton.Options} [options] - A MenuButton configuration options
	 */
	constructor( options ) {
		// Validate options
		options = utils.deepMerge( {
			type: 'default',
			framed: true,
			icon: 'puzzle',
			modifiers: [],
		}, options );

		if ( options.type === 'navigation' ) {
			options.icon = null;
			options.modifiers.push( 'navigation' );
		}

		if ( options.type === 'pin' ) {
			options.invisibleLabel = true;
			options.modifiers.push( 'pin' );
		}

		if ( options.type === 'menu' ) {
			options.framed = false;
			options.modifiers.push( 'menu' );

			if ( !settings.get( 'showMenuIcons' ) ) {
				options.invisibleIcon = true;
			}
		}

		if ( !utils.isEmpty( options.name ) ) {
			options.modifiers.push( `action-${ options.name }` );
		}

		if ( !utils.isEmpty( options.href ) ) {
			options.href = getHrefAbsolute( options.article, options.href );
		}

		// Call parent class constructor
		super( options );
	}

	/**
	 * Gets the Article instance.
	 * @returns {import('./Article').default}
	 */
	getArticle() {
		return this.getOption( 'article' );
	}
}

es6ClassToOoJsClass( MenuButton );

export default MenuButton;