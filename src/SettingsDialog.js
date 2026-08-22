import id from './id';
import * as utils from './utils';
import { tweakUserOoUiClass } from './utils-oojs';
import { renderNoticeBox } from './utils-settings';
import { schema } from './schema-settings';

import settings from './settings';

/**
 * Class representing a SettingsDialog.
 * @augments OO.ui.ProcessDialog
 */
class SettingsDialog extends OO.ui.ProcessDialog {
	static name = 'Instant Diffs Settings';
	static title = utils.msg( 'settings-title' );
	static actions = [
		{
			action: 'save',
			modes: 'edit',
			label: utils.msg( 'action-save' ),
			flags: [ 'primary', 'progressive' ],
		},
		{
			action: 'reload',
			modes: 'finish',
			label: utils.msg( 'action-reload' ),
			flags: [ 'primary', 'progressive' ],
		},
		{
			action: 'close',
			modes: 'empty',
			label: utils.msg( 'action-close' ),
			flags: [ 'primary', 'progressive' ],
		},
		{
			modes: [ 'edit', 'finish', 'empty' ],
			label: utils.msg( 'action-close' ),
			title: utils.msg( 'action-close' ),
			invisibleLabel: true,
			icon: 'close',
			flags: [ 'safe', 'close' ],
		},
	];
	static escapable = settings.get( 'enableHotkeys' );

	/**
	 * @type {Record<string, OO.ui.PanelLayout>}
	 */
	panels = {};

	/**
	 * @type {Record}
	 */
	tabs = {};

	/**
	 * @type {OO.ui.TabPanelLayout[]}
	 */
	visibleTabWidgets = [];

	/**
	 * @type {Record}
	 */
	fields = {};

	/**
	 * Create a SettingsDialog instance.
	 */
	constructor() {
		super( {
			classes: [ 'instantDiffs-settings' ],
		} );
	}

	initialize( ...args ) {
		super.initialize( ...args );

		// Close the dialog when clicking outside it
		if ( settings.get( 'closeOutside' ) ) {
			this.$clickOverlay = $( '<div>' )
				.on( 'click', () => this.close() )
				.addClass( 'instantDiffs-view-overlay' )
				.appendTo( this.$element );
		}

		// Render panels
		this.panels.edit = this.renderEditPanel();
		this.panels.finish = this.renderFinishPanel();
		this.panels.empty = this.renderEmptyPanel();

		// Render switchable layout
		this.stackLayout = new OO.ui.StackLayout( {
			items: [
				this.panels.edit,
				this.panels.finish,
				this.panels.empty,
			],
		} );

		// Append stackLayout to the dialog
		this.$body.append( this.stackLayout.$element );
	};

	/******* PANELS ******/

	/**
	 * Renders the main panel with the setting inputs.
	 * @returns {OO.ui.PanelLayout}
	 */
	renderEditPanel() {
		return new OO.ui.PanelLayout( {
			classes: [ 'instantDiffs-settings-panel', 'instantDiffs-settings-panel--edit' ],
			padded: false,
			expanded: true,
		} );
	}

	/**
	 * Render the final panel with the saving success message.
	 * @returns {OO.ui.PanelLayout}
	 */
	renderFinishPanel() {
		return new OO.ui.PanelLayout( {
			classes: [ 'instantDiffs-settings-panel', 'instantDiffs-settings-panel--finish' ],
			padded: true,
			expanded: true,
		} );
	}

	/**
	 * Render the empty panel when no edit tabs are available.
	 * @returns {OO.ui.PanelLayout}
	 */
	renderEmptyPanel() {
		return new OO.ui.PanelLayout( {
			classes: [ 'instantDiffs-settings-panel', 'instantDiffs-settings-panel--empty' ],
			padded: true,
			expanded: true,
		} );
	}

	/**
	 * Set active panel.
	 * @param {string} name - Panel name
	 */
	setPanel( name ) {
		if ( !this.panels[ name ] ) return;

		this.actions.setMode( name );
		this.stackLayout.setItem( this.panels[ name ] );
	}

	/******* CONTENTS ******/

	async renderContents() {
		// Render contents
		await this.renderEditContent();
		this.renderFinishContent();
		this.renderEmptyContent();

		// Process links target
		this.processLinksAttr( this.stackLayout.$element );
	}

