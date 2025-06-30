import id from './id';
import * as utils from './utils';
import { tweakUserOoUiClass } from './utils-oojs';

import settings from './Settings';

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

    renderEditPanel() {
        // Render fieldsets
        this.renderLinksFieldset();
        this.renderDialogFieldset();
        this.renderGeneralFieldset();

        // Combine fieldsets into the panel
        return new OO.ui.PanelLayout( {
            classes: [ 'instantDiffs-settings-panel', 'instantDiffs-settings-panel--edit' ],
            padded: true,
            expanded: false,
            $content: [
                this.layouts.links.$element,
                this.layouts.dialog.$element,
                this.layouts.general.$element,
            ],
        } );
    }

    renderFinishPanel() {
        // Icon: [[:File:Eo circle light-green checkmark.svg]] by Emoji One contributors and [[User:IagoQns]]
        const content = utils.renderSuccessBox( {
            content: utils.msg( 'settings-saved' ),
            image: '/6/6f/Eo_circle_light-green_checkmark.svg',
            alt: utils.msg( 'settings-saved-icon' ),
        } );

        return new OO.ui.PanelLayout( {
            classes: [ 'instantDiffs-settings-panel', 'instantDiffs-settings-panel--finish' ],
            padded: true,
            expanded: false,
            $content: content,
        } );
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
            help: utils.msgDom( 'settings-show-page-link-help' ),
            helpInline: true,
        } );
        this.fields.showPageLink.toggle( id.settings.showPageLink );

        // Highlight list lines when View dialog opens
        this.inputs.highlightLine = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'highlightLine' ),
        } );
        this.fields.highlightLine = new OO.ui.FieldLayout( this.inputs.highlightLine, {
            label: utils.msg( 'settings-highlight-line' ),
            align: 'inline',
        } );
        this.fields.highlightLine.toggle( id.settings.highlightLine );

        // Mark watched lines when View dialog opens
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
        // Show inline format toggle button
        this.inputs.showDiffTools = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'showDiffTools' ),
        } );
        this.fields.showDiffTools = new OO.ui.FieldLayout( this.inputs.showDiffTools, {
            label: utils.msg( 'settings-show-diff-tools' ),
            align: 'inline',
        } );
        this.fields.showDiffTools.toggle( id.settings.showDiffTools );

        // Show diff info in the revisions
        this.inputs.showRevisionInfo = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'showRevisionInfo' ),
        } );
        this.fields.showRevisionInfo = new OO.ui.FieldLayout( this.inputs.showRevisionInfo, {
            label: utils.msg( 'settings-show-revision-info' ),
            align: 'inline',
        } );
        this.fields.showRevisionInfo.toggle( id.settings.showRevisionInfo );

        // Unhide revisions and diff content for administrators
        this.inputs.unHideDiffs = new OO.ui.CheckboxInputWidget( {
            selected: utils.defaults( 'unHideDiffs' ),
        } );
        this.fields.unHideDiffs = new OO.ui.FieldLayout( this.inputs.unHideDiffs, {
            label: utils.msg( 'settings-unhide-diffs' ),
            align: 'inline',
            help: utils.msgDom( 'settings-unhide-diffs-help', 'suppressrevision' ),
            helpInline: true,
        } );
        this.fields.unHideDiffs.toggle( id.settings.unHideDiffs );

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
            this.fields.showDiffTools,
            this.fields.showRevisionInfo,
            this.fields.unHideDiffs,
            this.fields.openInNewTab,
            this.fields.linksFormat,
            this.fields.wikilinksFormat,
        ] );
        this.layouts.dialog.toggle(
            id.settings.showDiffTools ||
            id.settings.showRevisionInfo ||
            id.settings.unHideDiffs ||
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
        const title = utils.msg( 'copy-wikilink-example-title' );
        const diff = utils.getTypeHref( { title, diff: '12345', type: 'diff' }, {}, options );
        const revision = utils.getTypeHref( { title, oldid: '12345', type: 'revision' }, {}, options );
        const page = utils.getTypeHref( { title, curid: '12345', type: 'revision', typeVariant: 'page' }, {}, options );
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
    }

    getBodyHeight() {
        return 535;
    }

    /******* REQUEST PROCESS ******/

    processActionRequest() {
        // Show pending loader in the header
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
     * Event that emits after user options request failed.
     * @param {object} [error]
     * @param {object} [data]
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
     * Event that emits after user options request successive.
     * @param {object} [data]
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
            utils.setDefaults( options, true );
        } catch ( e ) {}

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
            this.processActionUpdate( utils.defaults() );
        } );
    }

    processActionUpdate( options ) {
        // Hide pending loader in the header
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
        }

        settings.save( options )
            .then( this.onActionSaveSuccess.bind( this ) )
            .fail( this.onActionSaveError.bind( this ) )
            .always( () => this.popPending() );
    }

    /**
     * Event that emits after save request failed.
     * @param {object} [error]
     * @param {object} [data]
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