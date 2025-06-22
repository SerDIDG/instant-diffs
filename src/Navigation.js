import id from './id';
import * as utils from './utils';

import Button from './Button';
import Link from './Link';
import Settings from './Settings';

import './styles/navigation.less';

const { h, hf, ht } = utils;

/**
 * Class representing a diff navigation bar.
 */
class Navigation {
    /**
     * @type {import('./Diff').default}
     */
    diff;

    /**
     * @type {object}
     */
    page = {};

    /**
     * @type {object}
     */
    pageParams = {};

    /**
     * @type {object}
     */
    options = {};

    /**
     * @type {object}
     */
    nodes = {};

    /**
     * @type {object}
     */
    buttons = {};

    /**
     * Create a diff navigation bar instance.
     * @param {import('./Diff').default} diff a Diff instance
     * @param {object} page
     * @param {object} pageParams
     * @param {object} [options] configuration options
     */
    constructor( diff, page, pageParams, options ) {
        this.diff = diff;

        this.page = { ...page };

        this.pageParams = { ...pageParams };

        this.options = {
            links: [],
            ...options,
        };

        this.render();
    }

    /**
     * Render a navigation bar structure.
     */
    render() {
        // Render structure
        this.nodes.$container = $( '<div>' )
            .addClass( 'instantDiffs-navigation' );

        this.nodes.$left = $( '<div>' )
            .addClass( [ 'instantDiffs-navigation-group', 'instantDiffs-navigation-group--left' ] )
            .appendTo( this.nodes.$container );

        this.nodes.$center = $( '<div>' )
            .addClass( [ 'instantDiffs-navigation-group', 'instantDiffs-navigation-group--center' ] )
            .appendTo( this.nodes.$container );

        this.nodes.$right = $( '<div>' )
            .addClass( [ 'instantDiffs-navigation-group', 'instantDiffs-navigation-group--right' ] )
            .appendTo( this.nodes.$container );

        // Render panels
        this.renderSnapshotLinks();
        this.renderNavigationLinks();
        this.renderMenuLinks();
    }

    /******* NAVIGATION *******/

    /**
     * Render a snapshot buttons group that navigate between links on the page.
     */
    renderSnapshotLinks() {
        const items = [];

        // Previous link on the page
        this.buttons.shapshotPrev = this.renderSnapshotPrevLink();
        items.push( this.buttons.shapshotPrev );

        // Next link on the page
        this.buttons.snapshotNext = this.renderSnapshotNextLink();
        items.push( this.buttons.snapshotNext );

        // Render group
        this.buttons.snapshotGroup = new OO.ui.ButtonGroupWidget( { items } );
        this.nodes.$left.append( this.buttons.snapshotGroup.$element );
    }

    /**
     * Render a main navigation group that navigate between diffs or revisions.
     */
    renderNavigationLinks() {
        const items = [];

        const buttonOptions = {
            icon: null,
        };

        // Link to the previous diff
        this.buttons.prev = this.renderPrevLink();
        items.push( this.buttons.prev );

        // Link that switch between revision and diff
        if ( ![ 'page' ].includes( this.page.typeVariant ) ) {
            this.buttons.switch = this.renderSwitchLink( buttonOptions );
            items.push( this.buttons.switch );
        }

        // Link to the next diff
        this.buttons.next = this.renderNextLink();
        items.push( this.buttons.next );

        // Render group
        this.buttons.navigationGroup = new OO.ui.ButtonGroupWidget( { items } );
        this.nodes.$center.append( this.buttons.navigationGroup.$element );
    }

    /**
     * Render a context buttons group.
     */
    renderMenuLinks() {
        const items = [];

        const buttonOptions = {
            invisibleLabel: true,
        };

        // Back to the initiator diff link
        if ( this.diff.getInitiatorDiff() ) {
            this.buttons.initiatorDiff = this.renderBackLink( buttonOptions );
            items.push( this.buttons.initiatorDiff );
        }

        // [FlaggedRevisions] Link to all unpatrolled changes
        if ( this.options.links.$pending?.length > 0 ) {
            this.buttons.pending = this.renderPendingLink( buttonOptions );
            items.push( this.buttons.pending );
        }

        // Render dropdown button
        this.buttons.menuDropdown = this.renderMenuDropdown();
        items.push( this.buttons.menuDropdown );

        // Render group
        this.buttons.menuGroup = new OO.ui.ButtonGroupWidget( { items } );
        this.nodes.$right.append( this.buttons.menuGroup.$element );
    }