	async renderEditContent() {
		// Render settings schema
		for ( const [ name, item ] of Object.entries( schema ) ) {
			this.tabs[ name ] = await this.renderTab( name, item );
		}

		// Get only visible tabs
		this.visibleTabWidgets = Object.values( this.tabs )
			.map( entry => entry.tab )
			.filter( entry => entry.isVisible() );

		// Render tabs index layout
		const layout = new OO.ui.IndexLayout( {
			expanded: true,
			framed: false,
		} );
		layout.addTabPanels( this.visibleTabWidgets, 0 );

		// Append layout to the edit panel
		this.panels.edit.$element
			.empty()
			.append( layout.$element );
	}

	renderFinishContent() {
		/*!
		 * Icon "Eo circle light-green checkmark.svg"
		 * @author IagoQnsi
		 * @see {@link https://commons.wikimedia.org/wiki/File:Eo_circle_light-green_checkmark.svg }
		 */

		const image = (/** @type {string} */ require( './images/Eo_circle_light-green_checkmark.svg' ) );

		const content = renderNoticeBox( {
			image,
			content: utils.msg( 'settings-saved' ),
			alt: utils.msg( 'settings-saved-icon' ),
		} );

		// Append content to the finish panel
		this.panels.finish.$element
			.empty()
			.append( content );
	}

	renderEmptyContent() {
		/*!
		 * Icon "Coffee cup icon.svg"
		 * @author OpenClipArt
		 * @see {@link https://commons.wikimedia.org/wiki/File:Coffee_cup_icon.svg }
		 */

		const image = (/** @type {string} */ require( './images/Coffee_cup_icon.svg' ) );

		const content = renderNoticeBox( {
			image,
			content: utils.msg( 'settings-empty' ),
			alt: utils.msg( 'settings-empty-icon' ),
			modifiers: [ 'empty' ],
		} );

		// Append content to the empty panel
		this.panels.empty.$element
			.empty()
			.append( content );
	}

	/******* CONSTRUCTOR *******/

	async renderTab( name, item ) {
		item = utils.deepMerge( {
			name: name,
			fields: {},
			fieldset: null,
			tab: null,
			config: {
				label: null,
			},
		}, item );

		// Validate
		item.config = this.validateFieldConfig( item.config );

		// Fields
		for ( const [ fieldName, fieldItem ] of Object.entries( item.fields ) ) {
			this.fields[ fieldName ] = item.fields[ fieldName ] = await this.renderField( fieldName, fieldItem );
		}

		// Fieldset
		const fields = Object.values( item.fields )
			.map( entry => entry.field );

		item.fieldset = new OO.ui.FieldsetLayout()
			.addItems( fields );

		// Tab
		const hasFields = Object.keys( item.fields )
			.some( fieldName => this.fields[ fieldName ].enabled );

		item.tab = new OO.ui.TabPanelLayout( item.name, {
			...item.config,
			content: [ item.fieldset ],
		} )
			.toggle( hasFields );

		return item;
	}

	async renderField( name, item ) {
		item = utils.deepMerge( {
			name: name,
			type: null,
			input: null,
			field: null,
			enabled: true,
			enabledCondition: null,
			disabled: false,
			disabledCondition: null,
			config: {
				label: null,
				align: 'inline',
				help: null,
				helpInline: true,
			},
			optionsType: null,
			options: {},
			onSelect: () => {},
			onChange: () => {},
		}, item );

		// Validate
		item.enabled = await this.checkFieldEnabled( name, item );
		item.disabled = await this.checkFieldDisabled( name, item );
		item.config = this.validateFieldConfig( item.config );

		// Options
		if ( utils.isFunction( item.options ) ) {
			item.options = item.options.call( this, item );
		}

		for ( const [ optionName, optionItem ] of Object.entries( item.options ) ) {
			item.options[ optionName ] = this.renderInputOption( optionName, optionItem, item.optionsType );
		}

		const options = Object.values( item.options )
			.map( entry => entry.option );

		// Input
		switch ( item.type ) {
			case 'checkbox':
				item.input = new OO.ui.CheckboxInputWidget();
				break;

			case 'radioSelect':
				item.input = new OO.ui.RadioSelectWidget( {
					items: options,
				} );
				break;

			case 'buttonSelect':
				item.input = new OO.ui.ButtonSelectWidget( {
					items: options,
				} );
				break;

			case 'checkboxMultiselect':
				item.input = new OO.ui.CheckboxMultiselectWidget( {
					items: options,
				} );
				break;

			case 'html':
				item.input = await this.getFieldContent( name, item );
				break;
		}

		// Input handlers
		if ( utils.isFunction( item.onSelect ) ) {
			item.input.on( 'select', () => item.onSelect.call( this, item ) );
		}
		if ( utils.isFunction( item.onChange ) ) {
			item.input.on( 'change', () => item.onChange.call( this, item ) );
		}

		// Field
		item.field = new OO.ui.FieldLayout( item.input, item.config )
			.toggle( item.enabled );

		return item;
	}

