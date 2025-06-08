import $ from 'jquery';
import mw from 'mediawiki';
import OoUi from 'oojs-ui';

import id from './id';
import * as utils from './utils';

import Button from './Button';
import Link from './Link';
import Settings from './Settings';

function Diff( page, options ) {
    this.page = $.extend( {
        title: null,
        section: null,
        oldid: null,
        diff: null,
        revid: null,
        curid: null,
        direction: null,
    }, page );

    this.options = $.extend( true, {
        type: 'diff',
        typeVariant: null,
        initiatorDiff: null,
        initiatorDialog: null,
    }, options );

    this.pageParams = {
        action: 'render',
        diffonly: this.options.type === 'diff' ? 1 : 0,
        unhide: utils.defaults( 'unHideDiffs' ) ? 1 : 0,
        uselang: id.local.language,
    };

    this.mwConfg = {
        'thanks-confirmation-required': true,
        wgDiffOldId: null,
        wgDiffNewId: null,
    };

    this.nodes = {};
    this.links = {};
    this.buttons = {};
    this.isLoading = false;

    // Validate page object
    if ( [ 0, '0', 'current' ].includes( this.page.diff ) ) {
        this.page.diff = 'cur';
    }
    if ( !utils.isValidDir( this.page.direction ) ) {
        this.page.direction = 'prev';
    }
    this.page = utils.extendPage( this.page );
}

Diff.prototype.load = function () {
    if ( this.isLoading ) return;

    if ( this.options.type === 'revision' ) {
        this.requestPageDependencies();
    }

    return this.request();
};

/*** REQUESTS ***/

Diff.prototype.requestPageDependencies = function () {
    const params = {
        action: 'parse',
        prop: [ 'modules', 'jsconfigvars' ],
        disablelimitreport: 1,
        redirects: 1,
        format: 'json',
        formatversion: 2,
        uselang: id.local.language,
    };

    // FixMe: oldid can be for the previous revision (in cases when direction = next)
    if ( !utils.isEmpty( this.page.oldid ) ) {
        params.oldid = this.page.oldid;
    } else if ( !utils.isEmpty( this.page.curid ) ) {
        params.pageid = this.page.curid;
    }

    return id.local.mwApi
        .get( params )
        .then( this.onRequestPageDependenciesDone.bind( this ) )
        .fail( this.onRequestPageDependenciesError.bind( this ) );
};

Diff.prototype.onRequestPageDependenciesError = function ( error, data ) {
    const params = {
        type: 'dependencies',
    };
    if ( data?.error ) {
        params.code = data.error.code;
        params.message = data.error.info;
    } else {
        params.message = error;
    }
    utils.notifyError( 'error-dependencies-parse', this.page, params, true );
};

Diff.prototype.onRequestPageDependenciesDone = function ( data ) {
    // Render error if the parse request is completely failed
    const parse = data?.parse;
    if ( !parse ) {
        return this.onRequestPageDependenciesError( null, data );
    }

    // Get page dependencies
    let dependencies = [ ...parse.modulestyles, ...parse.modulescripts, ...parse.modules ];

    // Get dependencies by type
    const typeDependencies = id.config.dependencies[ this.options.type ];
    if ( typeDependencies ) {
        // Set common dependencies
        if ( typeDependencies[ '*' ] ) {
            dependencies = dependencies.concat( typeDependencies[ '*' ] );
        }

        // Set namespace-specific dependencies
        const pageNamespace = this.page.mwTitle?.getNamespaceId();
        if ( typeDependencies[ pageNamespace ] ) {
            dependencies = dependencies.concat( typeDependencies[ pageNamespace ] );
        }
    }

    mw.config.set( parse.jsconfigvars );
    mw.loader.load( utils.getDependencies( dependencies ) );
};