    /******* MENU *******/

    /**
     * Render a menu dropdown.
     * @returns {OO.ui.PopupButtonWidget} a OO.ui.PopupButtonWidget instance
     */
    renderMenuDropdown() {
        const buttonOptions = {
            framed: false,
            classes: [ 'instantDiffs-button--link' ],
        };
        if ( !utils.defaults( 'showMenuIcons' ) ) {
            buttonOptions.icon = null;
        }

        // Render menu groups
        this.buttons.menuMobile = this.renderMenuMobileGroup( buttonOptions );
        this.buttons.menuGroup = this.renderMenuGroup( buttonOptions );

        const groupsElements = [
            this.buttons.menuMobile.$element.get( 0 ),
            this.buttons.menuGroup.$element.get( 0 ),
        ];

        // Dropdown menu
        return new OO.ui.PopupButtonWidget( {
            icon: 'menu',
            label: utils.msg( 'goto-links' ),
            title: utils.msg( 'goto-links' ),
            invisibleLabel: true,
            popup: {
                $content: $( groupsElements ),
                classes: [
                    'instantDiffs-buttons-popup',
                    utils.defaults( 'showMenuIcons' ) ? 'has-icons' : null,
                ],
                width: 'auto',
                padded: false,
                anchor: false,
                align: 'backwards',
            },
        } );
    }

