import id from './id';
import * as utils from './utils';

/**
 * Class representing a SettingsDialog.
 * @augments OO.ui.ProcessDialog
 */
export class SettingsDialog extends OO.ui.ProcessDialog {
    static name = 'Instant Diffs Settings Dialog';
    static title = utils.msg( 'settings-title' );
    static actions = [
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

    /**
     * @type {import('./Settings').default}
     */
    settings;

    /**
     * @type {object}
     */
    inputs = {};

    /**
     * @type {object}
     */
    inputOptions = {};

    /**
     * @type {object}
     */
    fields = {};

    /**
     * @type {object}
     */
    layouts = {};

    /**
     * Create a SettingsDialog instance.
     * @param {import('./Settings').default} settings a Settings instance
     */
    constructor( settings ) {
        super( {
            classes: [ 'instantDiffs-settings' ],
        } );

        this.settings = settings;
    }

    initialize( ...args ) {
        super.initialize( ...args );

        // Apply polyfills for older wikis
        utils.applyOoUiPolyfill();

        // Render fieldsets
        this.renderLinksFieldset();
        this.renderDialogFieldset();
        this.renderGeneralFieldset();

        // Combine fieldsets into the panel
        this.panelEdit = new OO.ui.PanelLayout( { padded: true, expanded: false } );
        this.panelEdit.$element.append(
            this.layouts.links.$element,
            this.layouts.dialog.$element,
            this.layouts.general.$element,
        );

        // Render finish panel
        this.panelFinish = new OO.ui.PanelLayout( { padded: true, expanded: false } );
        this.panelFinish.$element.append( $( `<p>${ utils.msg( 'settings-saved' ) }</p>` ) );

        // Render switchable layout
        this.stackLayout = new OO.ui.StackLayout( {
            items: [ this.panelEdit, this.panelFinish ],
        } );
        this.$body.append( this.stackLayout.$element );
    };

    getSetupProcess( ...args ) {
        return super.getSetupProcess( ...args )
            .next( () => this.actions.setMode( 'edit' ) );
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

    /******* FIELDS ******/

    renderLinksFieldset() {
        // Show Link
        this.inputs.showLink = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'showLink' ),
        } );
        this.fields.showLink = new OO.ui.FieldLayout( this.inputs.showLink, {
            label: utils.msg( 'settings-show-link' ),
            align: 'inline',
            help: utils.msg( 'settings-show-link-help' ),
            helpInline: true,
        } );
        this.fields.showLink.toggle( id.settings.showLink );