Diff.prototype.request = function () {
    this.isLoading = true;
    this.error = null;

    const page = {
        title: !utils.isEmpty( this.page.title ) ? this.page.title : undefined,
        diff: !utils.isEmpty( this.page.diff ) ? this.page.diff : this.page.direction,
        oldid: !utils.isEmpty( this.page.oldid ) ? this.page.oldid : undefined,
        curid: !utils.isEmpty( this.page.curid ) ? this.page.curid : undefined,
    };

    const params = {
        url: id.local.mwEndPoint,
        dataType: 'html',
        data: $.extend( page, this.pageParams ),
    };

    return $.ajax( params )
        .done( this.onRequestDone.bind( this ) )
        .fail( this.onRequestError.bind( this ) );
};

Diff.prototype.onRequestError = function ( data ) {
    this.isLoading = false;

    this.error = {
        type: this.options.type,
        code: this.options.type === 'revision' && !utils.isEmpty( this.page.curid ) ? 'curid' : 'generic',
    };

    if ( data?.error ) {
        this.error.code = data.error.code;
        this.error.message = data.error.info;
    }
    utils.notifyError( `error-${ this.error.type }-${ this.error.code }`, this.page, this.error );

    this.render();
    mw.hook( `${ id.config.prefix }.diff.renderError` ).fire( this );
    mw.hook( `${ id.config.prefix }.diff.renderComplete` ).fire( this );
};

Diff.prototype.onRequestDone = function ( data ) {
    this.isLoading = false;
    this.data = data;

    if ( !this.data ) {
        return this.onRequestError();
    }

    this.render();
    mw.hook( `${ id.config.prefix }.diff.renderSuccess` ).fire( this );
    mw.hook( `${ id.config.prefix }.diff.renderComplete` ).fire( this );
};

/*** RENDER ***/

Diff.prototype.render = function () {
    const classes = [
        'instantDiffs-dialog-content',
        `instantDiffs-dialog-content--${ this.options.type }`,
        'mw-body-content',
        `mw-content-${ document.dir }`,
    ];
    const skinClasses = id.config.skinBodyClasses[ mw.config.get( 'skin' ) ];
    if ( skinClasses ) {
        classes.push( ...skinClasses );
    }

    this.nodes.$container = $( '<div>' )
        .attr( 'dir', document.dir )
        .addClass( classes );

    this.nodes.$tools = $( '<div>' )
        .addClass( 'instantDiffs-dialog-tools' )
        .appendTo( this.nodes.$container );

    this.nodes.$body = $( '<div>' )
        .addClass( 'instantDiffs-dialog-body' )
        .appendTo( this.nodes.$container );

    if ( this.error ) {
        this.renderError();
    } else {
        this.renderContent();
    }

    this.renderNavigation();
};

Diff.prototype.renderContent = function () {
    // Parse and append all data coming from endpoint
    this.nodes.data = $.parseHTML( this.data );
    this.nodes.$data = $( this.nodes.data ).appendTo( this.nodes.$body );

    // Prepend content warnings
    this.nodes.$data
        .filter( '.cdx-message' )
        .prependTo( this.nodes.$body );
    this.nodes.$data
        .find( '.cdx-message ' )
        .prependTo( this.nodes.$body );

    // Render a warning when revision was not found
    const $emptyMessage = this.nodes.$data.filter( 'p' );
    if ( $emptyMessage.length > 0 ) {
        this.renderWarning( $emptyMessage );
    }

    // Collect missing data from the diff table before manipulations
    this.collectData();

    // Process diff table
    this.renderDiffTable();

    // Hide unsupported or unnecessary apps and element
    this.nodes.$wikiLambdaApp = this.nodes.$data
        .filter( '#ext-wikilambda-app' )
        .addClass( 'instantDiffs-hidden' );

    if ( this.nodes.$wikiLambdaApp.length > 0 ) {
        const $message = $( `<p>${ utils.msg( 'unsupported-wikilambda' ) }</p>` );
        this.renderWarning( $message );
    }

    // Set additional config variables
    mw.config.set( this.mwConfg );
};

