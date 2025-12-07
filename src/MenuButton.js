import * as utils from './utils';
import { tweakUserOoUiClass } from './utils-oojs';
import { getHrefAbsolute } from './utils-article';

import Link from './Link';
import settings from './settings';

/**
 * Class representing a custom ButtonWidget for the navigation menu.
 * @augments OO.ui.ButtonWidget
 */
class MenuButton extends OO.ui.ButtonWidget {
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
	 * @param {Object} [options] configuration options
	 */
	constructor( options ) {
		// Validate options
		options = {
			type: 'default',
			classes: [],
			framed: true,
			invisibleLabel: false,
			invisibleIcon: false,
			icon: 'puzzle',
			url: null,
			href: null,
			target: utils.getTarget( true ),
			handler: null,
			useAltKey: false,
			link: false,
			article: null,

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

		if ( options.type === 'shortcut' ) {
			options.invisibleLabel = true;
			options.classes = [ ...options.classes, 'instantDiffs-button--shortcut' ];
		}

		if ( options.type === 'menu' ) {
			options.classes = [ ...options.classes, 'instantDiffs-button--link' ];
			options.framed = false;

			if ( !settings.get( 'showMenuIcons' ) ) {
				options.invisibleIcon = true;
			}
		}

		if ( !utils.isEmpty( options.url ) && utils.isEmpty( options.href ) ) {
			options.href = getHrefAbsolute( options.article, options.url );
		}

		// Call parent class constructor
		super( options );

		// Initialization
		this.setInvisibleIcon( options.invisibleIcon );

		if ( utils.isFunction( options.handler ) ) {
			utils.addClick( this.$button.get( 0 ), options.handler.bind( this ), options.useAltKey );
		}

		if ( options.link ) {
			this.setLink( options.linkOptions );
		}
	}

	setInvisibleIcon( invisibleIcon ) {
		invisibleIcon = !!invisibleIcon;

		if ( this.invisibleIcon !== invisibleIcon ) {
			this.invisibleIcon = invisibleIcon;
			this.$element.toggleClass( 'instantDiffs-invisibleIconElement', !this.icon || this.invisibleIcon );
		}

		return this;
	}

	setLink( linkOptions ) {
		this.link = new Link( this.$button.get( 0 ), linkOptions );

		return this;
	}

	/**
	 * Toggle a buttons pending state that shows a loading cursor.
	 * @param {boolean} value
	 */
	pending( value ) {
		this.$button.toggleClass( 'instantDiffs-link--pending', value );

		return this;
	}
}

tweakUserOoUiClass( MenuButton );

export default MenuButton;