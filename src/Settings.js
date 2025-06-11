import $ from 'jquery';
import mw from 'mediawiki';
import OO from 'oojs';
import OoUi from 'oojs-ui';

import id from './id';
import * as utils from './utils';

import './styles/settings.less';

function Settings( options ) {
    this.isDependenciesLoaded = false;
    this.isConstructed = false;
    this.isOpen = false;
    this.isLoading = false;

    this.options = {};

    this.process.apply( this, arguments );
}

Settings.prototype.process = function ( options ) {
    this.options = $.extend( true, {
        onOpen: function () {},
        onClose: function () {},
    }, options );
};

/*** DEPENDENCIES ***/

Settings.prototype.load = function () {
    if ( this.isLoading ) return;

    if ( this.isDependenciesLoaded ) {
        return this.request();
    }

    this.isLoading = true;
    this.error = null;

    return $.when( mw.loader.using( utils.getDependencies( id.config.dependencies.settings ) ) )
        .then( this.onLoadSuccess.bind( this ) )
        .fail( this.onLoadError.bind( this ) );
};

Settings.prototype.onLoadError = function ( error ) {
    this.isLoading = false;
    this.isDependenciesLoaded = false;
    this.error = {
        type: 'dependencies',
        message: error && error.message ? error.message : null,
    };
    utils.notifyError( 'error-dependencies-generic', null, this.error );
};

Settings.prototype.onLoadSuccess = function () {
    this.isLoading = false;
    this.isDependenciesLoaded = true;
    return this.request();
};

/*** DIALOG ***/