Diff.prototype.collectData = function () {
    const $fromLinks = this.nodes.$data.find( '#mw-diff-otitle1 strong > a, #mw-diff-otitle4 > a' );
    const $toLinks = this.nodes.$data.find( '#mw-diff-ntitle1 strong > a, #mw-diff-ntitle4 > a' );

    // Get diff and oldid values
    // FixMe: request via api action=revisions
    if ( $fromLinks.length > 0 ) {
        const oldid = utils.getOldidFromUrl( $fromLinks.prop( 'href' ) );
        if ( utils.isValidID( oldid ) ) {
            this.mwConfg.wgDiffOldId = oldid;
        }
    }
    if ( $toLinks.length > 0 ) {
        const diff = utils.getOldidFromUrl( $toLinks.prop( 'href' ) );
        if ( utils.isValidID( diff ) ) {
            this.mwConfg.wgDiffNewId = diff;
            this.mwConfg.wgRevisionId = diff;

            // Set actual revision id for the copy actions, etc
            if ( this.options.typeVariant !== 'page' ) {
                this.page.revid = diff;
            }

            // Replace diff when its values = cur
            if ( this.page.diff === 'cur' ) {
                this.page.diff = diff;
            }
        }
    }

    // Get page title
    const $links = $toLinks.add( $fromLinks );
    if ( utils.isEmpty( this.page.title ) && $links.length > 0 ) {
        const title = utils.getTitleFromUrl( $links.prop( 'href' ) ) || $links.prop( 'title' );
        this.page = utils.extendPage( this.page, { title } );
    }

    // Populate section name
    const $toSectionLinks = this.nodes.$data.find( '#mw-diff-ntitle3 .autocomment a' );
    if ( utils.isEmpty( this.page.section ) && $toSectionLinks.length > 0 ) {
        const section = utils.getHashFromUrl( $toSectionLinks.prop( 'href' ) );
        this.page = utils.extendPage( this.page, { section } );
    }
};

Diff.prototype.renderDiffTable = function () {
    // Hide unsupported or unnecessary element
    this.nodes.$data
        .filter( '.mw-revslider-container, .mw-diff-revision-history-links, .mw-diff-table-prefix, #mw-oldid' )
        .addClass( 'instantDiffs-hidden' );
    this.nodes.$data
        .find( '.fr-diff-to-stable, #mw-fr-diff-dataform' )
        .addClass( 'instantDiffs-hidden' );

    // Find table elements
    this.nodes.$frDiff = this.nodes.$data.filter( '#mw-fr-diff-headeritems' );
    this.nodes.$table = this.nodes.$data.filter( 'table.diff' );

    // Find and detach the all unpatrolled diffs link
    this.nodes.$pendingLink = this.nodes.$frDiff
        .find( '.fr-diff-to-stable a' )
        .detach();
    if ( this.options.type === 'diff' ) {
        this.links.$pending = this.nodes.$pendingLink;
    }

    // Find and detach the next / previous diff links
    this.links.$prev = this.nodes.$table
        .find( '#differences-prevlink' )
        .detach();
    this.links.$next = this.nodes.$table
        .find( '#differences-nextlink' )
        .detach();

    // Clear whitespaces after detaching links
    const leftTitle4 = this.nodes.$table.find( '#mw-diff-otitle4' );
    if ( leftTitle4.length > 0 ) {
        leftTitle4.text( leftTitle4.text().trim() );
    }
    const rightTitle4 = this.nodes.$table.find( '#mw-diff-ntitle4' );
    if ( rightTitle4.length > 0 ) {
        rightTitle4.text( rightTitle4.text().trim() );
    }

    // Show or hide diff info table in the revisions
    if ( this.options.type === 'revision' ) {
        if ( utils.defaults( 'showRevisionInfo' ) ) {
            // Hide the left side of the table and left only related to the revision info
            this.nodes.$frDiff.find( '.fr-diff-ratings td:nth-child(2n-1)' ).addClass( 'instantDiffs-hidden' );
            this.nodes.$table.find( 'td:is(.diff-otitle, .diff-side-deleted)' ).addClass( 'instantDiffs-hidden' );
            this.nodes.$table.find( 'td:is(.diff-ntitle, .diff-side-added)' ).attr( 'colspan', '4' );

            // Hide comparison lines
            this.nodes.$table.find( 'tr:not([class])' ).addClass( 'instantDiffs-hidden' );
        } else {
            this.nodes.$frDiff.addClass( 'instantDiffs-hidden' );
            this.nodes.$table.addClass( 'instantDiffs-hidden' );
        }
    }
};

