import * as utils from './utils';

import settings from './settings';

class Menu {
	/**
	 * @type {import('./Article').default}
	 */
	article;

	/**
	 * @type {Object}
	 */
	options = {};

	/**
	 * @type {Object}
	 */
	groups = {};

	/**
	 * @type {Object}
	 */
	buttons = {};

	/**
	 * @type {typeof import('./MenuButton').default}
	 */
	MenuButton;

	/**
	 * Create a Menu instance.
	 * @param {import('./Article').default} article an Article instance
	 * @param {Object} [options] configuration options
	 */
	constructor( article, options ) {
		this.article = article;

		this.options = {
			...options,
		};

		// Lazy-import modules
		this.MenuButton = require( './MenuButton' ).default;
	}

	/******* GROUPS *******/

	renderGroup( options ) {
		options = {
			name: null,
			group: null,
			widget: null,
			type: 'vertical',
			$container: null,
			classes: [],
			...options,
		};

		if ( options.type === 'vertical' ) {
			options.classes.push(
				'instantDiffs-buttons-group',
				'instantDiffs-buttons-group--vertical',
				`instantDiffs-buttons-group--${ options.name }`,
				settings.get( 'showMenuIcons' ) ? 'has-icons' : null,
			);
		}

		if ( options.type === 'horizontal' ) {
			options.classes.push(
				'instantDiffs-buttons-group',
				'instantDiffs-buttons-group--horizontal',
				`instantDiffs-buttons-group--${ options.name }`,
			);
		}

		options.widget = new OO.ui.ButtonGroupWidget( options );
		utils.embed( options.widget.$element, options.$container );

		return this.registerGroup( options );
	}

	registerGroup( options ) {
		options = {
			name: null,
			group: null,
			widget: null,
			...options,
		};

		if ( this.groups[ options.name ] ) return;
		this.groups[ options.name ] = options;
		return options;
	}

	getGroup( name ) {
		return this.groups[ name ];
	}

	getGroups( group ) {
		return Object.values( this.groups )
			.filter( entry => !group || group === entry.group );
	}

	getGroupsWidgets( group ) {
		return this.getGroups( group )
			.map( entry => entry.widget );
	}

	getGroupsElements( group ) {
		return this.getGroups( group )
			.map( entry => entry.widget.$element.get( 0 ) );
	}

	addGroupButtons( name, items ) {
		const group = this.getGroup( name );
		if ( !group ) return;

		items = !utils.isArray( items ) ? [ items ] : items;
		group.widget.addItems( items );
	}

	getGroupButtons( name ) {
		return this.getButtons()
			.map( entries => entries.find( entry => entry.group === name ) )
			.filter( entry => !utils.isEmpty( entry ) );
	}

	/******* BUTTONS *******/

	renderButton( options ) {
		options = {
			name: null,
			group: null,
			canShortcut: false,
			shortcutType: 'shortcut',
			shortcutGroup: 'shortcuts',
			canMenu: true,
			menuGroup: 'menu',
			menuType: 'menu',
			article: this.article,
			...options,
		};

		if ( this.buttons[ options.name ] ) return;
		const buttons = this.buttons[ options.name ] = [];

		if ( options.canShortcut ) {
			const button = this.renderButtonHelper( {
				...options,
				type: options.shortcutType,
				group: options.shortcutGroup,
			} );
			buttons.push( button );
		}

		if ( options.canMenu ) {
			const button = this.renderButtonHelper( {
				...options,
				type: options.menuType,
				group: options.menuGroup,
			} );
			buttons.push( button );
		}

		return buttons;
	}

	/**
	 * Helper function for renderButton.
	 * @private
	 * @param options
	 * @returns {*}
	 */
	renderButtonHelper( options ) {
		options.widget = new this.MenuButton( options );
		this.addGroupButtons( options.group, options.widget );
		return options;
	}

	registerButton( options ) {
		options = {
			name: null,
			group: null,
			type: null,
			widget: null,
			...options,
		};

		if ( this.buttons[ options.name ] ) return;
		this.buttons[ options.name ] = [ options ];

		this.addGroupButtons( options.group, options.widget );
		return options;
	}

	getButton( name, group ) {
		const button = this.buttons[ name ];
		if ( !button ) return;

		return this.buttons[ name ].filter( entry =>
			!group ||
			( utils.isString( group ) && entry.group === group ) ||
			( utils.isArray( group ) && group.includes( entry.group ) ),
		);
	}

	getButtonWidget( name, group ) {
		const button = this.getButton( name, group );
		if ( !button ) return;

		return button.map( entry => entry.widget );
	}

	getButtons() {
		return Object.values( this.buttons );
	}

	eachButton( name, group, handler ) {
		const button = this.getButton( name, group );
		if ( !button ) return;

		button.forEach( entry => handler( entry ) );
	}

	eachButtonWidget( name, group, handler ) {
		const button = this.getButtonWidget( name, group );
		if ( !button ) return;

		button.forEach( entry => handler( entry ) );
	}
}

export default Menu;