import $ from 'jquery';
import OO from 'oojs';
import OoUi from 'oojs-ui';

import id from './id';
import * as utils from './utils';

/**
 * Construct a custom ProcessDialog.
 */
export function SettingsDialog( settings ) {
    this.settings = settings;
    this.inputs = {};
    this.inputOptions = {};
    this.fields = {};
    this.layouts = {};

    SettingsDialog.super.call( this, {
        classes: [ 'instantDiffs-settings' ],
    } );
}

OO.inheritClass( SettingsDialog, OoUi.ProcessDialog );

SettingsDialog.static.name = 'Instant Diffs Settings Dialog';
SettingsDialog.static.title = utils.msg( 'settings-title' );
SettingsDialog.static.actions = [
    {
        action: 'save',
        modes: 'edit',
        label: utils.msg( 'save' ),
        flags: [ 'primary', 'progressive' ],
    },
    {
        action: 'reload',
        modes: 'finish',
        label: utils.msg( 'reload' ),
        flags: [ 'primary', 'progressive' ],
    },
    {
        modes: [ 'edit', 'finish' ],
        label: utils.msg( 'close' ),
        title: utils.msg( 'close' ),
        invisibleLabel: true,
        icon: 'close',
        flags: [ 'safe', 'close' ],
    },
];

SettingsDialog.prototype.initialize = function () {
    SettingsDialog.super.prototype.initialize.apply( this, arguments );

    // Apply polyfills for older wikis
    utils.applyOoUiPolyfill();

    // Render fieldsets
    this.renderLinksFieldset();
    this.renderDialogFieldset();
    this.renderGeneralFieldset();

    // Combine fieldsets into the panel
    this.panelEdit = new OoUi.PanelLayout( { padded: true, expanded: false } );
    this.panelEdit.$element.append(
        this.layouts.links.$element,
        this.layouts.dialog.$element,
        this.layouts.general.$element,
    );

    // Render finish panel
    this.panelFinish = new OoUi.PanelLayout( { padded: true, expanded: false } );
    this.panelFinish.$element.append( $( `<p>${ utils.msg( 'settings-saved' ) }</p>` ) );

    // Render switchable layout
    this.stackLayout = new OoUi.StackLayout( {
        items: [ this.panelEdit, this.panelFinish ],
    } );
    this.$body.append( this.stackLayout.$element );
};

SettingsDialog.prototype.renderLinksFieldset = function () {
    // Show Link
    this.inputs.showLink = new OoUi.CheckboxInputWidget( {
        selected: utils.defaults( 'showLink' ),
    } );
    this.fields.showLink = new OoUi.FieldLayout( this.inputs.showLink, {
        label: utils.msg( 'settings-show-link' ),
        align: 'inline',
        help: utils.msg( 'settings-show-link-help' ),
        helpInline: true,
    } );
    this.fields.showLink.toggle( id.settings.showLink );

    // Show Page Link
    this.inputs.showPageLink = new OoUi.CheckboxInputWidget( {
        selected: utils.defaults( 'showPageLink' ),
    } );
    this.fields.showPageLink = new OoUi.FieldLayout( this.inputs.showPageLink, {
        label: utils.msg( 'settings-show-page-link' ),
        align: 'inline',
        help: utils.msg( 'settings-show-page-link-help' ),
        helpInline: true,
    } );
    this.fields.showPageLink.toggle( id.settings.showPageLink );

    // Highlight list lines when Diff Dialog opens
    this.inputs.highlightLine = new OoUi.CheckboxInputWidget( {
        selected: utils.defaults( 'highlightLine' ),
    } );
    this.fields.highlightLine = new OoUi.FieldLayout( this.inputs.highlightLine, {
        label: utils.msg( 'settings-highlight-line' ),
        align: 'inline',
    } );
    this.fields.highlightLine.toggle( id.settings.highlightLine );

    // Mark watched lines when Diff Dialog opens
    this.inputs.markWatchedLine = new OoUi.CheckboxInputWidget( {
        selected: utils.defaults( 'markWatchedLine' ),
    } );
    this.fields.markWatchedLine = new OoUi.FieldLayout( this.inputs.markWatchedLine, {
        label: utils.msg( 'settings-mark-watched-line' ),
        align: 'inline',
    } );
    this.fields.markWatchedLine.toggle( id.settings.markWatchedLine );

    // Fieldset
    this.layouts.links = new OoUi.FieldsetLayout( {
        label: utils.msg( 'settings-fieldset-links' ),
    } );
    this.layouts.links.addItems( [
        this.fields.showLink,
        this.fields.showPageLink,
        this.fields.highlightLine,
        this.fields.markWatchedLine,
    ] );
    this.layouts.links.toggle(
        id.settings.showLink ||
        id.settings.showPageLink ||
        id.settings.highlightLine ||
        id.settings.markWatchedLine,
    );
};