Diff.prototype.renderError = function () {
    const $message = $( `<p>${ utils.msg( 'error-revision-missing' ) }</p>` );
    if ( this.error?.message ) {
        $message.add( `<p>${ this.error.message }</p>` );
    }
    this.renderWarning( $message );
};

Diff.prototype.renderWarning = function ( $content ) {
    const $box = utils.renderBox( { $content, type: 'warning' } );
    utils.embed( $box, this.nodes.$body );
};

/*** RENDER NAVIGATION ***/

Diff.prototype.renderNavigation = function () {
    // Render structure
    this.nodes.$navigation = $( '<div>' )
        .addClass( 'instantDiffs-navigation' )
        .prependTo( this.nodes.$container );

    this.nodes.$navigationLeft = $( '<div>' )
        .addClass( [ 'instantDiffs-navigation-group', 'instantDiffs-navigation-group--left' ] )
        .appendTo( this.nodes.$navigation );

    this.nodes.$navigationCenter = $( '<div>' )
        .addClass( [ 'instantDiffs-navigation-group', 'instantDiffs-navigation-group--center' ] )
        .appendTo( this.nodes.$navigation );

    this.nodes.$navigationRight = $( '<div>' )
        .addClass( [ 'instantDiffs-navigation-group', 'instantDiffs-navigation-group--right' ] )
        .appendTo( this.nodes.$navigation );

    // Render panels
    this.renderSnapshotLinks();
    this.renderNavigationLinks();
    this.renderMenuLinks();
};

Diff.prototype.renderSnapshotLinks = function () {
    const items = [];

    if ( id.local.snapshot.getLength() > 1 && id.local.snapshot.getIndex() !== -1 ) {
        // Previous link on the page
        this.buttons.shapshotPrev = this.renderSnapshotPrevLink();
        items.push( this.buttons.shapshotPrev );

        // Next link on the page
        this.buttons.snapshotNext = this.renderSnapshotNextLink();
        items.push( this.buttons.snapshotNext );
    }

    // Render group
    this.buttons.snapshotGroup = new OoUi.ButtonGroupWidget( { items: items } );
    this.nodes.$navigationLeft.append( this.buttons.snapshotGroup.$element );
};

Diff.prototype.renderNavigationLinks = function () {
    const items = [];

    // Link to the previous diff
    this.buttons.prev = this.renderPrevLink();
    items.push( this.buttons.prev );

    // Link that switch between revision and diff
    if ( ![ 'page' ].includes( this.options.typeVariant ) ) {
        this.buttons.switch = this.renderSwitchLink();
        items.push( this.buttons.switch );
    }

    // Link to the next diff
    this.buttons.next = this.renderNextLink();
    items.push( this.buttons.next );

    // Render group
    this.buttons.navigationGroup = new OoUi.ButtonGroupWidget( { items: items } );
    this.nodes.$navigationCenter.append( this.buttons.navigationGroup.$element );
};

/*** RENDER MENU ***/

