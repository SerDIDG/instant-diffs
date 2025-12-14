import * as utils from './utils';

import settings from './settings';

/**
 * Menu Button's configuration options, extends MenuButton.Options
 * @typedef {MenuButton.Options & Object} Menu.ButtonOptions
 * @property {string} [name] - A button name, used for the data-mw-ui-id attribute
 * @property {string} [group] - A group name, used for grouping buttons
 * @property {boolean} [canShortcut=false] - Whether to render a shortcut button
 * @property {MenuButton.Options['type']} [shortcutType='shortcut'] - Shortcut button type
 * @property {string} [shortcutGroup='shortcuts'] - Shortcut button group
 * @property {boolean} [canMenu=true] - Whether to render a menu button
 * @property {MenuButton.Options['type']} [menuType='menu'] - Menu button type
 * @property {string} [menuGroup='menu'] - Menu button group
 * @property {import('./MenuButton').default|OO.ui.PopupButtonWidget} [widget] - The Button widget instance
 */

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
	 * @param {import('./Article').default} article - An Article instance
	 * @param {Object} [options] - A Menu configuration options
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

	/**
	 * Render a button group widget.
	 * @param {Object} options - Group configuration options
	 * @param {string} [options.name] - Group name
	 * @param {string} [options.group] - Parent group name
	 * @param {Object} [options.widget] - Widget instance
	 * @param {'vertical'|'horizontal'} [options.type='vertical'] - Group type
	 * @param {string[]} [options.classes] - Additional CSS classes
	 * @param {HTMLElement|JQuery<HTMLElement>} [options.container] - Container element
	 * @returns {Object|undefined} The registered group configuration, or undefined if already exists
	 */
	renderGroup( options ) {
		options = {
			name: null,
			group: null,
			widget: null,
			type: 'vertical',
			classes: [],
			container: null,
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
		utils.embed( options.widget.$element, options.container );

		return this.registerGroup( options );
	}

	/**
	 * Register a button group configuration.
	 * @param {Object} options - Group configuration options
	 * @param {string} [options.name] - Group name
	 * @param {string} [options.group] - Parent group name
	 * @param {Object} [options.widget] - Widget instance
	 * @returns {Object|undefined} The registered group configuration, or undefined if already exists
	 */
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

	/**
	 * Get a group by name.
	 * @param {string} name - The group name
	 * @returns {Object|undefined} The group configuration object, or undefined if not found
	 */
	getGroup( name ) {
		return this.groups[ name ];
	}

	/**
	 * Get all groups, optionally filtered by parent group.
	 * @param {string} [group] - Optional parent group name to filter by
	 * @returns {Object[]} Array of group configuration objects
	 */
	getGroups( group ) {
		return Object.values( this.groups )
			.filter( entry => !group || group === entry.group );
	}

	/**
	 * Get widget instances for all groups, optionally filtered by parent group.
	 * @param {string} [group] - Optional parent group name to filter by
	 * @returns {Object[]} Array of widget instances
	 */
	getGroupsWidgets( group ) {
		return this.getGroups( group )
			.map( entry => entry.widget );
	}

	/**
	 * Get DOM elements for all groups, optionally filtered by parent group.
	 * @param {string} [group] - Optional parent group name to filter by
	 * @returns {HTMLElement[]} Array of DOM elements
	 */
	getGroupsElements( group ) {
		return this.getGroups( group )
			.map( entry => entry.widget.$element.get( 0 ) );
	}

	/**
	 * Add button items to a group.
	 * @param {string} name - Group name
	 * @param {Menu.ButtonOptions|Menu.ButtonOptions[]} items - Button item(s) to add
	 */
	addGroupButtons( name, items ) {
		const group = this.getGroup( name );
		if ( !group ) return;

		items = !utils.isArray( items ) ? [ items ] : items;

		const widgets = items.map( entry => entry.widget );
		group.widget.addItems( widgets );
	}

	/**
	 * Get all buttons belonging to a specific group.
	 * @param {string} name - Group name
	 * @returns {Menu.ButtonOptions[]} Array of button configuration objects
	 */
	getGroupButtons( name ) {
		return this.getButtons()
			.map( entries => entries.find( entry => entry.group === name ) )
			.filter( entry => !utils.isEmpty( entry ) );
	}

	/******* BUTTONS *******/

	/**
	 * Render a button group with a shortcut and a menu button.
	 * @param {Menu.ButtonOptions} options
	 * @returns {Menu.ButtonOptions[]|undefined}
	 */
	renderButton( options ) {
		options = {
			article: this.article,
			name: null,
			group: null,
			canShortcut: false,
			shortcutType: 'shortcut',
			shortcutGroup: 'shortcuts',
			canMenu: true,
			menuGroup: 'menu',
			menuType: 'menu',
			widget: null,
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
	 * @param {Menu.ButtonOptions} options
	 * @returns {Menu.ButtonOptions}
	 */
	renderButtonHelper( options ) {
		options.widget = new this.MenuButton( options );
		this.addGroupButtons( options.group, options );
		return options;
	}

	/**
	 * Register a button.
	 * @param {Menu.ButtonOptions} options
	 * @returns {Menu.ButtonOptions|undefined}
	 */
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

		this.addGroupButtons( options.group, options );
		return options;
	}

	/**
	 * Get button(s) by name, optionally filtered by group.
	 * @param {string} name - Button name
	 * @param {string|string[]} [group] - Optional group name(s) to filter by
	 * @returns {Menu.ButtonOptions[]|undefined} Array of button configuration objects, or undefined if not found
	 */
	getButton( name, group ) {
		const button = this.buttons[ name ];
		if ( !button ) return;

		return this.buttons[ name ].filter( entry =>
			!group ||
			( utils.isString( group ) && entry.group === group ) ||
			( utils.isArray( group ) && group.includes( entry.group ) ),
		);
	}

	/**
	 * Get button widget instance(s) by name, optionally filtered by group.
	 * @param {string} name - Button name
	 * @param {string|string[]} [group] - Optional group name(s) to filter by
	 * @returns {import('./MenuButton').default[]|undefined} Array of MenuButton widget instances, or undefined if not found
	 */
	getButtonWidget( name, group ) {
		const button = this.getButton( name, group );
		if ( !button ) return;

		return button.map( entry => entry.widget );
	}

	/**
	 * Get all registered buttons.
	 * @returns {Array} Array of button configuration arrays
	 */
	getButtons() {
		return Object.values( this.buttons );
	}

	/**
	 * Iterate over button(s) and execute a handler function for each.
	 * @param {string} name - Button name
	 * @param {string|string[]} group - Group name(s) to filter by
	 * @param {function(Menu.ButtonOptions): void} handler - Handler function to execute for each button
	 */
	eachButton( name, group, handler ) {
		const button = this.getButton( name, group );
		if ( !button ) return;

		button.forEach( entry => handler( entry ) );
	}

	/**
	 * Iterate over button widget(s) and execute a handler function for each.
	 * @param {string} name - Button name
	 * @param {string|string[]} group - Group name(s) to filter by
	 * @param {function(import('./MenuButton').default): void} handler - Handler function to execute for each widget
	 */
	eachButtonWidget( name, group, handler ) {
		const button = this.getButtonWidget( name, group );
		if ( !button ) return;

		button.forEach( entry => handler( entry ) );
	}

	/**
	 * Focus button by a given name.
	 * @param {string} name - Button name
	 * @param {string|string[]} group - Group name(s) to filter by
	 * @returns {boolean} True if a button was successfully focused
	 */
	focusButton( name, group ) {
		let focused = false;

		this.eachButtonWidget( name, group, widget => {
			if ( !widget.isDisabled() ) {
				widget.focus();
				focused = true;
				return true;
			}
		} );

		return focused;
	}

	/**
	 * Pending button by a given name.
	 * @param {string} name - Button name
	 * @param {string|string[]} group - Group name(s) to filter by
	 * @param {boolean} value - State
	 */
	pendingButton( name, group, value ) {
		this.eachButtonWidget( name, group, widget => {
			widget.pending( value );
		} );
	}
}

export default Menu;