Settings.prototype.construct = function () {
    const wrapper = this;
    this.isConstructed = true;

    // Construct a custom ProcessDialog
    this.SettingsDialog = function () {
        this.inputs = {};
        this.inputOptions = {};
        this.fields = {};
        this.layouts = {};
        wrapper.SettingsDialog.super.call( this, {
            classes: [ 'instantDiffs-settings' ],
        } );
    };
    OO.inheritClass( this.SettingsDialog, OoUi.ProcessDialog );

    this.SettingsDialog.static.name = 'Instant Diffs Settings Dialog';
    this.SettingsDialog.static.title = utils.msg( 'settings-title' );
    this.SettingsDialog.static.actions = [
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

    this.SettingsDialog.prototype.initialize = function () {
        wrapper.SettingsDialog.super.prototype.initialize.apply( this, arguments );

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

    this.SettingsDialog.prototype.renderLinksFieldset = function () {
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

    this.SettingsDialog.prototype.renderDialogFieldset = function () {
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

    this.SettingsDialog.prototype.renderGeneralFieldset = function () {
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

    this.SettingsDialog.prototype.onLinksFormatChoose = function () {
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

    this.SettingsDialog.prototype.onWikilinksFormatChoose = function () {
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

    this.SettingsDialog.prototype.getLinksFormatExample = function ( params ) {
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

    this.SettingsDialog.prototype.getSetupProcess = function ( data ) {
        return wrapper.SettingsDialog.super.prototype.getSetupProcess.call( this, data )
            .next( () => this.actions.setMode( 'edit' ), this );
    };

    this.SettingsDialog.prototype.getActionProcess = function ( action ) {
        if ( action === 'save' ) {
            return new OoUi.Process( () => this.processActionSave() );
        }
        if ( action === 'reload' ) {
            return new OoUi.Process( () => this.processActionReload() );
        }
        return wrapper.SettingsDialog.super.prototype.getActionProcess.call( this, action );
    };

    this.SettingsDialog.prototype.processActionSave = function () {
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

        return $.when( wrapper.save( settings ) )
            .always( () => this.popPending() )
            .done( () => this.onSaveActionSuccess() )
            .fail( () => this.onSaveActionError() );
    };

    this.SettingsDialog.prototype.onSaveActionSuccess = function () {
        this.actions.setMode( 'finish' );
        this.stackLayout.setItem( this.panelFinish );
    };

    this.SettingsDialog.prototype.onSaveActionError = function () {
        const error = new OoUi.Error( utils.msg( 'error-setting-save' ) );
        this.showErrors( error );
    };

    this.SettingsDialog.prototype.processActionReload = function () {
        this.pushPending();
        window.location.reload();
    };

    this.SettingsDialog.prototype.getUpdateProcess = function () {
        return new OoUi.Process()
            .next( () => {
                this.actions.setMode( 'edit' );
                this.stackLayout.setItem( this.panelEdit );
                this.processActionUpdate( utils.defaults() );
            }, this );
    };

    this.SettingsDialog.prototype.processActionUpdate = function ( settings ) {
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

    this.SettingsDialog.prototype.update = function ( data ) {
        return this.getUpdateProcess( data ).execute();
    };

    this.SettingsDialog.prototype.getBodyHeight = function () {
        return 535;
    };

    // Construct MessageDialog and attach it to the Window Managers
    this.dialog = new this.SettingsDialog();
    this.manager = utils.getWindowManager();
    this.manager.addWindows( [ this.dialog ] );
};

/*** USER OPTIONS ***/

Settings.prototype.request = function () {
    if ( !this.isConstructed ) {
        this.construct();
    }
    if ( id.local.mwIsAnon ) {
        return this.open();
    }

    this.isLoading = true;
    this.error = null;

    const params = {
        action: 'query',
        meta: 'userinfo',
        uiprop: 'options',
        format: 'json',
        formatversion: 2,
        uselang: id.local.language,
    };
    return id.local.mwApi
        .post( params )
        .then( this.onRequestSuccess.bind( this ) )
        .fail( this.onRequestError.bind( this ) );
};

Settings.prototype.onRequestError = function ( error, data ) {
    this.isLoading = false;

    this.error = {
        type: 'settings',
        message: error,
    };
    if ( data?.error ) {
        this.error.code = data.error.code;
        this.error.message = data.error.info;
    }
    utils.notifyError( 'error-setting-request', null, this.error );

    this.open();
};

Settings.prototype.onRequestSuccess = function ( data ) {
    this.isLoading = false;

    // Render error if the userinfo request is completely failed
    const options = data?.query?.userinfo?.options;
    if ( !options ) {
        return this.onRequestError();
    }

    try {
        const settings = JSON.parse( options[ `${ id.config.settingsPrefix }-settings` ] );
        utils.setDefaults( settings, true );
    } catch ( e ) {}

    this.open();
};

Settings.prototype.save = function ( settings ) {
    // Update settings stored in the Local Storage
    mw.storage.setObject( `${ id.config.prefix }-settings`, settings );

    // Guest settings stored only in the Local Storage
    if ( id.local.mwIsAnon ) return true;

    // Check if the Global Preferences extension is available
    const dependencies = utils.getDependencies( [ 'ext.GlobalPreferences.global' ] );
    if ( dependencies.length > 0 ) {
        return this.saveGlobal( settings );
    }

    return this.saveLocal( settings );
};

Settings.prototype.saveLocal = function ( settings ) {
    const params = [
        `${ id.config.settingsPrefix }-settings`,
        JSON.stringify( settings ),
    ];
    return id.local.mwApi.saveOption.apply( id.local.mwApi, params );
};

Settings.prototype.saveGlobal = function ( settings ) {
    const params = {
        action: 'globalpreferences',
        optionname: `${ id.config.settingsPrefix }-settings`,
        optionvalue: JSON.stringify( settings ),
    };
    return id.local.mwApi.postWithEditToken( params );
};

/*** ACTIONS ***/

Settings.prototype.open = function () {
    if ( this.isOpen ) return;

    if ( !this.isConstructed ) {
        this.construct();
    } else {
        this.dialog.update();
    }

    this.windowInstance = this.manager.openWindow( this.dialog );
    this.windowInstance.opened.then( this.onOpen.bind( this ) );
    this.windowInstance.closed.then( this.onClose.bind( this ) );
};

Settings.prototype.onOpen = function () {
    this.isOpen = true;
    if ( utils.isFunction( this.options.onOpen ) ) {
        this.options.onOpen( this );
    }
};

Settings.prototype.onClose = function () {
    this.isOpen = false;
    if ( utils.isFunction( this.options.onClose ) ) {
        this.options.onClose( this );
    }
};

export default Settings;