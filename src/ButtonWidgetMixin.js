import * as utils from './utils';

import Link from './Link';

/**
 * ButtonWidgetMixin's configuration options
 * @typedef {Object} ButtonWidgetMixin.Options
 * @property {Array<string>} [modifiers] - A list of class modifiers to add to the button element
 * @property {boolean} [hidden=false] - Set hidden state
 * @property {boolean} [pending=false] - Set pending state
 * @property {boolean} [invisibleLabel=false] - Hide the button label
 * @property {boolean} [invisibleIcon=false] - Hide the button icon
 * @property {string} [href] - Button link href
 * @property {string} [target] - Button link target
 * @property {(button: ButtonWidgetMixin, event: (MouseEvent|KeyboardEvent)) => void} [handler] - A click handler
 * @property {boolean} [useAltKey=false] - Use the alt key to bypass the handler
 * @property {boolean} [setLink=false] - Create a Link instance around the button element
 * @property {Link.Options} [linkOptions] - Link configuration options
 */

/**
 * Class representing a custom ButtonWidget for the navigation menu.
 */
class ButtonWidgetMixin {
	static CLASS_NAME = 'instantDiffs-button';

	/**
	 * @type {ButtonWidgetMixin.Options}
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
	 * @type {Function}
	 */
	handler;

	/**
	 * Constructs ButtonWidgetMixin properties.
	 * @param {ButtonWidgetMixin.Options} [options] - A MenuButton configuration options
	 */
	construct( options ) {
		// Validate options
		options = utils.deepMerge( {
			modifiers: [],
			hidden: false,
			pending: false,
			invisibleLabel: false,
			invisibleIcon: false,
			href: null,
			target: utils.getTarget( true ),
			handler: undefined,
			useAltKey: false,
			setLink: false,
			linkOptions: {
				behavior: 'event',
				useAltKey: false,
			},
		}, options );

		this.options = options;

		// Elements
		this.$element
			.addClass( ButtonWidgetMixin.CLASS_NAME );
		this.$pending = $( '<span>' )
			.addClass( 'oo-ui-buttonElement-pending' )
			.prependTo( this.$button );

		// Mixin constructors
		OO.ui.mixin.PendingElement.call( this, { $pending: this.$pending } );

		// Set properties
		if ( options.modifiers ) {
			this.setModifiers( options.modifiers );
		}
		if ( options.hidden ) {
			this.setHidden( options.hidden );
		}
		if ( options.pending ) {
			this.setPending( options.pending );
		}
		if ( options.handler ) {
			this.setHandler( options.handler, options.useAltKey );
		}
		if ( options.setLink ) {
			this.setLink( options.linkOptions );
		}
		this.setInvisibleIcon( options.invisibleIcon );
	}

	/**
	 * Gets a configuration option by name.
	 * @param {string} name
	 * @returns {*}
	 */
	getOption( name ) {
		return this.options[ name ];
	}

	/**
	 * Gets configuration options.
	 * @returns {ButtonWidgetMixin.Options}
	 */
	getOptions() {
		return this.options;
	}

	/**
	 * Sets class modifiers to the button element.
	 * @param {Array|string} values
	 * @param {boolean} [toggle=true]
	 * @returns {ButtonWidgetMixin}
	 */
	setModifiers( values, toggle = true ) {
		values = !utils.isArray( values ) ? [ values ] : values;
		values.forEach( value => {
			this.$element.toggleClass( `${ ButtonWidgetMixin.CLASS_NAME }--${ value }`, toggle );
		} );
		return this;
	}

	/**
	 * Toggles the button pending state.
	 * @param {boolean} value
	 * @returns {ButtonWidgetMixin}
	 */
	setPending( value ) {
		value ? this.pushPending() : this.popPending();
		this.setModifiers( 'pending', value );
		return this;
	}

	/**
	 * Toggles the button hidden state.
	 * @param {boolean} value
	 * @returns {ButtonWidgetMixin}
	 */
	setHidden( value ) {
		this.setModifiers( 'hidden', value );
		return this;
	}

	/**
	 * Sets a click handler to the button element.
	 * @param {(widget: ButtonWidgetMixin, event: (MouseEvent|KeyboardEvent)) => void} [handler] - A click handler
	 * @param {boolean} [useAltKey] - Use the alt key to bypass the handler
	 * @returns {ButtonWidgetMixin}
	 */
	setHandler( handler, useAltKey ) {
		if ( utils.isFunction( this.handler ) ) {
			utils.removeClick( this.$button.get( 0 ), this.handler );
		}

		if ( utils.isFunction( handler ) ) {
			const helper = ( event ) => handler( this, event );
			this.handler = utils.addClick( this.$button.get( 0 ), helper, useAltKey );
		}

		return this;
	}

	/**
	 * Executes a click handler on the button element.
	 * @returns {ButtonWidgetMixin}
	 */
	execHandler() {
		this.$button.get( 0 ).click();

		return this;
	}

	/**
	 * Creates a Link instance around the button element.
	 * @param {import('./Link').Link.Options} linkOptions
	 * @returns {ButtonWidgetMixin}
	 */
	setLink( linkOptions ) {
		const node = this.$button.get( 0 );
		node.dataset.instantdiffsLink = '';
		this.link = new Link( node, linkOptions );

		return this;
	}

	/**
	 * Toggles icon visibility.
	 * @param {boolean} invisibleIcon
	 * @returns {ButtonWidgetMixin}
	 */
	setInvisibleIcon( invisibleIcon ) {
		invisibleIcon = !!invisibleIcon;

		if ( this.invisibleIcon !== invisibleIcon ) {
			this.invisibleIcon = invisibleIcon;
			this.$element.toggleClass( 'instantDiffs-invisibleIconElement', !this.icon || this.invisibleIcon );
		}

		return this;
	}
}

OO.mixinClass( ButtonWidgetMixin, OO.ui.mixin.PendingElement );

export default ButtonWidgetMixin;