import id from './id';
import * as utils from './utils';
import { renderOoUiElement } from './utils-oojs';
import { getWikilink, getHref, getHrefAbsolute } from './utils-article';
import { updateWatchButtonStatus } from './utils-watch';

import Button from './Button';
import Link from './Link';
import Article from './Article';
import Snapshot from './Snapshot';
import Watch from './Watch';
import settings from './Settings';
import view from './View';

import './styles/navigation.less';

const { h, hf, ht } = utils;

/**
 * Class representing a Page navigation bar.
 */
class Navigation {
    /**
     * @type {import('./Page').default}
     */
    page;

    /**
     * @type {import('./Article').default}
     */
    article;

    /**
     * @type {Object}
     */
    articleParams = {};

    /**
     * @type {Object}
     */
    options = {};

    /**
     * @type {Object}
     */
    nodes = {};

    /**
     * @type {Object}
     */
    buttons = {};

    /**
     * @type {string}
     */
    actionRegister;

    /**
     * @type {import('./Watch').default}
     */
    watch;

    /**
     * @type {boolean}
     */
    isDetached = false;

    /**
     * Create a Page navigation bar instance.
     * @param {import('./Page').default} page a Page instance
     * @param {import('./Article').default} article an Article instance
     * @param {Object} [articleParams]
     * @param {Object} [options] configuration options
     * @param {string[]} [options.initiatorAction] an action name
     * @param {Object} [options.links] a link nodes object
     */
    constructor( page, article, articleParams, options ) {
        this.page = page;

        this.article = article;

        this.articleParams = { ...articleParams };

        this.options = {
            initiatorAction: null,
            links: {},
            ...options,
        };

        // Setup hotkey events
        view.connect( this, { hotkey: 'onHotkey' } );

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
     * Render a snapshot buttons group that navigate between links on the article.
     */
    renderSnapshotLinks() {
        const items = [];

        // Previous link on the page
        this.buttons.snapshotPrev = this.renderSnapshotPrevLink();
        items.push( this.buttons.snapshotPrev );

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
        if ( ![ 'page' ].includes( this.article.get( 'typeVariant' ) ) ) {
            this.buttons.switch = this.renderSwitchLink( { name: 'switch', ...buttonOptions } );
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

        // Back to the initiator page link
        if ( this.page.getInitiatorPage() ) {
            this.buttons.back = this.renderBackLink( { name: 'back', ...buttonOptions } );
            items.push( this.buttons.back );
        }

        // [FlaggedRevisions] Link to all unpatrolled changes
        if ( !utils.isEmpty( this.options.links.unpatrolled ) ) {
            this.buttons.unpatrolled = this.renderUnpatrolledLink( { name: 'unpatrolled', ...buttonOptions } );
            items.push( this.buttons.unpatrolled );
        }

        // Render dropdown button
        this.buttons.menu = this.renderMenu();
        items.push( this.buttons.menu );

        // Render group
        this.buttons.menuGroup = new OO.ui.ButtonGroupWidget( { items } );
        this.nodes.$right.append( this.buttons.menuGroup.$element );
    }

    /******* MENU *******/

    /**
     * Render a menu dropdown.
     * @returns {OO.ui.PopupButtonWidget} a OO.ui.PopupButtonWidget instance
     */
    renderMenu() {
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
            label: utils.msg( 'goto-menu' ),
            title: utils.msgHint( 'goto-menu', 'menu', utils.defaults( 'enableHotkeys' ) ),
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
                autoClose: true,
            },
        } );
    }

    /**
     * Render a main dropdown context buttons group.
     * @param {Object} [buttonOptions] button configuration options
     * @returns {OO.ui.ButtonGroupWidget} a OO.ui.ButtonGroupWidget instance
     */
    renderMenuGroup( buttonOptions ) {
        const items = [];

        // Copy a link to the clipboard action
        this.buttons.copy = this.renderCopyLink( buttonOptions );
        items.push( this.buttons.copy );

        // Copy a wikilink to the clipboard action
        this.buttons.copyWiki = this.renderCopyWikiLink( buttonOptions );
        items.push( this.buttons.copyWiki );

        // Link to the revision or to the edit
        this.buttons.type = this.renderTypeLink( buttonOptions );
        items.push( this.buttons.type );

        // Page-specific links
        if ( !utils.isEmpty( this.article.get( 'title' ) ) ) {
            // Link to the page
            this.buttons.page = this.renderPageLink( buttonOptions );
            items.push( this.buttons.page );

            // Link to the talk page
            if ( this.article.getMW( 'title' ).canHaveTalkPage() ) {
                this.buttons.talkPage = this.renderTalkPageLink( buttonOptions );
                items.push( this.buttons.talkPage );
            }

            // Link to the history
            this.buttons.history = this.renderHistoryLink( buttonOptions );
            items.push( this.buttons.history );

            // Watch / unwatch star action
            if ( !id.local.mwIsAnon ) {
                this.buttons.watch = this.renderWatchLink( buttonOptions );
                items.push( this.buttons.watch );
            }
        }

        // Open Instant Diffs settings
        this.buttons.settings = this.renderSettingsLink( buttonOptions );
        items.push( this.buttons.settings );

        // Separator
        items.push( renderOoUiElement( $( '<hr>' ) ) );

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
     * @param {Object} [buttonOptions] button configuration options
     * @returns {OO.ui.ButtonGroupWidget} a OO.ui.ButtonGroupWidget instance
     */
    renderMenuMobileGroup( buttonOptions ) {
        const items = [];

        // Back to the initiator page link
        if ( this.page.getInitiatorPage() ) {
            this.buttons.mobileBack = this.renderBackLink( { name: 'mobileBack', ...buttonOptions } );
            items.push( this.buttons.mobileBack );
        }

        // [FlaggedRevisions] Link to all unpatrolled changes
        if ( !utils.isEmpty( this.options.links.unpatrolled ) ) {
            this.buttons.mobileUnpatrolled = this.renderUnpatrolledLink( { name: 'mobileUnpatrolled', ...buttonOptions } );
            items.push( this.buttons.mobileUnpatrolled );
        }

        // Link that switch between revision and diff
        if ( ![ 'page' ].includes( this.article.get( 'typeVariant' ) ) ) {
            this.buttons.mobileSwitch = this.renderSwitchLink( { name: 'mobileSwitch', ...buttonOptions } );
            items.push( this.buttons.mobileSwitch );
        }

        // Separator
        if ( items.length > 0 ) {
            items.push( renderOoUiElement( $( '<hr>' ) ) );
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
     * Render a snapshot button that navigates to the previous link on the article.
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderSnapshotPrevLink() {
        const link = Snapshot.instance.getPreviousLink();

        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-snapshot-prev' ),
            title: utils.msgHint( 'goto-snapshot-prev', 'snapshot-prev', utils.defaults( 'enableHotkeys' ) ),
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
                onRequest: () => this.setActionRegister( 'snapshotPrev' ),
            } );
        }

        return button;
    }

    /**
     * Render a snapshot button that navigates to the next link on the article.
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderSnapshotNextLink() {
        const link = Snapshot.instance.getNextLink();

        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-snapshot-next' ),
            title: utils.msgHint( 'goto-snapshot-next', 'snapshot-next', utils.defaults( 'enableHotkeys' ) ),
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
                onRequest: () => this.setActionRegister( 'snapshotNext' ),
            } );
        }

        return button;
    }

    /**
     * Render a button that navigates to the previous diff or revision.
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderPrevLink() {
        let href;
        if ( this.options.links.prev ) {
            const article = new Article( {
                title: this.article.get( 'title' ),
                hostname: this.article.get( 'hostname' ),
                oldid: mw.config.get( 'wgDiffOldId' ),
                diff: this.article.get( 'type' ) === 'diff' ? 'prev' : null,
                direction: this.article.get( 'type' ) === 'revision' ? 'prev' : null,
            } );
            href = getHref( article );
        }

        const label = utils.renderLabel( {
            short: utils.msg( 'goto-prev' ),
            long: utils.msg( `goto-prev-${ this.article.get( 'type' ) }` ),
            iconBefore: document.dir === 'ltr' ? '←' : '→',
        } );

        const button = new OO.ui.ButtonWidget( {
            label: $( label ),
            title: utils.msgHint( `goto-prev-${ this.article.get( 'type' ) }`, 'prev', utils.defaults( 'enableHotkeys' ) ),
            href: href,
            target: utils.getTarget( true ),
            disabled: !href,
        } );

        if ( href ) {
            new Link( button.$button.get( 0 ), {
                behavior: 'event',
                onRequest: () => this.setActionRegister( 'prev' ),
            } );
        }

        return button;
    }

    /**
     * Render a button that navigates to the next diff or revision.
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderNextLink() {
        let href;
        if ( this.options.links.next ) {
            const article = new Article( {
                title: this.article.get( 'title' ),
                hostname: this.article.get( 'hostname' ),
                oldid: mw.config.get( 'wgDiffNewId' ),
                diff: this.article.get( 'type' ) === 'diff' ? 'next' : null,
                direction: this.article.get( 'type' ) === 'revision' ? 'next' : null,
            } );
            href = getHref( article );
        }

        const label = utils.renderLabel( {
            short: utils.msg( 'goto-next' ),
            long: utils.msg( `goto-next-${ this.article.get( 'type' ) }` ),
            iconAfter: document.dir === 'ltr' ? '→' : '←',
        } );

        const button = new OO.ui.ButtonWidget( {
            label: $( label ),
            title: utils.msgHint( `goto-next-${ this.article.get( 'type' ) }`, 'next', utils.defaults( 'enableHotkeys' ) ),
            href: href,
            target: utils.getTarget( true ),
            disabled: !href,
        } );

        if ( href ) {
            new Link( button.$button.get( 0 ), {
                behavior: 'event',
                onRequest: () => this.setActionRegister( 'next' ),
            } );
        }

        return button;
    }

    /**
     * Render a button that switches view between diff or revision.
     * @param {Object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderSwitchLink( options ) {
        const type = this.article.get( 'type' ) === 'diff' ? 'revision' : 'diff';
        const articleOptions = { type };

        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( `goto-view-${ type }` ),
            title: utils.msgHint( `goto-view-${ type }`, 'switch', utils.defaults( 'enableHotkeys' ) ),
            href: getHref( this.article, {}, articleOptions ),
            target: utils.getTarget( true ),
            icon: 'specialPages',
            classes: [ 'instantDiffs-button--switch' ],
            ...options,
        } );

        new Link( button.$button.get( 0 ), {
            behavior: 'event',
            onRequest: () => this.setActionRegister( options.name ),
        } );

        return button;
    }

    /**
     * Render a button that switches to the diff between the last patrolled revision and the current unpatrolled one.
     * The button appears only if the FlaggedRevs extension is installed and the page has unpatrolled edits.
     * @param {Object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderUnpatrolledLink( options ) {
        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-view-unpatrolled' ),
            title: utils.msgHint( 'goto-view-unpatrolled', 'unpatrolled', utils.defaults( 'enableHotkeys' ) ),
            href: this.options.links.unpatrolled,
            target: utils.getTarget( true ),
            icon: 'info',
            classes: [ 'instantDiffs-button--pending' ],
            ...options,
        } );

        new Link( button.$button.get( 0 ), {
            behavior: 'event',
            initiatorPage: this.page,
            onRequest: () => this.setActionRegister( options.name ),
        } );

        return button;
    }

    /**
     * Render a button that navigates to the previous view.
     * @param {Object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderBackLink( options ) {
        const initiator = this.page.getInitiatorPage();
        const article = initiator.getArticle();

        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( `goto-back-${ article.get( 'type' ) }` ),
            title: utils.msgHint( `goto-back-${ article.get( 'type' ) }`, 'back', utils.defaults( 'enableHotkeys' ) ),
            href: getHref( article, initiator.getArticleParams() ),
            target: utils.getTarget( true ),
            icon: 'newline',
            classes: [ 'instantDiffs-button--back' ],
            ...options,
        } );

        const initiatorAction = initiator.getNavigation()?.getActionRegister();
        const action = !utils.isEmpty( initiatorAction )
            ? `${ initiatorAction }-${ options.name }` : options.name;

        new Link( button.$button.get( 0 ), {
            behavior: 'event',
            onRequest: () => this.setActionRegister( action ),
        } );

        return button;
    }

    /**
     * Render a button that copies link to the clipboard.
     * @param {Object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderCopyLink( options ) {
        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( 'copy-link' ),
            icon: 'link',
            ...options,
        } );

        button.helper = new Button( {
            node: button.$button.get( 0 ),
            handler: this.actionCopyLink.bind( this ),
        } );

        return button;
    }

    /**
     * Render a button that copies wikilink to the clipboard.
     * @param {Object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderCopyWikiLink( options ) {
        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( 'copy-wikilink' ),
            icon: 'wikiText',
            ...options,
        } );

        button.helper = new Button( {
            node: button.$button.get( 0 ),
            handler: this.actionCopyWikilink.bind( this ),
        } );

        return button;
    }

    /**
     * Render a button that navigates to the diff or to the revision.
     * @param {Object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderTypeLink( options ) {
        return new OO.ui.ButtonWidget( {
            label: utils.msg( `goto-${ this.article.get( 'type' ) }` ),
            href: getHref( this.article ),
            target: utils.getTarget( true ),
            icon: 'articleRedirect',
            ...options,
        } );
    }

    /**
     * Render a button that navigates to the article.
     * @param {Object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderPageLink( options ) {
        const href = this.article.getMW( 'title' ).isTalkPage()
            ? this.article.getMW( 'title' ).getSubjectPage().getUrl()
            : this.article.get( 'href' );

        const iconSet = {
            2: 'userAvatar',
            3: 'userAvatar',
            default: 'article',
        };

        return new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-page' ),
            href: getHrefAbsolute( this.article, href ),
            target: utils.getTarget( true ),
            icon: iconSet[ this.article.getMW( 'title' ).getNamespaceId() ] || iconSet.default,
            ...options,
        } );
    }

    /**
     * Render a button that navigates to the talk article.
     * @param {Object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderTalkPageLink( options ) {
        const href = this.article.getMW( 'title' ).isTalkPage()
            ? this.article.get( 'href' )
            : this.article.getMW( 'title' ).getTalkPage().getUrl();

        const iconSet = {
            2: 'userTalk',
            3: 'userTalk',
            default: 'speechBubbles',
        };

        return new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-talkpage' ),
            href: getHrefAbsolute( this.article, href ),
            target: utils.getTarget( true ),
            icon: iconSet[ this.article.getMW( 'title' ).getNamespaceId() ] || iconSet.default,
            ...options,
        } );
    }

    /**
     * Render a button that navigates to the page history.
     * @param {Object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderHistoryLink( options ) {
        const href = mw.util.getUrl( this.article.get( 'title' ), { action: 'history' } );

        return new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-history' ),
            href: getHrefAbsolute( this.article, href ),
            target: utils.getTarget( true ),
            icon: 'history',
            ...options,
        } );
    }

    /**
     * Render a button that adds / removes page from the watchlist.
     * @param {Object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderWatchLink( options ) {
        const button = new OO.ui.ButtonWidget( {
            ...options,
        } );

        button.helper = new Button( {
            node: button.$button.get( 0 ),
            handler: this.actionWatchPage.bind( this ),
        } );

        updateWatchButtonStatus( this.article, button );

        return button;
    }

    /**
     * Render a button that opens settings dialog.
     * @param {Object} [options] button configuration options
     * @returns {OO.ui.ButtonWidget} a OO.ui.ButtonWidget instance
     */
    renderSettingsLink( options ) {
        const button = new OO.ui.ButtonWidget( {
            label: utils.msg( 'goto-settings' ),
            icon: 'settings',
            ...options,
        } );

        button.helper = new Button( {
            node: button.$button.get( 0 ),
            handler: this.actionOpenSettings.bind( this ),
        } );

        return button;
    }

    /**
     * Render a button that shows a current version of the Instant Diffs and navigates to the homearticle.
     * @param {Object} [options] button configuration options
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
            href: utils.origin( `/wiki/${ id.config.link }` ),
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
        const options = {
            relative: false,
            minify: utils.defaults( 'linksFormat' ) === 'minify',
        };
        const href = getHref( this.article, {}, options );

        // Copy href to the clipboard
        utils.clipboardWrite( href );

        // Hide menu dropdown
        this.toggleMenu( false );
        this.focusButton( 'menu' );
    }

    /**
     * Action that copies a formatted wikilink to the edit or revision to the clipboard.
     */
    actionCopyWikilink() {
        this.buttons.copyWiki.helper.pending( true );

        $.when( getWikilink( this.article ) )
            .done( href => {
                // Copy href to the clipboard
                utils.clipboardWrite( href );
            } )
            .fail( () => {
                // Show error message
                utils.clipboardWrite( false );
            } )
            .always( () => {
                this.buttons.copyWiki.helper.pending( false );

                // Hide menu dropdown
                this.toggleMenu( false );
                this.focusButton( 'menu' );
            } );
    }

    /**
     * Action that adds / removes page from the watchlist.
     */
    actionWatchPage() {
        if ( !this.watch ) {
            this.watch = new Watch( this.article, this.buttons.watch );
        }

        this.buttons.watch.helper.pending( true );

        $.when( this.watch.request() )
            .always( () => {
                this.buttons.watch.helper.pending( false );

                // Hide menu dropdown
                this.toggleMenu( false );
                this.focusButton( 'menu' );
            } );
    }

    /**
     * Action that opens the Settings dialog.
     */
    actionOpenSettings() {
        settings.once( 'opening', () => this.toggleMenu( false ) );
        settings.once( 'closed', () => this.focusButton( 'menu' ) );

        this.buttons.settings.helper.pending( true );

        $.when( settings.load() )
            .always( () => this.buttons.settings.helper.pending( false ) );
    }

    /**
     * Set to the register currently executed switch action, like navigation, etc.
     */
    setActionRegister( name ) {
        this.actionRegister = name;
    }

    /**
     * Get from the register previously executed switch action, like navigation, etc.
     */
    getActionRegister() {
        return this.actionRegister;
    }

    /******* HOTKEYS *******/

    /**
     * Event that emits when the View dialog fires hotkey event.
     */
    onHotkey( event ) {
        if ( !utils.defaults( 'enableHotkeys' ) ) return;

        const isCtrlPressed = event.ctrlKey;
        const isShiftPressed = event.shiftKey;
        const isAltPressed = event.altKey;

        // Get action
        const actionMaps = {
            ctrl: {
                ArrowLeft: 'snapshotPrev',
                ArrowRight: 'snapshotNext',
                ArrowUp: 'switch',
                ArrowDown: 'menu',
                KeyZ: 'back',
                KeyP: 'unpatrolled',
            },
            none: {
                ArrowLeft: 'prev',
                ArrowRight: 'next',
            },
            alt: {},
            shift: {},
        };

        const modifier = isAltPressed ? 'alt' : isCtrlPressed ? 'ctrl' : isShiftPressed ? 'shift' : 'none';
        const action = actionMaps[ modifier ]?.[ event.code ];

        if ( action ) {
            // Prevent default arrow key behavior
            event.preventDefault();
            event.stopPropagation();

            // Execute action
            this.clickButton( action );
        }
    }

    /******* ACTIONS *******/

    /**
     * Toggle a menu dropdown visibility.
     * @param {boolean} value
     */
    toggleMenu( value ) {
        this.buttons.menu.getPopup().toggle( value );
    }

    /**
     * Set focus on the specified button.
     * Performs transform to the opposite button for the disabled buttons and for the view switching buttons.
     * @param {string} name an action button name
     */
    focusButton( name ) {
        const unpatrolledActions = {
            'unpatrolled': 'back',
            'mobileUnpatrolled': 'backMobile',
            'unpatrolled-back': 'unpatrolled',
            'mobileUnpatrolled-backMobile': 'mobileUnpatrolled',
        };
        const disabledActions = {
            'next': 'prev',
            'prev': 'next',
            'snapshotNext': 'snapshotPrev',
            'snapshotPrev': 'snapshotNext',
        };
        name = unpatrolledActions[ name ] || name;

        let button = this.buttons[ name ];
        if ( button && button.isDisabled() ) {
            name = disabledActions[ name ];
            button = this.buttons[ name ];
        }

        if ( !button ) return;
        button.focus();
    }

    /**
     * Set focus and click the specified button if not disabled.
     * @param {string} name an action button name
     */
    clickButton( name ) {
        // FixMe: find a way to make the popup hide automatically when the button loses focus
        if ( name !== 'menu' ) {
            this.toggleMenu( false );
        }

        const button = this.buttons[ name ];
        if ( button && !button.isDisabled() ) {
            button.focus();
            button.$button.get( 0 ).click();
        }
    }

    /**
     * Fire hooks and events.
     */
    fire() {
        this.focusButton( this.options.initiatorAction );
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
     * Detach a navigation bar from the DOM.
     */
    detach() {
        // Hide menu dropdown
        this.toggleMenu( false );

        // Disconnect hotkey events
        view.disconnect( this, { hotkey: 'onHotkey' } );

        this.nodes.$container.detach();
        this.isDetached = true;
    }
}

export default Navigation;