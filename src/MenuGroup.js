import * as utils from './utils';
import { es6ClassToOoJsClass } from './utils-oojs';
import settings from './settings';

/**
 * MenuGroup's own configuration options.
 * @typedef {Object} MenuGroupOwnOptions
 * @property {Array<string>} [modifiers] - A list of class modifiers to add to the button element
 * @property {'vertical'|'horizontal'} [type='vertical'] - A Group view type
 * @property {boolean} [hidden=false] - Set hidden state
 */

/**
 * MenuButton's configuration options.
 * @typedef {OO.ui.ButtonGroupWidget.ConfigOptions & MenuGroupOwnOptions} MenuGroup.Options
 */

/**
 * Class representing a custom ButtonGroupWidget for the navigation menu.
 * @augments OO.ui.ButtonGroupWidget
 */
class MenuGroup extends OO.ui.ButtonGroupWidget {
	static CLASS_NAME = 'instantDiffs-buttons-group';

	/**
	 * Creates a ButtonGroupWidget instance.
	 * @param {MenuGroup.Options} [options] - A MenuButton configuration options
	 */
	constructor( options ) {
		// Validate options
		options = utils.deepMerge( {
			classes: [],
			modifiers: [],
			type: 'vertical',
			hidden: false,
		}, options );

		if ( options.type === 'vertical' ) {
			options.modifiers.push( 'vertical' );
			if ( settings.get( 'showMenuIcons' ) ) {
				options.classes.push( 'has-icons' );
			}
		}

		if ( options.type === 'horizontal' ) {
			options.modifiers.push( 'horizontal' );
		}

		if ( !utils.isEmpty( options.name ) ) {
			options.modifiers.push( options.name );
		}

		// Call parent class constructor
		super( options );

		// Elements
		this.$element.addClass( MenuGroup.CLASS_NAME );

		// Set properties
		if ( options.modifiers ) {
			this.setModifiers( options.modifiers );
		}
		if ( options.hidden ) {
			this.setHidden( options.hidden );
		}
	}

	/**
	 * Sets class modifiers to the group element.
	 * @param {Array|string} values
	 * @param {boolean} [toggle=true]
	 * @returns {MenuGroup}
	 */
	setModifiers( values, toggle = true ) {
		values = !utils.isArray( values ) ? [ values ] : values;
		values.forEach( value => {
			this.$element.toggleClass( `${ MenuGroup.CLASS_NAME }--${ value }`, toggle );
		} );
		return this;
	}

	/**
	 * Toggles the group hidden state.
	 * @param {boolean} value
	 * @returns {MenuGroup}
	 */
	setHidden( value ) {
		this.setModifiers( 'hidden', value );
		return this;
	}
}

es6ClassToOoJsClass( MenuGroup );

export default MenuGroup;