Diff.prototype.renderMenuLinks = function () {
    const items = [];

    // Icon button parameters
    const iconParams = {
        invisibleLabel: true,
        renderIcon: true,
    };

    // Back to the initiator diff link
    if ( this.options.initiatorDiff ) {
        this.buttons.initiatorDiff = this.renderBackLink( iconParams );
        items.push( this.buttons.initiatorDiff );
    }

    // [FlaggedRevisions] Link to all unpatrolled changes
    if ( this.links.$pending?.length > 0 ) {
        this.buttons.pending = this.renderPendingLink( iconParams );
        items.push( this.buttons.pending );
    }

    // Menu button parameters
    const buttonParams = {
        framed: false,
        icon: null,
        classes: [ 'instantDiffs-button--link' ],
    };

    // Render menu groups
    this.buttons.menuMobile = this.renderMenuMobileGroup( buttonParams );
    this.buttons.menuGroup = this.renderMenuGroup( buttonParams );

    const groupsElements = [
        this.buttons.menuMobile.$element.get( 0 ),
        this.buttons.menuGroup.$element.get( 0 ),
    ];

    // Dropdown menu
    this.buttons.menuDropdown = new OoUi.PopupButtonWidget( {
        icon: 'menu',
        label: utils.msg( 'goto-links' ),
        title: utils.msg( 'goto-links' ),
        invisibleLabel: true,
        popup: {
            $content: $( groupsElements ),
            width: 'auto',
            padded: false,
            anchor: false,
            align: 'backwards',
        },
    } );
    items.push( this.buttons.menuDropdown );

    // Render group
    this.buttons.menuGroup = new OoUi.ButtonGroupWidget( { items: items } );
    this.nodes.$navigationRight.append( this.buttons.menuGroup.$element );
};

Diff.prototype.renderMenuGroup = function ( buttonParams ) {
    const items = [];

    // Copy a link to the clipboard
    this.buttons.copy = new OoUi.ButtonWidget(
        $.extend( true, {}, buttonParams, {
            label: utils.msg( 'copy-link' ),
        } ),
    );
    this.buttons.copyHelper = new Button( {
        node: this.buttons.copy.$button.get( 0 ),
        handler: this.actionCopyLink.bind( this ),
    } );
    items.push( this.buttons.copy );

    // Copy a wikilink to the clipboard
    this.buttons.copyWiki = new OoUi.ButtonWidget(
        $.extend( true, {}, buttonParams, {
            label: utils.msg( 'copy-wikilink' ),
        } ),
    );
    this.buttons.copyWikiHelper = new Button( {
        node: this.buttons.copyWiki.$button.get( 0 ),
        handler: this.actionCopyWikilink.bind( this ),
    } );
    items.push( this.buttons.copyWiki );

    // Link to the revision or to the edit
    this.buttons.pageType = new OoUi.ButtonWidget(
        $.extend( true, {}, buttonParams, {
            label: utils.msg( `goto-${ this.options.type }` ),
            href: utils.getTypeHref( this.options.type, this.page ),
            target: utils.getTarget( true ),
        } ),
    );
    items.push( this.buttons.pageType );

    if ( !utils.isEmpty( this.page.title ) ) {
        // Link to the page
        this.buttons.page = new OoUi.ButtonWidget(
            $.extend( true, {}, buttonParams, {
                label: utils.msg( 'goto-page' ),
                href: this.page.href,
                target: utils.getTarget( true ),
            } ),
        );
        items.push( this.buttons.page );

        // Link to the history
        this.buttons.history = new OoUi.ButtonWidget(
            $.extend( true, {}, buttonParams, {
                label: utils.msg( 'goto-history' ),
                href: mw.util.getUrl( this.page.title, { action: 'history' } ),
                target: utils.getTarget( true ),
            } ),
        );
        items.push( this.buttons.history );

        // Link to the talk page
        if ( !this.page.mwTitle.isTalkPage() ) {
            this.buttons.talkPage = new OoUi.ButtonWidget(
                $.extend( true, {}, buttonParams, {
                    label: utils.msg( 'goto-talkpage' ),
                    href: this.page.mwTitle.getTalkPage().getUrl(),
                    target: utils.getTarget( true ),
                } ),
            );
            items.push( this.buttons.talkPage );
        }
    }

    // Open Instant Diffs settings
    this.buttons.settings = new OoUi.ButtonWidget(
        $.extend( true, {}, buttonParams, {
            label: utils.msg( 'goto-settings' ),
        } ),
    );
    this.buttons.settingsHelper = new Button( {
        node: this.buttons.settings.$button.get( 0 ),
        handler: this.actionOpenSettings.bind( this ),
    } );
    items.push( this.buttons.settings );

    // Separator
    items.push( utils.renderOoUiElement( $( '<hr>' ) ) );

    // Link to the Instant Diffs docs and current running version
    this.buttons.id = this.renderIDLink( buttonParams );
    items.push( this.buttons.id );

    // Group
    return new OoUi.ButtonGroupWidget( {
        items: items,
        classes: [ 'instantDiffs-group--vertical' ],
    } );
};