	async getFieldContent( name, field ) {
		if ( !settings.check( name ) ) return;
		if ( !utils.isFunction( field.content ) ) return;
		return await field.content( name, field );
	}

	async checkFieldEnabled( name, field ) {
		if ( !settings.check( name ) ) return false;
		if ( !utils.isFunction( field.enabledCondition ) ) return field.enabled;
		return await field.enabledCondition( name, field );
	}

	async checkFieldDisabled( name, field ) {
		if ( !utils.isFunction( field.disabledCondition ) ) return field.disabled;
		return await field.disabledCondition( name, field );
	}

	renderInputOption( name, item, type ) {
		item = utils.deepMerge( {
			name: name,
			type: type,
			data: name,
			option: null,
			show: true,
		}, item );

		// Validate
		item = this.validateFieldConfig( item );

		switch ( item.type ) {
			case 'radioOption':
				item.option = new OO.ui.RadioOptionWidget( item );
				break;

			case 'buttonOption':
				item.option = new OO.ui.ButtonOptionWidget( item );
				break;

			case 'checkboxMultioption':
				item.option = new OO.ui.CheckboxMultioptionWidget( item );
				break;
		}

		// Toggle visibility
		item.option.toggle( item.show );

		return item;
	}

	/**
	 * Validate and process field configuration message options.
	 * Converts message keys/arrays into actual messages.
	 * @param {Object} config - Field configuration object
	 * @returns {Object} Validated configuration
	 */
	validateFieldConfig( config ) {
		// Process message options
		const msgOptions = [
			{ key: 'label', target: 'label' },
			{ key: 'labelMsg', target: 'label', msgFn: utils.msg },
			{ key: 'title', target: 'title' },
			{ key: 'titleMsg', target: 'title', msgFn: utils.msg },
			{ key: 'help', target: 'help' },
			{ key: 'helpMsg', target: 'help', msgFn: utils.msg },
		];

		msgOptions.forEach( ( { key, target, msgFn } ) => {
			let value = config[ key ];
			if ( !value ) return;

			if ( utils.isFunction( value ) ) {
				value = value.call( this );
			}

			config[ target ] = !msgFn
				? value : utils.isArray( value )
					? msgFn( ...value ) : msgFn( value );
		} );

		return config;
	}

	getField( name ) {
		return this.fields[ name ];
	}

	getFields() {
		return this.fields;
	}

	getFieldValue( name ) {
		const item = this.getField( name );
		if ( !item ) return;

		if ( [ 'checkbox' ].includes( item.type ) ) {
			return item.input.isSelected();
		}
		if ( [ 'radioSelect', 'buttonSelect' ].includes( item.type ) ) {
			return item.input.findFirstSelectedItem()?.getData();
		}
		if ( [ 'checkboxMultiselect' ].includes( item.type ) ) {
			return item.input.findSelectedItemsData();
		}
	}

	getFieldValues() {
		const values = {};

		for ( const [ name ] of Object.entries( this.fields ) ) {
			values[ name ] = this.getFieldValue( name );
		}

		return values;
	}

	setFieldValue( name, value ) {
		const item = this.getField( name );
		if ( !item ) return;

		if ( [ 'checkbox' ].includes( item.type ) ) {
			item.input.setSelected( value );
		}
		if ( [ 'radioSelect', 'buttonSelect' ].includes( item.type ) ) {
			item.input.selectItemByData( value );
		}
		if ( [ 'checkboxMultiselect' ].includes( item.type ) ) {
			item.input.selectItemsByData( value );
		}

		return this;
	}

	setFieldHelp( name, help ) {
		const item = this.getField( name );
		if ( !item ) return;

		item.field.$help.empty().append( help );
		return this;
	}

	setFieldDisabled( name, value, setAsDefault ) {
		const item = this.getField( name );
		if ( !item ) return;

		if ( value === 'default' ) {
			value = item.disabled;
		}
		if ( setAsDefault ) {
			item.disabled = value;
		}
		item.input.setDisabled( value );
		return this;
	}

	/******* SETUP PROCESS *******/