SettingsDialog.prototype.renderDialogFieldset = function () {
    // Unhide revisions and diff content for administrators
    this.inputs.unHideDiffs = new OoUi.CheckboxInputWidget( {
        selected: utils.defaults( 'unHideDiffs' ),
    } );
    this.fields.unHideDiffs = new OoUi.FieldLayout( this.inputs.unHideDiffs, {
        label: utils.msg( 'settings-unhide-diffs' ),
        align: 'inline',
        help: utils.msg( 'settings-unhide-diffs-help' ),
        helpInline: true,
    } );
    this.fields.unHideDiffs.toggle( id.settings.unHideDiffs );

    // Show diff info in the revisions
    this.inputs.showRevisionInfo = new OoUi.CheckboxInputWidget( {
        selected: utils.defaults( 'openInNewTab' ),
    } );
    this.fields.showRevisionInfo = new OoUi.FieldLayout( this.inputs.showRevisionInfo, {
        label: utils.msg( 'settings-show-revision-info' ),
        align: 'inline',
    } );
    this.fields.showRevisionInfo.toggle( id.settings.showRevisionInfo );

    // Open links in the new tab
    this.inputs.openInNewTab = new OoUi.CheckboxInputWidget( {
        selected: utils.defaults( 'openInNewTab' ),
    } );
    this.fields.openInNewTab = new OoUi.FieldLayout( this.inputs.openInNewTab, {
        label: utils.msg( 'settings-open-in-new-tab' ),
        align: 'inline',
    } );
    this.fields.openInNewTab.toggle( id.settings.openInNewTab );

    // Copy links format
    this.inputOptions.linksFormat = {};
    this.inputOptions.linksFormat.full = new OoUi.RadioOptionWidget( {
        data: 'full',
        label: utils.msg( 'settings-links-format-full' ),
    } );
    this.inputOptions.linksFormat.minify = new OoUi.RadioOptionWidget( {
        data: 'minify',
        label: utils.msg( 'settings-links-format-minify' ),
    } );
    this.inputs.linksFormat = new OoUi.RadioSelectWidget( {
        items: Object.values( this.inputOptions.linksFormat ),
    } );
    this.inputs.linksFormat.on( 'select', this.onLinksFormatChoose.bind( this ) );

    this.fields.linksFormat = new OoUi.FieldLayout( this.inputs.linksFormat, {
        label: utils.msg( 'settings-links-format' ),
        align: 'inline',
        help: 'placeholder',
        helpInline: true,
    } );
    this.fields.linksFormat.toggle( id.settings.linksFormat );

    // Copy wikilinks format
    this.inputOptions.wikilinksFormat = {};
    this.inputOptions.wikilinksFormat.link = new OoUi.RadioOptionWidget( {
        data: 'link',
        label: utils.msg( 'settings-wikilinks-format-link' ),
    } );
    this.inputOptions.wikilinksFormat.spacial = new OoUi.RadioOptionWidget( {
        data: 'special',
        label: utils.msg( 'settings-wikilinks-format-special' ),
    } );
    this.inputs.wikilinksFormat = new OoUi.RadioSelectWidget( {
        items: Object.values( this.inputOptions.wikilinksFormat ),
    } );
    this.inputs.wikilinksFormat.on( 'select', this.onWikilinksFormatChoose.bind( this ) );

    this.fields.wikilinksFormat = new OoUi.FieldLayout( this.inputs.wikilinksFormat, {
        label: utils.msg( 'settings-wikilinks-format' ),
        align: 'inline',
        help: 'placeholder',
        helpInline: true,
    } );
    this.fields.wikilinksFormat.toggle( id.settings.wikilinksFormat );

    // Fieldset
    this.layouts.dialog = new OoUi.FieldsetLayout( {
        label: utils.msg( 'settings-fieldset-dialog' ),
    } );
    this.layouts.dialog.addItems( [
        this.fields.unHideDiffs,
        this.fields.showRevisionInfo,
        this.fields.openInNewTab,
        this.fields.linksFormat,
        this.fields.wikilinksFormat,
    ] );
    this.layouts.dialog.toggle(
        id.settings.unHideDiffs ||
        id.settings.showRevisionInfo ||
        id.settings.openInNewTab ||
        id.settings.linksFormat ||
        id.settings.wikilinksFormat,
    );

    // Trigger selects actions
    this.inputs.linksFormat.selectItemByData( utils.defaults( 'linksFormat' ) );
    this.inputs.wikilinksFormat.selectItemByData( utils.defaults( 'wikilinksFormat' ) );
};