Diff.prototype.renderMenuMobileGroup = function ( buttonParams ) {
    const items = [];

    // Back to the initiator diff link
    if ( this.options.initiatorDiff ) {
        this.buttons.mobileInitiatorDiff = this.renderBackLink( buttonParams );
        items.push( this.buttons.mobileInitiatorDiff );
    }

    // [FlaggedRevisions] Link to all unpatrolled changes
    if ( this.links.$pending?.length > 0 ) {
        this.buttons.mobilePending = this.renderPendingLink( buttonParams );
        items.push( this.buttons.mobilePending );
    }

    // Link that switch between revision and diff
    if ( ![ 'page', 'compare' ].includes( this.options.typeVariant ) ) {
        this.buttons.mobileWwitch = this.renderSwitchLink( buttonParams );
        items.push( this.buttons.mobileWwitch );
    }

    // Separator
    if ( items.length > 0 ) {
        items.push( utils.renderOoUiElement( $( '<hr>' ) ) );
    }

    // Group
    return new OoUi.ButtonGroupWidget( {
        items: items,
        classes: [ 'instantDiffs-group--vertical', 'instantDiffs-group--mobile' ],
    } );
};

/*** RENDER LINKS ***/

Diff.prototype.renderSnapshotPrevLink = function () {
    const link = id.local.snapshot.getPreviousLink();

    const button = new OoUi.ButtonWidget( {
        label: utils.msg( 'goto-snapshot-prev' ),
        title: utils.msg( 'goto-snapshot-prev' ),
        invisibleLabel: true,
        icon: 'doubleChevronStart',
        href: link ? link.href : null,
        target: utils.getTarget( true ),
        disabled: !link,
    } );

    if ( link ) {
        new Link( button.$button.get( 0 ), {
            behavior: 'event',
            initiatorLink: link,
        } );
    }

    return button;
};

Diff.prototype.renderSnapshotNextLink = function () {
    const link = id.local.snapshot.getNextLink();

    const button = new OoUi.ButtonWidget( {
        label: utils.msg( 'goto-snapshot-next' ),
        title: utils.msg( 'goto-snapshot-next' ),
        invisibleLabel: true,
        icon: 'doubleChevronEnd',
        href: link ? link.href : null,
        target: utils.getTarget( true ),
        disabled: !link,
    } );

    if ( link ) {
        new Link( button.$button.get( 0 ), {
            behavior: 'event',
            initiatorLink: link,
        } );
    }

    return button;
};

Diff.prototype.renderPrevLink = function () {
    const hasLink = this.links.$prev?.length > 0;

    let href = null;
    if ( this.options.type === 'revision' && utils.isValidID( this.mwConfg.wgDiffOldId ) ) {
        const page = {
            title: this.page.title,
            oldid: this.mwConfg.wgDiffOldId,
            direction: 'prev',
        };
        href = utils.getRevisionHref( page, this.pageParams );
    } else if ( hasLink ) {
        href = this.links.$prev.attr( 'href' );
    }

    const $label = utils.renderLabel( {
        short: utils.msg( 'goto-prev' ),
        long: utils.msg( `goto-prev-${ this.options.type }` ),
        iconBefore: document.dir === 'ltr' ? '←' : '→',
    } );

    const button = new OoUi.ButtonWidget( {
        label: $label,
        href: href,
        target: utils.getTarget( true ),
        disabled: !href,
    } );

    if ( href ) {
        new Link( button.$button.get( 0 ), {
            behavior: 'event',
        } );
    }

    return button;
};