    /**
     * Render a main dropdown context buttons group.
     * @param {object} [buttonOptions] button configuration options
     * @returns {OO.ui.ButtonGroupWidget} a OO.ui.ButtonGroupWidget instance
     */
    renderMenuGroup( buttonOptions ) {
        const items = [];

        // Copy a link to the clipboard
        this.buttons.copy = new OO.ui.ButtonWidget( {
            label: utils.msg( 'copy-link' ),
            icon: 'link',
            ...buttonOptions,
        } );
        this.buttons.copyHelper = new Button( {
            node: this.buttons.copy.$button.get( 0 ),
            handler: this.actionCopyLink.bind( this ),
        } );
        items.push( this.buttons.copy );

        // Copy a wikilink to the clipboard
        this.buttons.copyWiki = new OO.ui.ButtonWidget( {
            label: utils.msg( 'copy-wikilink' ),
            icon: 'wikiText',
            ...buttonOptions,
        } );
        this.buttons.copyWikiHelper = new Button( {
            node: this.buttons.copyWiki.$button.get( 0 ),
            handler: this.actionCopyWikilink.bind( this ),
        } );
        items.push( this.buttons.copyWiki );

        // Link to the revision or to the edit
        this.buttons.type = this.renderTypeLink( buttonOptions );
        items.push( this.buttons.type );

        // Page-specific links
        if ( !utils.isEmpty( this.page.title ) ) {
            // Link to the page
            this.buttons.page = this.renderPageLink( buttonOptions );
            items.push( this.buttons.page );

            // Link to the talk page
            this.buttons.talkPage = this.renderTalkPageLink( buttonOptions );
            items.push( this.buttons.talkPage );

            // Link to the history
            this.buttons.history = this.renderHistoryLink( buttonOptions );
            items.push( this.buttons.history );
        }

        // Open Instant Diffs settings
        this.buttons.settings = new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-settings' ),
            icon: 'settings',
            ...buttonOptions,
        } );
        this.buttons.settingsHelper = new Button( {
            node: this.buttons.settings.$button.get( 0 ),
            handler: this.actionOpenSettings.bind( this ),
        } );
        items.push( this.buttons.settings );

        // Separator
        items.push( utils.renderOoUiElement( $( '<hr>' ) ) );

        // Link to the Instant Diffs docs and current running version
        this.buttons.id = this.renderIDLink( buttonOptions );
        items.push( this.buttons.id );

        // Render group
        return new OO.ui.ButtonGroupWidget( {
            items,
            classes: [
                'instantDiffs-buttons-group--vertical',
                utils.defaults( 'showMenuIcons' ) ? 'has-icons' : null,
            ],
        } );
    };

    /**
     * Render a mobile specific dropdown context buttons group.
     * @param {object} [buttonOptions] button configuration options
     * @returns {OO.ui.ButtonGroupWidget} a OO.ui.ButtonGroupWidget instance
     */
    renderMenuMobileGroup( buttonOptions ) {
        const items = [];

        // Back to the initiator diff link
        if ( this.diff.getInitiatorDiff() ) {
            this.buttons.mobileInitiatorDiff = this.renderBackLink( buttonOptions );
            items.push( this.buttons.mobileInitiatorDiff );
        }

        // [FlaggedRevisions] Link to all unpatrolled changes
        if ( this.options.links.$pending?.length > 0 ) {
            this.buttons.mobilePending = this.renderPendingLink( buttonOptions );
            items.push( this.buttons.mobilePending );
        }

        // Link that switch between revision and diff
        if ( ![ 'page', 'compare' ].includes( this.page.typeVariant ) ) {
            this.buttons.mobileWwitch = this.renderSwitchLink( buttonOptions );
            items.push( this.buttons.mobileWwitch );
        }

        // Separator
        if ( items.length > 0 ) {
            items.push( utils.renderOoUiElement( $( '<hr>' ) ) );
        }

        // Render group
        return new OO.ui.ButtonGroupWidget( {
            items: items,
            classes: [
                'instantDiffs-buttons-group--vertical',
                'instantDiffs-buttons-group--mobile',
                utils.defaults( 'showMenuIcons' ) ? 'has-icons' : null,
            ],
        } );
    };

    /******* LINKS *******/

    /**
     * Render a snapshot button that navigates to the previous link on the page.
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderSnapshotPrevLink() {
        const link = id.local.snapshot.getPreviousLink();

        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-snapshot-prev' ),
            title: utils.msg( 'goto-snapshot-prev' ),
            href: link ? link.href : null,
            target: utils.getTarget( true ),
            invisibleLabel: true,
            icon: 'doubleChevronStart',
            disabled: !link,
        } );

        if ( link ) {
            new Link( button.$button.get( 0 ), {
                behavior: 'event',
                initiatorLink: link,
            } );
        }

        return button;
    }

    /**
     * Render a snapshot button that navigates to the next link on the page.
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderSnapshotNextLink() {
        const link = id.local.snapshot.getNextLink();

        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-snapshot-next' ),
            title: utils.msg( 'goto-snapshot-next' ),
            href: link ? link.href : null,
            target: utils.getTarget( true ),
            invisibleLabel: true,
            icon: 'doubleChevronEnd',
            disabled: !link,
        } );

        if ( link ) {
            new Link( button.$button.get( 0 ), {
                behavior: 'event',
                initiatorLink: link,
            } );
        }

        return button;
    }

    /**
     * Render a button that navigates to the previous diff or revision.
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderPrevLink() {
        const link = this.options.links.$prev;
        const diffOldId = mw.config.get( 'wgDiffOldId' );

        // For a revision, add the ability to navigate to the very first revision of the page.
        // For a diff, we show a comparison between two revisions,
        // so there will be no link to navigate to a comparison between nothing and revision.
        let href = null;
        if ( this.page.type === 'revision' && utils.isValidID( diffOldId ) ) {
            const page = {
                type: 'revision',
                title: this.page.title,
                oldid: diffOldId,
                direction: 'prev',
            };
            href = utils.getTypeHref( page, this.pageParams );
        } else if ( link?.length > 0 ) {
            href = link.attr( 'href' );
        }

        const label = utils.renderLabel( {
            short: utils.msg( 'goto-prev' ),
            long: utils.msg( `goto-prev-${ this.page.type }` ),
            iconBefore: document.dir === 'ltr' ? '←' : '→',
        } );

        const button = new OO.ui.ButtonWidget( {
            label: $( label ),
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
    }

    /**
     * Render a button that navigates to the next diff or revision.
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderNextLink() {
        const link = this.options.links.$next;
        const diffNewId = mw.config.get( 'wgDiffNewId' );

        let href = null;
        if ( link?.length > 0 ) {
            if ( this.page.type === 'revision' && utils.isValidID( diffNewId ) ) {
                const page = {
                    type: 'revision',
                    title: this.page.title,
                    oldid: diffNewId,
                    direction: 'next',
                };
                href = utils.getTypeHref( page, this.pageParams );
            } else {
                href = link.attr( 'href' );
            }
        }

        const label = utils.renderLabel( {
            short: utils.msg( 'goto-next' ),
            long: utils.msg( `goto-next-${ this.page.type }` ),
            iconAfter: document.dir === 'ltr' ? '→' : '←',
        } );

        const button = new OO.ui.ButtonWidget( {
            label: $( label ),
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
    }

    /**
     * Render a button that switches view between diff or revision.
     * @param {object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderSwitchLink( options ) {
        const page = { ...this.page };
        page.type = page.type === 'diff' ? 'revision' : 'diff';

        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( `goto-view-${ page.type }` ),
            href: utils.getTypeHref( page ),
            target: utils.getTarget( true ),
            icon: 'specialPages',
            classes: [ 'instantDiffs-button--switch' ],
            ...options,
        } );

        new Link( button.$button.get( 0 ), {
            behavior: 'event',
        } );

        return button;
    }

    /**
     * Render a button that switches to the diff between the last patrolled revision and the current unpatrolled one.
     * The button appears only if the FlaggedRevs extension is installed and the page has unpatrolled edits.
     * @param {object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderPendingLink( options ) {
        const link = this.options.links.$pending;

        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-view-pending' ),
            href: link.attr( 'href' ),
            target: utils.getTarget( true ),
            icon: 'info',
            classes: [ 'instantDiffs-button--pending' ],
            ...options,
        } );

        new Link( button.$button.get( 0 ), {
            behavior: 'event',
            initiatorDiff: this.diff,
        } );

        return button;
    }

    /**
     * Render a button that navigates to the previous view.
     * @param {object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderBackLink( options ) {
        const initiator = this.diff.getInitiatorDiff();
        const page = initiator.getPage();

        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( `goto-back-${ page.type }` ),
            href: utils.getTypeHref( page, initiator.getPageParams() ),
            target: utils.getTarget( true ),
            icon: 'newline',
            classes: [ 'instantDiffs-button--back' ],
            ...options,
        } );

        new Link( button.$button.get( 0 ), {
            behavior: 'event',
        } );

        return button;
    }

    /**
     * Render a button that navigates to the diff or to the revision.
     * @param {object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderTypeLink( options ) {
        return new OO.ui.ButtonWidget( {
            label: utils.msg( `goto-${ this.page.type }` ),
            href: utils.getTypeHref( this.page ),
            target: utils.getTarget( true ),
            icon: 'articleRedirect',
            ...options,
        } );
    }

    /**
     * Render a button that navigates to the page.
     * @param {object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderPageLink( options ) {
        const href = this.page.mwTitle.isTalkPage()
            ? this.page.mwTitle.getSubjectPage().getUrl()
            : this.page.href;

        const iconSet = {
            2: 'userAvatar',
            3: 'userAvatar',
            default: 'article',
        };

        return new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-page' ),
            href: href,
            target: utils.getTarget( true ),
            icon: iconSet[ this.page.mwTitle.getNamespaceId() ] || iconSet.default,
            ...options,
        } );
    }

    /**
     * Render a button that navigates to the talk page.
     * @param {object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderTalkPageLink( options ) {
        const href = this.page.mwTitle.isTalkPage()
            ? this.page.href
            : this.page.mwTitle.getTalkPage().getUrl();

        const iconSet = {
            2: 'userTalk',
            3: 'userTalk',
            default: 'speechBubbles',
        };

        return new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-talkpage' ),
            href: href,
            target: utils.getTarget( true ),
            icon: iconSet[ this.page.mwTitle.getNamespaceId() ] || iconSet.default,
            ...options,
        } );
    }

    /**
     * Render a button that navigates to the page history.
     * @param {object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderHistoryLink( options ) {
        return new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-history' ),
            href: mw.util.getUrl( this.page.title, { action: 'history' } ),
            target: utils.getTarget( true ),
            icon: 'history',
            ...options,
        } );
    }

    /**
     * Render a button that shows a current version of the Instant Diffs and navigates to the homepage.
     * @param {object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderIDLink( options ) {
        const label = hf(
            h( 'span.name', utils.msg( 'script-name' ) ),
            ht( ' ' ),
            h( 'span.version', `v.${ id.config.version }` ),
        );

        options = {
            label: $( label ),
            href: utils.getOrigin( `/wiki/${ id.config.link }` ),
            target: utils.getTarget( true ),
            classes: [],
            ...options,
        };

        options.classes.push( 'instantDiffs-button--link-id' );

        return new OO.ui.ButtonWidget( options );
    }

    /******* LINK ACTIONS *******/

    /**
     * Action that copies a link to the edit or revision to the clipboard.
     */
    actionCopyLink() {
        // Hide menu dropdown
        this.toggleMenuDropdown( false );

        const options = {
            relative: false,
            minify: utils.defaults( 'linksFormat' ) === 'minify',
        };
        const href = utils.getTypeHref( this.page, {}, options );

        // Copy href to the clipboard
        utils.clipboardWrite( href );
    }

    /**
     * Action that copies a formatted wikilink to the edit or revision to the clipboard.
     */
    actionCopyWikilink() {
        // Hide menu dropdown
        this.toggleMenuDropdown( false );

        const options = {
            relative: false,
            minify: utils.defaults( 'linksFormat' ) === 'minify',
            wikilink: true,
            wikilinkPreset: utils.defaults( 'wikilinksFormat' ),
        };
        const href = utils.getTypeHref( this.page, {}, options );

        // Copy href to the clipboard
        utils.clipboardWrite( href );
    }

    /**
     * Action that opens the Settings Dialog.
     */
    actionOpenSettings() {
        const options = {
            onOpen: this.onSettingsOpen.bind( this ),
            onClose: this.onSettingsClose.bind( this ),
        };

        const dialog = Settings.getInstance( options );
        if ( !dialog ) return;

        this.buttons.settingsHelper.pending( true );
        $.when( dialog.load() )
            .always( () => this.buttons.settingsHelper.pending( false ) );
    }

    /**
     * Event that emits after the Settings Dialog opens.
     */
    onSettingsOpen() {
        // Hide menu dropdown
        this.toggleMenuDropdown( false );
    }

    /**
     * Event that emits after the Settings Dialog closes.
     */
    onSettingsClose() {
        this.diff.focus();
    }

    /******* ACTIONS *******/

    /**
     * Toggle a menu dropdown visibility.
     * @param {boolean} value
     */
    toggleMenuDropdown( value ) {
        this.buttons.menuDropdown.getPopup().toggle( value );
    }

    /**
     * Append a navigation bar to the specified node.
     * @param {Element} container
     * @param {string} [insertMethod]
     */
    embed( container, insertMethod ) {
        utils.embed( this.nodes.$container, container, insertMethod );
    }

    /**
     * Redraw a navigation bar and toggle sticky state depending on top position.
     * @param {object} [params]
     * @param {number} [params.top] scrollTop position of the container
     */
    redraw( params ) {
        params = {
            top: 0,
            ...params,
        };
        this.nodes.$container.toggleClass( 'is-sticky', params.top > 0 );
    }

    /**
     * Detach a navigation bar from the DOM.
     */
    detach() {
        // Hide menu dropdown
        this.toggleMenuDropdown( false );

        this.nodes.$container.detach();
    }
}

export default Navigation;