import id from './id';
import * as utils from './utils';
import { tweakUserOoUiClass } from './utils-oojs';
import { renderSuccessBox } from './utils-settings';
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
			modes: [ 'edit', 'finish' ],
			label: utils.msg( 'action-close' ),
			title: utils.msg( 'action-close' ),
			invisibleLabel: true,
			icon: 'close',
			flags: [ 'safe', 'close' ],
		},
	];

	/**
	 * @type {Object}
	 */
	tabs = {};

	/**
	 * @type {Object}
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

		// Render panels
		this.panelEdit = this.renderEditPanel();
		this.panelFinish = this.renderFinishPanel();

		// Render switchable layout
		this.stackLayout = new OO.ui.StackLayout( {
			items: [
				this.panelEdit,
				this.panelFinish,
			],
		} );

		// Process links target
		this.processLinksAttr( this.stackLayout.$element );

		// Append stackLayout to the dialog
		this.$body.append( this.stackLayout.$element );
	};

	/******* PANELS ******/

	/**
	 * Renders the main panel with the setting inputs.
	 * @returns {OO.ui.PanelLayout}
	 */
	renderEditPanel() {
		// Render settings schema
		for ( const [ name, item ] of Object.entries( schema ) ) {
			this.tabs[ name ] = this.renderTab( name, item );
		}

		// Get only visible tabs
		const tabs = Object.values( this.tabs )
			.map( entry => entry.tab )
			.filter( entry => entry.isVisible() );

		// Render tabs index layout
		const layout = new OO.ui.IndexLayout( {
			expanded: true,
			framed: false,
		} );
		layout.addTabPanels( tabs, 0 );

		// Combine fieldsets into the panel
		return new OO.ui.PanelLayout( {
			classes: [ 'instantDiffs-settings-panel', 'instantDiffs-settings-panel--edit' ],
			padded: false,
			expanded: true,
			content: [ layout ],
		} );
	}

	/**
	 * Render the final panel with the saving success message.
	 * @returns {OO.ui.PanelLayout}
	 */
	renderFinishPanel() {
		/**
		 * Icon "Eo circle light-green checkmark.svg"
		 * @author IagoQnsi
		 * @see {@link https://commons.wikimedia.org/wiki/User:IagoQnsi}
		 * @see {@link https://commons.wikimedia.org/wiki/File:Eo_circle_light-green_checkmark.svg}
		 * @type {string}
		 */
		const image = '/6/6f/Eo_circle_light-green_checkmark.svg';

		const content = renderSuccessBox( {
			image,
			content: utils.msg( 'settings-saved' ),
			alt: utils.msg( 'settings-saved-icon' ),
		} );

		// Combine fieldsets into the panel
		return new OO.ui.PanelLayout( {
			classes: [ 'instantDiffs-settings-panel', 'instantDiffs-settings-panel--finish' ],
			padded: true,
			expanded: true,
			$content: content,
		} );
	}

	/******* CONSTRUCTOR *******/

	renderTab( name, item ) {
		item = utils.optionsMerge( {
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
			this.fields[ fieldName ] = item.fields[ fieldName ] = this.renderField( fieldName, fieldItem );
		}

		// Fieldset
		const fields = Object.values( item.fields )
			.map( entry => entry.field );

		item.fieldset = new OO.ui.FieldsetLayout()
			.addItems( fields );

		// Tab
		const hasFields = Object.keys( item.fields )
			.map( entry => settings.check( entry ) )
			.some( entry => entry === true );

		item.tab = new OO.ui.TabPanelLayout( item.name, {
			...item.config,
			content: [ item.fieldset ],
		} )
			.toggle( hasFields );

		return item;
	}

	renderField( name, item ) {
		item = utils.optionsMerge( {
			name: name,
			type: null,
			input: null,
			field: null,
			config: {
				label: null,
				align: 'inline',
				help: null,
				helpInline: true,
			},
			optionsType: null,
			options: {},
			onSelect: () => {},
		}, item );

		// Validate
		item.config = this.validateFieldConfig( item.config );

		// Options
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
		}

		// Input handlers
		if ( utils.isFunction( item.onSelect ) ) {
			item.input.on( 'select', () => item.onSelect.call( this, item ) );
		}

		// Field
		item.field = new OO.ui.FieldLayout( item.input, item.config )
			.toggle( settings.check( item.name ) );

		return item;
	}

	renderInputOption( name, item, type ) {
		item = utils.optionsMerge( {
			name: name,
			type: type,
			data: name,
			option: null,
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
		}

		return item;
	}

	validateFieldConfig( config ) {
		// Validate message options
		[ 'label', 'title', 'help' ].forEach( option => {
			const value = config[ option ];
			if ( utils.isEmpty( value ) ) return;

			const msg = [ 'title' ].includes( option )
				? utils.msg : utils.msgDom;

			config[ option ] = utils.isArray( value )
				? msg.apply( null, value ) : msg( value );
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

		return this;
	}

	setFieldHelp( name, $help ) {
		const item = this.getField( name );
		if ( !item ) return;

		item.field.$help.empty().append( $help );
		return this;
	}

	setFieldDisabled( name, value ) {
		const item = this.getField( name );
		if ( !item ) return;

		item.input.setDisabled( value );
		return this;
	}

	/******* SETUP PROCESS *******/

	getSetupProcess( data ) {
		return super.getSetupProcess( data ).next( () => {
			this.actions.setMode( 'edit' );
			this.stackLayout.setItem( this.panelEdit );
			this.$body.scrollTop( 0 );
			this.processActionRequest();
		} );
	};

	getActionProcess( action ) {
		if ( action === 'save' ) {
			return new OO.ui.Process( () => this.processActionSave() );
		}
		if ( action === 'reload' ) {
			return new OO.ui.Process( () => this.processActionReload() );
		}
		return super.getActionProcess( action );
	}

	processLinksAttr( $container ) {
		const $links = $container.find( 'a:not(.jquery-confirmable-element)' );
		$links.each( ( i, node ) => node.setAttribute( 'target', '_blank' ) );

		utils.addBaseToLinks( $container, id.config.origin );
	}

	getBodyHeight() {
		return 500;
	}

	/******* REQUEST PROCESS ******/

	processActionRequest() {
		// Show the pending loader in the header
		this.pushPending();

		// Update input values
		for ( const [ name ] of Object.entries( this.fields ) ) {
			this.setFieldDisabled( name, true );
		}

		settings.request()
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
			this.actions.setMode( 'edit' );
			this.stackLayout.setItem( this.panelEdit );
			this.processActionUpdate( settings.get() );
		} );
	}

	processActionUpdate( options ) {
		// Hide the pending loader in the header
		this.popPending();

		// Update input values
		for ( const [ name ] of Object.entries( this.fields ) ) {
			this.setFieldDisabled( name, false );

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
		this.actions.setMode( 'finish' );
		this.stackLayout.setItem( this.panelFinish );
	};

	/******* RELOAD PROCESS *******/

	processActionReload() {
		this.pushPending();
		window.location.reload();
	}
}

tweakUserOoUiClass( SettingsDialog );

export default SettingsDialog;