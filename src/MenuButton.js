import * as utils from './utils';
import { tweakUserOoUiClass } from './utils-oojs';
import { getHrefAbsolute } from './utils-article';

import Link from './Link';
import settings from './settings';

/**
 * MenuButton's configuration options, extends OO.ui.ButtonWidget configuration
 * @typedef {OO.ui.ButtonWidget.ConfigOptions & Object} MenuButton.Options
 * @property {string} [name] - A button name, used for the data-mw-ui-id attribute
 * @property {'default'|'navigation'|'pin'|'menu'} [type='default'] - A Button view type
 * @property {boolean} [invisibleLabel=false] - Hide the button label
 * @property {boolean} [invisibleIcon=false] - Hide the button icon
 * @property {string} [href] - Button link href
 * @property {string} [target] - Button link target
 * @property {(widget: MenuButton, event: Event) => void} [handler] - A click handler
 * @property {boolean} [useAltKey=false] - Use the alt key to bypass the handler
 * @property {import('./Article').default} [article] - An Article instance
 * @property {boolean} [setLink=false] - Create a Link instance around the button element
 * @property {Link.Options} [linkOptions] - A Link configuration options
 */

/**
 * Class representing a custom ButtonWidget for the navigation menu.
 * @augments OO.ui.ButtonWidget
 */
class MenuButton extends OO.ui.ButtonWidget {
	/**
	 * @type {MenuButton.Options}
	 */
	options = {};

	/**
	 * @type {boolean}
	 */
	invisibleIcon = false;

	/**
	 * @type {import('./Link').default}
	 */
	link;

	/**
	 * Create a MenuButton instance.
	 * @param {MenuButton.Options} [options] - A MenuButton configuration options
	 */
	constructor( options ) {
		// Validate options
		options = {
			name: null,
			type: 'default',
			classes: [],
			framed: true,
			invisibleLabel: false,
			invisibleIcon: false,
			icon: 'puzzle',
			href: null,
			target: utils.getTarget( true ),
			handler: null,
			useAltKey: false,
			article: null,
			setLink: false,

			...options,

			linkOptions: {
				behavior: 'event',
				...options.linkOptions,
			},
		};

		if ( options.type === 'navigation' ) {
			options.icon = null;
			options.classes = [ ...options.classes, 'instantDiffs-button--navigation' ];
		}

		if ( options.type === 'pin' ) {
			options.invisibleLabel = true;
			options.classes = [ ...options.classes, 'instantDiffs-button--pin' ];
		}

		if ( options.type === 'menu' ) {
			options.classes = [ ...options.classes, 'instantDiffs-button--link' ];
			options.framed = false;

			if ( !settings.get( 'showMenuIcons' ) ) {
				options.invisibleIcon = true;
			}
		}

		if ( !utils.isEmpty( options.href ) ) {
			options.href = getHrefAbsolute( options.article, options.href );
		}

		// Call parent class constructor
		super( options );

		// Properties
		this.options = options;

		// Initialization
		this.setInvisibleIcon( options.invisibleIcon );

		if ( options.handler ) {
			this.setHandler( options.handler, options.useAltKey );
		}

		if ( options.setLink ) {
			this.setLink( options.linkOptions );
		}
	}

	/**
	 * Toggle icon visibility.
	 * @param {boolean} invisibleIcon
	 * @returns {MenuButton}
	 */
	setInvisibleIcon( invisibleIcon ) {
		invisibleIcon = !!invisibleIcon;

		if ( this.invisibleIcon !== invisibleIcon ) {
			this.invisibleIcon = invisibleIcon;
			this.$element.toggleClass( 'instantDiffs-invisibleIconElement', !this.icon || this.invisibleIcon );
		}

		return this;
	}

	/**
	 * Create a Link instance around the button element.
	 * @param {Link.Options}linkOptions
	 * @returns {MenuButton}
	 */
	setLink( linkOptions ) {
		this.link = new Link( this.$button.get( 0 ), linkOptions );

		return this;
	}

	/**
	 * Set a click handler to the button element.
	 * @param {(widget: MenuButton, event: Event) => void} handler - A click handler
	 * @param {boolean} [useAltKey] - Use the alt key to bypass the handler
	 * @returns {MenuButton}
	 */
	setHandler( handler, useAltKey ) {
		if ( utils.isFunction( handler ) ) {
			const helper = ( event ) => handler( this, event );
			utils.addClick( this.$button.get( 0 ), helper, useAltKey );
		}

		return this;
	}

	/**
	 * Execute a click handler on the button element.
	 * @returns {MenuButton}
	 */
	execHandler() {
		this.$button.get( 0 ).click();

		return this;
	}

	/**
	 * Get a configuration option by name.
	 * @param {string} name
	 * @returns {*}
	 */
	getOption( name ) {
		return this.options[ name ];
	}

	/**
	 * Get configuration options.
	 * @returns {MenuButton.Options}
	 */
	getOptions() {
		return this.options;
	}

	/**
	 * Get the Article instance.
	 * @returns {import('./Article').default}
	 */
	getArticle() {
		return this.getOption( 'article' );
	}

	/**
	 * Toggle a buttons pending state that shows a loading cursor.
	 * @param {boolean} value
	 * @returns {MenuButton}
	 */
	pending( value ) {
		this.$button.toggleClass( 'instantDiffs-link--pending', value );

		return this;
	}
}

tweakUserOoUiClass( MenuButton );

export default MenuButton;