Diff.prototype.renderNextLink = function () {
    const hasLink = this.links.$next?.length > 0;

    let href = null;
    if ( hasLink ) {
        if ( this.options.type === 'revision' && utils.isValidID( this.mwConfg.wgDiffNewId ) ) {
            const page = {
                title: this.page.title,
                oldid: this.mwConfg.wgDiffNewId,
                direction: 'next',
            };
            href = utils.getRevisionHref( page, this.pageParams );
        } else {
            href = this.links.$next.attr( 'href' );
        }
    }

    const $label = utils.renderLabel( {
        short: utils.msg( 'goto-next' ),
        long: utils.msg( `goto-next-${ this.options.type }` ),
        iconAfter: document.dir === 'ltr' ? '→' : '←',
    } );

    const button = new OoUi.ButtonWidget( {
        label: $label,
        href: href,
        target: utils.getTarget( true ),
        disabled: !href,
    } );

    if ( href ) {
        new Link( button.$button.get( 0 ), {
            behavior: 'event',
        } );
    }

    return button;
};

Diff.prototype.renderSwitchLink = function ( params ) {
    const type = this.options.type === 'revision' ? 'diff' : 'revision';

    params = $.extend( true, {}, {
        label: utils.msg( `goto-view-${ type }` ),
        href: utils.getTypeHref( type, this.page ),
        target: utils.getTarget( true ),
        framed: true,
        classes: [ 'instantDiffs-button--switch' ],
    }, params );

    const button = new OoUi.ButtonWidget( params );
    new Link( button.$button.get( 0 ), {
        behavior: 'event',
    } );

    return button;
};

Diff.prototype.renderPendingLink = function ( params ) {
    params = $.extend( true, {}, {
        label: utils.msg( 'goto-view-pending' ),
        href: this.links.$pending.attr( 'href' ),
        target: utils.getTarget( true ),
        framed: true,
        icon: 'info',
        invisibleLabel: false,
        classes: [ 'instantDiffs-button--pending' ],
    }, params );

    const button = new OoUi.ButtonWidget( params );
    new Link( button.$button.get( 0 ), {
        behavior: 'event',
        initiatorDiff: this,
    } );

    return button;
};

Diff.prototype.renderBackLink = function ( params ) {
    const initiator = this.options.initiatorDiff;

    params = $.extend( true, {}, {
        label: utils.msg( `goto-back-${ initiator.getType() }` ),
        href: utils.getTypeHref( initiator.getType(), initiator.getPage(), initiator.getPageParams() ),
        target: utils.getTarget( true ),
        framed: true,
        icon: 'newline',
        invisibleLabel: false,
        classes: [ 'instantDiffs-button--back' ],
    }, params );

    const button = new OoUi.ButtonWidget( params );
    new Link( button.$button.get( 0 ), {
        behavior: 'event',
    } );

    return button;
};

Diff.prototype.renderIDLink = function ( params ) {
    const label = $( `
			<span class="name">${ utils.msg( 'name' ) }</span>
			<span class="version">v.${ id.config.version }</span>
		` );

    params = $.extend( true, {}, {
        label: label,
        href: utils.getOrigin( `/wiki/${ id.config.link }` ),
        target: utils.getTarget( true ),
        framed: true,
        classes: [],
    }, params );

    params.classes.push( 'instantDiffs-button--link-id' );

    return new OoUi.ButtonWidget( params );
};

/*** LINK ACTIONS ***/