	getSetupProcess( data ) {
		return super.getSetupProcess( data ).next( async () => {
			this.$body.scrollTop( 0 );
			await this.processActionRequest();
		} );
	};

	getActionProcess( action ) {
		if ( action === 'save' ) {
			return new OO.ui.Process( () => this.processActionSave() );
		}
		if ( action === 'reload' ) {
			return new OO.ui.Process( () => this.processActionReload() );
		}
		if ( action === 'close' ) {
			return new OO.ui.Process( () => this.close() );
		}
		return super.getActionProcess( action );
	}

	processLinksAttr( $container ) {
		const $links = $container.find( 'a:not(.jquery-confirmable-element)' );
		$links.each( ( i, node ) => node.setAttribute( 'target', '_blank' ) );

		utils.addBaseToLinks( $container, id.config.origin );
	}

	getEscapeAction() {
		return this.constructor.escapable ? '' : null;
	}

	getBodyHeight() {
		return 550;
	}

	/******* REQUEST PROCESS ******/

	async processActionRequest() {
		// Show the pending loader in the header
		this.pushPending();

		// Render panels contents
		await this.renderContents();

		// Set an action panel
		this.setPanel( this.visibleTabWidgets.length > 0 ? 'edit' : 'empty' );

		// Update input values
		for ( const [ name ] of Object.entries( this.fields ) ) {
			this.setFieldDisabled( name, true );
		}

		void settings.request()
			.then( this.onActionRequestSuccess )
			.fail( this.onActionRequestError )
			.always( () => this.popPending() );
	}

	/**
	 * Event that emits after a user options request failed.
	 * @private
	 * @param {Object} [error]
	 * @param {Object} [data]
	 */
	onActionRequestError = ( error, data ) => {
		const params = {
			type: 'settings',
			message: error,
		};
		if ( data?.error ) {
			params.code = data.error.code;
			params.message = data.error.info;
		}

		const errorMessage = new OO.ui.Error(
			utils.getErrorMessage( 'error-setting-request', params ),
			{ recoverable: true },
		);
		this.showErrors( errorMessage );
	};

	/**
	 * Event that emits after user options request successively.
	 * @private
	 * @param {Object} [data]
	 */
	onActionRequestSuccess = ( data ) => {
		if ( id.local.mwIsAnon ) {
			return this.update();
		}

		// Render error if the userinfo request is completely failed
		const userOptions = data?.query?.userinfo?.options;
		if ( !userOptions ) {
			return this.onActionRequestError( null, data );
		}

		try {
			const options = JSON.parse( userOptions[ `${ id.config.settingsPrefix }-settings` ] );
			settings.set( options, true );
		} catch {}

		this.update();
	};

	/******* UPDATE PROCESS *******/

	update() {
		return this.getUpdateProcess().execute();
	}

	getUpdateProcess() {
		return new OO.ui.Process( () => {
			this.setPanel( this.visibleTabWidgets.length > 0 ? 'edit' : 'empty' );
			this.processActionUpdate( settings.get() );
		} );
	}

	processActionUpdate( options ) {
		// Hide the pending loader in the header
		this.popPending();

		// Update input values
		for ( const [ name ] of Object.entries( this.fields ) ) {
			this.setFieldDisabled( name, 'default' );

			const option = options[ name ];
			if ( typeof option === 'undefined' ) continue;

			this.setFieldValue( name, option );
		}
	}

	/******* SAVE PROCESS ******/

	processActionSave() {
		this.pushPending();

		settings.save( this.getFieldValues() )
			.then( this.onActionSaveSuccess )
			.fail( this.onActionSaveError )
			.always( () => this.popPending() );
	}

	/**
	 * Event that emits after save request failed.
	 * @private
	 * @param {Object} [error]
	 * @param {Object} [data]
	 */
	onActionSaveError = ( error, data ) => {
		const params = {
			type: 'settings',
			message: error,
		};
		if ( data?.error ) {
			params.code = data.error.code;
			params.message = data.error.info;
		}

		const errorMessage = new OO.ui.Error(
			utils.getErrorMessage( 'error-setting-save', params ),
			{ recoverable: true },
		);
		this.showErrors( errorMessage );
	};

	/**
	 * Event that emits after save request successive.
	 * @private
	 */
	onActionSaveSuccess = () => {
		this.setPanel( 'finish' );
	};

	/******* RELOAD PROCESS *******/

	processActionReload() {
		this.pushPending();
		window.location.reload();
	}
}

tweakUserOoUiClass( SettingsDialog );

export default SettingsDialog;