SettingsDialog.prototype.renderGeneralFieldset = function () {
    // Unhide revisions and diff content for administrators
    this.inputs.enableMobile = new OoUi.CheckboxInputWidget( {
        selected: utils.defaults( 'enableMobile' ),
    } );
    this.fields.enableMobile = new OoUi.FieldLayout( this.inputs.enableMobile, {
        label: utils.msg( 'settings-enable-mobile' ),
        align: 'inline',
        help: utils.msg( 'settings-enable-mobile-help' ),
        helpInline: true,
    } );
    this.fields.enableMobile.toggle( id.settings.enableMobile );

    // Show icons in the dropdown menu
    this.inputs.showMenuIcons = new OoUi.CheckboxInputWidget( {
        selected: utils.defaults( 'showMenuIcons' ),
    } );
    this.fields.showMenuIcons = new OoUi.FieldLayout( this.inputs.showMenuIcons, {
        label: utils.msg( 'settings-show-menu-icons' ),
        align: 'inline',
    } );
    this.fields.showMenuIcons.toggle( id.settings.showMenuIcons );

    // Show popup alerts for critical errors
    this.inputs.notifyErrors = new OoUi.CheckboxInputWidget( {
        selected: utils.defaults( 'notifyErrors' ),
    } );
    this.fields.notifyErrors = new OoUi.FieldLayout( this.inputs.notifyErrors, {
        label: utils.msg( 'settings-notify-errors' ),
        align: 'inline',
    } );
    this.fields.notifyErrors.toggle( id.settings.notifyErrors );

    // Fieldset
    this.layouts.general = new OoUi.FieldsetLayout( {
        label: utils.msg( 'settings-fieldset-general' ),
    } );
    this.layouts.general.addItems( [
        this.fields.enableMobile,
        this.fields.showMenuIcons,
        this.fields.notifyErrors,
    ] );
    this.layouts.general.toggle(
        id.settings.enableMobile ||
        id.settings.showMenuIcons ||
        id.settings.notifyErrors,
    );
};

SettingsDialog.prototype.onLinksFormatChoose = function () {
    const linkFormat = this.inputs.linksFormat.findFirstSelectedItem()?.getData();

    const params = {
        minify: linkFormat === 'minify',
        relative: false,
    };
    const $help = this.getLinksFormatExample( params );
    this.fields.linksFormat.$help.empty().append( $help );

    // Update the Wikilink field help text
    this.onWikilinksFormatChoose();
};