        // Show Page Link
        this.inputs.showPageLink = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'showPageLink' ),
        } );
        this.fields.showPageLink = new OO.ui.FieldLayout( this.inputs.showPageLink, {
            label: utils.msg( 'settings-show-page-link' ),
            align: 'inline',
            help: utils.msg( 'settings-show-page-link-help' ),
            helpInline: true,
        } );
        this.fields.showPageLink.toggle( id.settings.showPageLink );

        // Highlight list lines when Diff Dialog opens
        this.inputs.highlightLine = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'highlightLine' ),
        } );
        this.fields.highlightLine = new OO.ui.FieldLayout( this.inputs.highlightLine, {
            label: utils.msg( 'settings-highlight-line' ),
            align: 'inline',
        } );
        this.fields.highlightLine.toggle( id.settings.highlightLine );

        // Mark watched lines when Diff Dialog opens
        this.inputs.markWatchedLine = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'markWatchedLine' ),
        } );
        this.fields.markWatchedLine = new OO.ui.FieldLayout( this.inputs.markWatchedLine, {
            label: utils.msg( 'settings-mark-watched-line' ),
            align: 'inline',
        } );
        this.fields.markWatchedLine.toggle( id.settings.markWatchedLine );

        // Fieldset
        this.layouts.links = new OO.ui.FieldsetLayout( {
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

    renderDialogFieldset() {
        // Unhide revisions and diff content for administrators
        this.inputs.unHideDiffs = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'unHideDiffs' ),
        } );
        this.fields.unHideDiffs = new OO.ui.FieldLayout( this.inputs.unHideDiffs, {
            label: utils.msg( 'settings-unhide-diffs' ),
            align: 'inline',
            help: utils.msg( 'settings-unhide-diffs-help' ),
            helpInline: true,
        } );
        this.fields.unHideDiffs.toggle( id.settings.unHideDiffs );

        // Show diff info in the revisions
        this.inputs.showRevisionInfo = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'openInNewTab' ),
        } );
        this.fields.showRevisionInfo = new OO.ui.FieldLayout( this.inputs.showRevisionInfo, {
            label: utils.msg( 'settings-show-revision-info' ),
            align: 'inline',
        } );
        this.fields.showRevisionInfo.toggle( id.settings.showRevisionInfo );

        // Open links in the new tab
        this.inputs.openInNewTab = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'openInNewTab' ),
        } );
        this.fields.openInNewTab = new OO.ui.FieldLayout( this.inputs.openInNewTab, {
            label: utils.msg( 'settings-open-in-new-tab' ),
            align: 'inline',
        } );
        this.fields.openInNewTab.toggle( id.settings.openInNewTab );

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
        this.inputs.linksFormat.on( 'select', this.onLinksFormatChoose.bind( this ) );

        this.fields.linksFormat = new OO.ui.FieldLayout( this.inputs.linksFormat, {
            label: utils.msg( 'settings-links-format' ),
            align: 'inline',
            help: 'placeholder',
            helpInline: true,
        } );
        this.fields.linksFormat.toggle( id.settings.linksFormat );

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
        this.inputs.wikilinksFormat.on( 'select', this.onWikilinksFormatChoose.bind( this ) );

        this.fields.wikilinksFormat = new OO.ui.FieldLayout( this.inputs.wikilinksFormat, {
            label: utils.msg( 'settings-wikilinks-format' ),
            align: 'inline',
            help: 'placeholder',
            helpInline: true,
        } );
        this.fields.wikilinksFormat.toggle( id.settings.wikilinksFormat );

        // Fieldset
        this.layouts.dialog = new OO.ui.FieldsetLayout( {
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

    renderGeneralFieldset() {
        // Unhide revisions and diff content for administrators
        this.inputs.enableMobile = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'enableMobile' ),
        } );
        this.fields.enableMobile = new OO.ui.FieldLayout( this.inputs.enableMobile, {
            label: utils.msg( 'settings-enable-mobile' ),
            align: 'inline',
            help: utils.msg( 'settings-enable-mobile-help' ),
            helpInline: true,
        } );
        this.fields.enableMobile.toggle( id.settings.enableMobile );

        // Show icons in the dropdown menu
        this.inputs.showMenuIcons = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'showMenuIcons' ),
        } );
        this.fields.showMenuIcons = new OO.ui.FieldLayout( this.inputs.showMenuIcons, {
            label: utils.msg( 'settings-show-menu-icons' ),
            align: 'inline',
        } );
        this.fields.showMenuIcons.toggle( id.settings.showMenuIcons );

        // Show popup alerts for critical errors
        this.inputs.notifyErrors = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'notifyErrors' ),
        } );
        this.fields.notifyErrors = new OO.ui.FieldLayout( this.inputs.notifyErrors, {
            label: utils.msg( 'settings-notify-errors' ),
            align: 'inline',
        } );
        this.fields.notifyErrors.toggle( id.settings.notifyErrors );

        // Fieldset
        this.layouts.general = new OO.ui.FieldsetLayout( {
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

    onLinksFormatChoose() {
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

    onWikilinksFormatChoose() {
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
        const title = utils.msg( 'wikilink-example-title' );
        const diff = utils.getTypeHref( { title, oldid: '12345', diff: 'prev' }, {}, { ...options, type: 'diff' } );
        const revision = utils.getTypeHref( { title, oldid: '12345' }, {}, { ...options, type: 'revision' } );
        const page = utils.getTypeHref( { title, curid: '12345' }, {}, { ...options, type: 'page' } );
        return $( `
            <ul class="instantDiffs-list--settings">
                <li><i>${ diff }</i></li>
                <li><i>${ revision }</i></li>
                <li><i>${ page }</i></li>
            </ul>
        ` );
    };

    /******* SAVE PROCESS ******/

    processActionSave() {
        this.pushPending();

        // Collect input values
        const settings = {};
        for ( const [ key, input ] of Object.entries( this.inputs ) ) {
            if ( input instanceof OO.ui.CheckboxInputWidget ) {
                settings[ key ] = input.isSelected();
            }
            if ( input instanceof OO.ui.RadioSelectWidget ) {
                settings[ key ] = input.findFirstSelectedItem()?.getData();
            }
        }

        return $.when( this.settings.save( settings ) )
            .always( () => this.popPending() )
            .done( () => this.onSaveActionSuccess() )
            .fail( () => this.onSaveActionError() );
    }

    onSaveActionSuccess() {
        this.actions.setMode( 'finish' );
        this.stackLayout.setItem( this.panelFinish );
    }

    onSaveActionError() {
        const error = new OO.ui.Error( utils.msg( 'error-setting-save' ) );
        this.showErrors( error );
    }

    /******* UPDATE PROCESS *******/

    update( data ) {
        return this.getUpdateProcess( data ).execute();
    }

    getUpdateProcess() {
        return new OO.ui.Process()
            .next( () => {
                this.actions.setMode( 'edit' );
                this.stackLayout.setItem( this.panelEdit );
                this.processActionUpdate( utils.defaults() );
            }, this );
    }

    processActionUpdate( settings ) {
        // Update input values
        for ( const [ key, input ] of Object.entries( this.inputs ) ) {
            const setting = settings[ key ];
            if ( typeof setting === 'undefined' ) return;

            if ( input instanceof OO.ui.CheckboxInputWidget ) {
                input.setSelected( setting );
            }
            if ( input instanceof OO.ui.RadioSelectWidget ) {
                input.selectItemByData( setting );
            }
        }
    }

    /******* ACTIONS *******/

    processActionReload() {
        this.pushPending();
        window.location.reload();
    }

    getBodyHeight() {
        return 535;
    }
}

utils.tweakUserOoUiClass( SettingsDialog );