Diff.prototype.actionCopyLink = function () {
    // Hide menu dropdown
    this.buttons.menuDropdown.getPopup().toggle( false );

    const params = {
        minify: utils.defaults( 'linksFormat' ) === 'minify',
        relative: false,
    };
    const href = utils.getTypeHref( this.options.type, this.page, {}, params );

    // Copy href to the clipboard
    utils.clipboardWrite( href );
};

Diff.prototype.actionCopyWikilink = function () {
    // Hide menu dropdown
    this.buttons.menuDropdown.getPopup().toggle( false );

    const params = {
        wikilink: true,
        wikilinkPreset: utils.defaults( 'wikilinksFormat' ),
        minify: utils.defaults( 'linksFormat' ) === 'minify',
        relative: false,
    };
    const href = utils.getTypeHref( this.options.type, this.page, {}, params );

    // Copy href to the clipboard
    utils.clipboardWrite( href );
};

Diff.prototype.actionOpenSettings = function () {
    if ( id.local.settings && id.local.settings.isLoading ) return;

    const options = {
        onOpen: this.onSettingsOpen.bind( this ),
        onClose: this.onSettingsClose.bind( this ),
    };
    if ( !id.local.settings ) {
        id.local.settings = new Settings( options );
    } else {
        id.local.settings.process( options );
    }

    this.buttons.settingsHelper.pending( true );
    $.when( id.local.settings.load() ).always( () => this.buttons.settingsHelper.pending( false ) );
};

Diff.prototype.onSettingsOpen = function () {
    // Hide menu dropdown
    this.buttons.menuDropdown.getPopup().toggle( false );
};

Diff.prototype.onSettingsClose = function () {
    if ( this.options.initiatorDialog ) {
        this.options.initiatorDialog.focus();
    }
};

Diff.prototype.processLinksTaget = function () {
    if ( !utils.defaults( 'openInNewTab' ) ) return;
    const $links = this.nodes.$container.find( 'a:not(.mw-thanks-thank-link, .jquery-confirmable-element)' );
    $links.each( ( i, node ) => node.setAttribute( 'target', '_blank' ) );
};

/*** ACTIONS ***/

Diff.prototype.fire = function () {
    // Fire diff table hook
    if (
        this.options.type !== 'revision' ||
        ( this.options.type === 'revision' && utils.defaults( 'showRevisionInfo' ) )
    ) {
        const $diffTable = this.getDiffTable();
        if ( $diffTable?.length > 0 ) {
            mw.hook( 'wikipage.diff' ).fire( $diffTable );
        }
    }

    // Fire general content hook
    const $container = this.getContainer();
    if ( $container?.length > 0 ) {
        mw.hook( 'wikipage.content' ).fire( $container );
    }

    // Replace link target attributes after the hooks have fired
    this.processLinksTaget();
};

Diff.prototype.updateSize = function ( params ) {
    params = $.extend( {
        top: 0,
    }, params );
    this.nodes.$navigation.toggleClass( 'is-sticky', params.top > 0 );
};

Diff.prototype.getType = function () {
    return this.options.type;
};

Diff.prototype.getTypeVariant = function () {
    return this.options.typeVariant;
};

Diff.prototype.getPage = function () {
    return this.page;
};

Diff.prototype.getPageTitleText = function () {
    if ( this.error ) return utils.msg( 'title-not-found' );
    if ( utils.isEmpty( this.page.title ) ) return utils.msg( 'title-empty' );
    return this.page.titleText;
};

Diff.prototype.getPageParams = function () {
    return this.pageParams;
};

Diff.prototype.getContainer = function () {
    return this.nodes.$container;
};

Diff.prototype.getDiffTable = function () {
    return this.nodes.$table;
};

Diff.prototype.detach = function () {
    mw.hook( `${ id.config.prefix }.diff.beforeDetach` ).fire( this );
    this.nodes.$container.detach();
};

export default Diff;