SettingsDialog.prototype.onWikilinksFormatChoose = function () {
    const linkFormat = this.inputs.linksFormat.findFirstSelectedItem()?.getData();
    const wikilinkFormat = this.inputs.wikilinksFormat.findFirstSelectedItem()?.getData();

    const params = {
        wikilink: true,
        wikilinkPreset: wikilinkFormat,
        minify: linkFormat === 'minify',
        relative: false,
    };
    const $help = this.getLinksFormatExample( params );
    this.fields.wikilinksFormat.$help.empty().append( $help );
};

SettingsDialog.prototype.getLinksFormatExample = function ( params ) {
    const title = utils.msg( 'wikilink-example-title' );
    const diff = utils.getDiffHref( { title, oldid: '12345', diff: 'prev' }, {}, params );
    const revision = utils.getRevisionHref( { title, oldid: '12345' }, {}, params );
    const page = utils.getRevisionHref( { title, curid: '12345' }, {}, params );
    return $( `
        <ul class="instantDiffs-list--settings">
            <li><i>${ diff }</i></li>
            <li><i>${ revision }</i></li>
            <li><i>${ page }</i></li>
        </ul>
    ` );
};

SettingsDialog.prototype.getSetupProcess = function ( data ) {
    return SettingsDialog.super.prototype.getSetupProcess.call( this, data )
        .next( () => this.actions.setMode( 'edit' ), this );
};

SettingsDialog.prototype.getActionProcess = function ( action ) {
    if ( action === 'save' ) {
        return new OoUi.Process( () => this.processActionSave() );
    }
    if ( action === 'reload' ) {
        return new OoUi.Process( () => this.processActionReload() );
    }
    return SettingsDialog.super.prototype.getActionProcess.call( this, action );
};

SettingsDialog.prototype.processActionSave = function () {
    this.pushPending();

    // Collect input values
    const settings = {};
    for ( const [ key, input ] of Object.entries( this.inputs ) ) {
        if ( input instanceof OoUi.CheckboxInputWidget ) {
            settings[ key ] = input.isSelected();
        }
        if ( input instanceof OoUi.RadioSelectWidget ) {
            settings[ key ] = input.findFirstSelectedItem()?.getData();
        }
    }

    return $.when( this.settings.save( settings ) )
        .always( () => this.popPending() )
        .done( () => this.onSaveActionSuccess() )
        .fail( () => this.onSaveActionError() );
};

SettingsDialog.prototype.onSaveActionSuccess = function () {
    this.actions.setMode( 'finish' );
    this.stackLayout.setItem( this.panelFinish );
};

SettingsDialog.prototype.onSaveActionError = function () {
    const error = new OoUi.Error( utils.msg( 'error-setting-save' ) );
    this.showErrors( error );
};

SettingsDialog.prototype.processActionReload = function () {
    this.pushPending();
    window.location.reload();
};

SettingsDialog.prototype.getUpdateProcess = function () {
    return new OoUi.Process()
        .next( () => {
            this.actions.setMode( 'edit' );
            this.stackLayout.setItem( this.panelEdit );
            this.processActionUpdate( utils.defaults() );
        }, this );
};

SettingsDialog.prototype.processActionUpdate = function ( settings ) {
    // Update input values
    for ( const [ key, input ] of Object.entries( this.inputs ) ) {
        const setting = settings[ key ];
        if ( typeof setting === 'undefined' ) return;

        if ( input instanceof OoUi.CheckboxInputWidget ) {
            input.setSelected( setting );
        }
        if ( input instanceof OoUi.RadioSelectWidget ) {
            input.selectItemByData( setting );
        }
    }
};

SettingsDialog.prototype.update = function ( data ) {
    return this.getUpdateProcess( data ).execute();
};

SettingsDialog.prototype.getBodyHeight = function () {
    return 535;
};