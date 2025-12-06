import id from './id';
import * as utils from './utils';
import { tweakUserOoUiClass } from './utils-oojs';
import { getHref } from './utils-article';
import { renderSuccessBox } from './utils-settings';

import view from './view';
import settings from './settings';

const { h } = utils;

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
	inputs = {};

	/**
	 * @type {Object}
	 */
	inputOptions = {};

	/**
	 * @type {Object}
	 */
	fields = {};

	/**
	 * @type {Object}
	 */
	layouts = {};

	/**
	 * @type {Object}
	 */
	tabs = {};

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
		// Render fieldsets
		this.renderLinksFieldset();
		this.renderDialogFieldset();
		this.renderMenuFieldset();
		this.renderGeneralFieldset();

		// Render tabs index layout
		/** @type {OO.ui.IndexLayout} */
		this.layouts.tabs = new OO.ui.IndexLayout( {
			expanded: true,
			framed: false,
		} );

		// Get only visible tabs and add them to the layout
		/** @type {OO.ui.TabPanelLayout[]} */
		const tabs = Object
			.values( this.tabs )
			.filter( tab => tab.isVisible() );
		this.layouts.tabs.addTabPanels( tabs, 0 );

		// Combine fieldsets into the panel
		return new OO.ui.PanelLayout( {
			classes: [ 'instantDiffs-settings-panel', 'instantDiffs-settings-panel--edit' ],
			padded: false,
			expanded: true,
			content: [ this.layouts.tabs ],
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

		return new OO.ui.PanelLayout( {
			classes: [ 'instantDiffs-settings-panel', 'instantDiffs-settings-panel--finish' ],
			padded: true,
			expanded: true,
			$content: content,
		} );
	}

	/******* FIELDSETS ******/

	renderLinksFieldset() {
		// Show Link
		this.inputs.showLink = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'showLink' ),
		} );
		this.fields.showLink = new OO.ui.FieldLayout( this.inputs.showLink, {
			label: utils.msg( 'settings-show-link' ),
			align: 'inline',
			help: utils.msg( 'settings-show-link-help' ),
			helpInline: true,
		} );
		this.fields.showLink.toggle( settings.check( 'showLink' ) );

		// Show Page Link
		this.inputs.showPageLink = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'showPageLink' ),
		} );
		this.fields.showPageLink = new OO.ui.FieldLayout( this.inputs.showPageLink, {
			label: utils.msg( 'settings-show-page-link' ),
			align: 'inline',
			help: utils.msgDom( 'settings-show-page-link-help' ),
			helpInline: true,
		} );
		this.fields.showPageLink.toggle( settings.check( 'showPageLink' ) );

		// Highlight list lines when the View dialog opens
		this.inputs.highlightLine = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'highlightLine' ),
		} );
		this.fields.highlightLine = new OO.ui.FieldLayout( this.inputs.highlightLine, {
			label: utils.msg( 'settings-highlight-line' ),
			align: 'inline',
		} );
		this.fields.highlightLine.toggle( settings.check( 'highlightLine' ) );

		// Mark watched lines when the View dialog opens
		this.inputs.markWatchedLine = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'markWatchedLine' ),
		} );
		this.fields.markWatchedLine = new OO.ui.FieldLayout( this.inputs.markWatchedLine, {
			label: utils.msg( 'settings-mark-watched-line' ),
			align: 'inline',
		} );
		this.fields.markWatchedLine.toggle( settings.check( 'markWatchedLine' ) );

		// Fieldset
		this.layouts.links = new OO.ui.FieldsetLayout();
		this.layouts.links.addItems( [
			this.fields.showLink,
			this.fields.showPageLink,
			this.fields.highlightLine,
			this.fields.markWatchedLine,
		] );

		// Tab
		this.tabs.links = new OO.ui.TabPanelLayout( 'links', {
			label: utils.msg( 'settings-fieldset-links' ),
			content: [ this.layouts.links ],
		} );
		this.tabs.links.toggle(
			settings.check( 'showLink' ) ||
			settings.check( 'showPageLink' ) ||
			settings.check( 'highlightLine' ) ||
			settings.check( 'markWatchedLine' ),
		);
	};

	renderDialogFieldset() {
		// Dialog width
		this.inputOptions.viewWidth = {};
		this.inputOptions.viewWidth.compact = new OO.ui.ButtonOptionWidget( {
			data: 'compact',
			label: utils.msg( 'settings-view-width-compact' ),
			title: utils.msg( 'settings-view-width-option-title', view.constructor.getSize( 'compact' ).width ),
		} );
		this.inputOptions.viewWidth.standard = new OO.ui.ButtonOptionWidget( {
			data: 'standard',
			label: utils.msg( 'settings-view-width-standard' ),
			title: utils.msg( 'settings-view-width-option-title', view.constructor.getSize( 'standard' ).width ),
		} );
		this.inputOptions.viewWidth.wide = new OO.ui.ButtonOptionWidget( {
			data: 'wide',
			label: utils.msg( 'settings-view-width-wide' ),
			title: utils.msg( 'settings-view-width-option-title', view.constructor.getSize( 'wide' ).width ),
		} );
		this.inputOptions.viewWidth.full = new OO.ui.ButtonOptionWidget( {
			data: 'full',
			label: utils.msg( 'settings-view-width-full' ),
			title: utils.msg( 'settings-view-width-full-title' ),
		} );
		this.inputs.viewWidth = new OO.ui.ButtonSelectWidget( {
			items: Object.values( this.inputOptions.viewWidth ),
		} );

		this.fields.viewWidth = new OO.ui.FieldLayout( this.inputs.viewWidth, {
			label: utils.msg( 'settings-view-width' ),
			align: 'inline',
			help: utils.msg( 'settings-view-width-help' ),
			helpInline: true,
		} );
		this.fields.viewWidth.toggle( settings.check( 'viewWidth' ) );

		// Close the dialog when clicking outside it
		this.inputs.closeOutside = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'closeOutside' ),
		} );
		this.fields.closeOutside = new OO.ui.FieldLayout( this.inputs.closeOutside, {
			label: utils.msg( 'settings-close-outside' ),
			align: 'inline',
		} );
		this.fields.closeOutside.toggle( settings.check( 'closeOutside' ) );

		// Enable keyboard hotkeys
		this.inputs.enableHotkeys = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'enableHotkeys' ),
		} );
		this.fields.enableHotkeys = new OO.ui.FieldLayout( this.inputs.enableHotkeys, {
			label: utils.msg( 'settings-enable-hotkeys' ),
			align: 'inline',
		} );
		this.fields.enableHotkeys.toggle( settings.check( 'enableHotkeys' ) );

		// Show the inline format toggle button
		this.inputs.showDiffTools = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'showDiffTools' ),
		} );
		this.fields.showDiffTools = new OO.ui.FieldLayout( this.inputs.showDiffTools, {
			label: utils.msg( 'settings-show-diff-tools' ),
			align: 'inline',
		} );
		this.fields.showDiffTools.toggle( settings.check( 'showDiffTools' ) );

		// Show diff info in the revisions
		this.inputs.showRevisionInfo = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'showRevisionInfo' ),
		} );
		this.fields.showRevisionInfo = new OO.ui.FieldLayout( this.inputs.showRevisionInfo, {
			label: utils.msg( 'settings-show-revision-info' ),
			align: 'inline',
		} );
		this.fields.showRevisionInfo.toggle( settings.check( 'showRevisionInfo' ) );

		// Unhide revisions and diff content for administrators
		this.inputs.unHideDiffs = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'unHideDiffs' ),
		} );
		this.fields.unHideDiffs = new OO.ui.FieldLayout( this.inputs.unHideDiffs, {
			label: utils.msg( 'settings-unhide-diffs' ),
			align: 'inline',
			help: utils.msgDom( 'settings-unhide-diffs-help', 'suppressrevision' ),
			helpInline: true,
		} );
		this.fields.unHideDiffs.toggle( settings.check( 'unHideDiffs' ) );

		// Open links in the new tab
		this.inputs.openInNewTab = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'openInNewTab' ),
		} );
		this.fields.openInNewTab = new OO.ui.FieldLayout( this.inputs.openInNewTab, {
			label: utils.msg( 'settings-open-in-new-tab' ),
			align: 'inline',
		} );
		this.fields.openInNewTab.toggle( settings.check( 'openInNewTab' ) );

		// Fieldset
		this.layouts.dialog = new OO.ui.FieldsetLayout();
		this.layouts.dialog.addItems( [
			this.fields.viewWidth,
			this.fields.closeOutside,
			this.fields.enableHotkeys,
			this.fields.showDiffTools,
			this.fields.showRevisionInfo,
			this.fields.unHideDiffs,
			this.fields.openInNewTab,
		] );

		// Tab
		this.tabs.dialog = new OO.ui.TabPanelLayout( 'dialog', {
			label: utils.msg( 'settings-fieldset-dialog' ),
			content: [ this.layouts.dialog ],
		} );
		this.tabs.dialog.toggle(
			settings.check( 'viewWidth' ) ||
			settings.check( 'closeOutside' ) ||
			settings.check( 'enableHotkeys' ) ||
			settings.check( 'showDiffTools' ) ||
			settings.check( 'showRevisionInfo' ) ||
			settings.check( 'unHideDiffs' ) ||
			settings.check( 'openInNewTab' ),
		);

		// Trigger selects actions
		this.inputs.viewWidth.selectItemByData( settings.get( 'viewWidth' ) );
	};

	renderMenuFieldset() {
		// Show icons in the dropdown menu
		this.inputs.showMenuIcons = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'showMenuIcons' ),
		} );
		this.fields.showMenuIcons = new OO.ui.FieldLayout( this.inputs.showMenuIcons, {
			label: utils.msg( 'settings-show-menu-icons' ),
			align: 'inline',
		} );
		this.fields.showMenuIcons.toggle( settings.check( 'showMenuIcons' ) );

		// Copy links format
		this.inputOptions.linksFormat = {};
		this.inputOptions.linksFormat.full = new OO.ui.RadioOptionWidget( {
			data: 'full',
			label: utils.msg( 'settings-links-format-full' ),
		} );
		this.inputOptions.linksFormat.minify = new OO.ui.RadioOptionWidget( {
			data: 'minify',
			label: utils.msg( 'settings-links-format-minify' ),
		} );
		this.inputs.linksFormat = new OO.ui.RadioSelectWidget( {
			items: Object.values( this.inputOptions.linksFormat ),
		} );
		this.inputs.linksFormat.on( 'select', this.onLinksFormatChoose );

		this.fields.linksFormat = new OO.ui.FieldLayout( this.inputs.linksFormat, {
			label: utils.msg( 'settings-links-format' ),
			align: 'inline',
			help: 'placeholder',
			helpInline: true,
		} );
		this.fields.linksFormat.toggle( settings.check( 'linksFormat' ) );

		// Copy wikilinks format
		this.inputOptions.wikilinksFormat = {};
		this.inputOptions.wikilinksFormat.link = new OO.ui.RadioOptionWidget( {
			data: 'link',
			label: utils.msg( 'settings-wikilinks-format-link' ),
		} );
		this.inputOptions.wikilinksFormat.spacial = new OO.ui.RadioOptionWidget( {
			data: 'special',
			label: utils.msg( 'settings-wikilinks-format-special' ),
		} );
		this.inputs.wikilinksFormat = new OO.ui.RadioSelectWidget( {
			items: Object.values( this.inputOptions.wikilinksFormat ),
		} );
		this.inputs.wikilinksFormat.on( 'select', this.onWikilinksFormatChoose );

		this.fields.wikilinksFormat = new OO.ui.FieldLayout( this.inputs.wikilinksFormat, {
			label: utils.msg( 'settings-wikilinks-format' ),
			align: 'inline',
			help: 'placeholder',
			helpInline: true,
		} );
		this.fields.wikilinksFormat.toggle( settings.check( 'wikilinksFormat' ) );

		// Fieldset
		this.layouts.menu = new OO.ui.FieldsetLayout();
		this.layouts.menu.addItems( [
			this.fields.showMenuIcons,
			this.fields.linksFormat,
			this.fields.wikilinksFormat,
		] );

		// Tab
		this.tabs.menu = new OO.ui.TabPanelLayout( 'menu', {
			label: utils.msg( 'settings-fieldset-menu' ),
			content: [ this.layouts.menu ],
		} );
		this.tabs.menu.toggle(
			settings.check( 'showMenuIcons' ) ||
			settings.check( 'linksFormat' ) ||
			settings.check( 'wikilinksFormat' ),
		);

		// Trigger selects actions
		this.inputs.linksFormat.selectItemByData( settings.get( 'linksFormat' ) );
		this.inputs.wikilinksFormat.selectItemByData( settings.get( 'wikilinksFormat' ) );
	};

	renderGeneralFieldset() {
		// Enable on the mobile skin
		this.inputs.enableMobile = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'enableMobile' ),
		} );
		this.fields.enableMobile = new OO.ui.FieldLayout( this.inputs.enableMobile, {
			label: utils.msg( 'settings-enable-mobile' ),
			align: 'inline',
			help: utils.msg( 'settings-enable-mobile-help' ),
			helpInline: true,
		} );
		this.fields.enableMobile.toggle( settings.check( 'enableMobile' ) );

		// Show popup alerts for critical errors
		this.inputs.notifyErrors = new OO.ui.CheckboxInputWidget( {
			selected: settings.get( 'notifyErrors' ),
		} );
		this.fields.notifyErrors = new OO.ui.FieldLayout( this.inputs.notifyErrors, {
			label: utils.msg( 'settings-notify-errors' ),
			align: 'inline',
		} );
		this.fields.notifyErrors.toggle( settings.check( 'notifyErrors' ) );

		// Fieldset
		this.layouts.general = new OO.ui.FieldsetLayout();
		this.layouts.general.addItems( [
			this.fields.enableMobile,
			this.fields.notifyErrors,
		] );

		// Tab
		this.tabs.general = new OO.ui.TabPanelLayout( 'general', {
			label: utils.msg( 'settings-fieldset-general' ),
			content: [ this.layouts.general ],
		} );
		this.tabs.general.toggle(
			settings.check( 'enableMobile' ) ||
			settings.check( 'notifyErrors' ),
		);
	};

	onLinksFormatChoose = () => {
		const linkFormat = this.inputs.linksFormat.findFirstSelectedItem()?.getData();

		const options = {
			relative: false,
			minify: linkFormat === 'minify',
		};
		const $help = this.getLinksFormatExample( options );
		this.fields.linksFormat.$help.empty().append( $help );

		// Update the Wikilink field help text
		this.onWikilinksFormatChoose();
	};

	onWikilinksFormatChoose = () => {
		const linkFormat = this.inputs.linksFormat.findFirstSelectedItem()?.getData();
		const wikilinkFormat = this.inputs.wikilinksFormat.findFirstSelectedItem()?.getData();

		const options = {
			relative: false,
			minify: linkFormat === 'minify',
			wikilink: true,
			wikilinkPreset: wikilinkFormat,
		};
		const $help = this.getLinksFormatExample( options );
		this.fields.wikilinksFormat.$help.empty().append( $help );
	};

	getLinksFormatExample( options ) {
		const title = utils.msg( 'copy-wikilink-example-title' );
		const diff = getHref( { title, diff: '12345', type: 'diff' }, {}, options );
		const revision = getHref( { title, oldid: '12345', type: 'revision' }, {}, options );
		const page = getHref( { title, curid: '12345', type: 'revision', typeVariant: 'page' }, {}, options );
		return h( 'ul.instantDiffs-list--settings',
			h( 'li', h( 'i', diff ) ),
			h( 'li', h( 'i', revision ) ),
			h( 'li', h( 'i', page ) ),
		);
	};

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
		for ( const input of Object.values( this.inputs ) ) {
			input.setDisabled( true );
		}

		settings.request()
			.then( this.onActionRequestSuccess.bind( this ) )
			.fail( this.onActionRequestError.bind( this ) )
			.always( () => this.popPending() );
	}

	/**
	 * Event that emits after a user options request failed.
	 * @param {Object} [error]
	 * @param {Object} [data]
	 * @private
	 */
	onActionRequestError( error, data ) {
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
	}

	/**
	 * Event that emits after user options request successively.
	 * @param {Object} [data]
	 * @private
	 */
	onActionRequestSuccess( data ) {
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
	}

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
		for ( const [ key, input ] of Object.entries( this.inputs ) ) {
			input.setDisabled( false );

			const option = options[ key ];
			if ( typeof option === 'undefined' ) return;

			if ( input instanceof OO.ui.CheckboxInputWidget ) {
				input.setSelected( option );
			}
			if ( input instanceof OO.ui.RadioSelectWidget ) {
				input.selectItemByData( option );
			}
			if ( input instanceof OO.ui.ButtonSelectWidget ) {
				input.selectItemByData( option );
			}
		}
	}

	/******* SAVE PROCESS ******/

	processActionSave() {
		this.pushPending();

		// Collect input values
		const options = {};
		for ( const [ key, input ] of Object.entries( this.inputs ) ) {
			if ( input instanceof OO.ui.CheckboxInputWidget ) {
				options[ key ] = input.isSelected();
			}
			if ( input instanceof OO.ui.RadioSelectWidget ) {
				options[ key ] = input.findFirstSelectedItem()?.getData();
			}
			if ( input instanceof OO.ui.ButtonSelectWidget ) {
				options[ key ] = input.findFirstSelectedItem()?.getData();
			}
		}

		settings.save( options )
			.then( this.onActionSaveSuccess.bind( this ) )
			.fail( this.onActionSaveError.bind( this ) )
			.always( () => this.popPending() );
	}

	/**
	 * Event that emits after save request failed.
	 * @param {Object} [error]
	 * @param {Object} [data]
	 * @private
	 */
	onActionSaveError( error, data ) {
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
	}

	/**
	 * Event that emits after save request successive.
	 * @private
	 */
	onActionSaveSuccess() {
		this.actions.setMode( 'finish' );
		this.stackLayout.setItem( this.panelFinish );
	}

	/******* RELOAD PROCESS *******/

	processActionReload() {
		this.pushPending();
		window.location.reload();
	}
}

tweakUserOoUiClass( SettingsDialog );

export default SettingsDialog;