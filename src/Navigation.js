import $ from 'jquery';
import mw from 'mediawiki';
import OoUi from 'oojs-ui';

import id from './id';
import * as utils from './utils';

import Button from './Button';
import Link from './Link';
import Settings from './Settings';

import './styles/navigation.less';

/**
 * Class representing a diff navigation bar.
 */
class Navigation {
    diff;
    page = {};
    pageParams = {};
    options = {};
    nodes = {};
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

        this.page = {
            ...page,
        };

        this.pageParams = {
            ...pageParams,
        };

        this.options = {
            type: null,
            typeVariant: null,
            initiatorDiff: null,
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

    /*** NAVIGATION ***/

    renderSnapshotLinks() {
        const items = [];

        if ( id.local.snapshot.getLength() > 1 ) {
            // Previous link on the page
            this.buttons.shapshotPrev = this.renderSnapshotPrevLink();
            items.push( this.buttons.shapshotPrev );

            // Next link on the page
            this.buttons.snapshotNext = this.renderSnapshotNextLink();
            items.push( this.buttons.snapshotNext );
        }

        // Render group
        this.buttons.snapshotGroup = new OoUi.ButtonGroupWidget( { items } );
        this.nodes.$left.append( this.buttons.snapshotGroup.$element );
    }

    renderNavigationLinks() {
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
        this.buttons.navigationGroup = new OoUi.ButtonGroupWidget( { items } );
        this.nodes.$center.append( this.buttons.navigationGroup.$element );
    }

    /*** MENU ***/

    renderMenuLinks() {
        const items = [];

        // Icon button parameters
        const iconParams = {
            invisibleLabel: true,
        };

        // Back to the initiator diff link
        if ( this.options.initiatorDiff ) {
            this.buttons.initiatorDiff = this.renderBackLink( iconParams );
            items.push( this.buttons.initiatorDiff );
        }

        // [FlaggedRevisions] Link to all unpatrolled changes
        if ( this.options.links.$pending?.length > 0 ) {
            this.buttons.pending = this.renderPendingLink( iconParams );
            items.push( this.buttons.pending );
        }

        // Menu button parameters
        const buttonParams = {
            framed: false,
            classes: [ 'instantDiffs-button--link' ],
        };
        if ( !utils.defaults( 'showMenuIcons' ) ) {
            buttonParams.icon = null;
        }

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
                classes: [ 'instantDiffs-buttons-popup' ],
                width: 'auto',
                padded: false,
                anchor: false,
                align: 'backwards',
            },
        } );
        items.push( this.buttons.menuDropdown );

        // Render group
        this.buttons.menuGroup = new OoUi.ButtonGroupWidget( { items } );
        this.nodes.$right.append( this.buttons.menuGroup.$element );
    }

    renderMenuGroup( buttonParams ) {
        const items = [];

        // Copy a link to the clipboard
        this.buttons.copy = new OoUi.ButtonWidget( {
            label: utils.msg( 'copy-link' ),
            icon: 'link',
            ...buttonParams,
        } );
        this.buttons.copyHelper = new Button( {
            node: this.buttons.copy.$button.get( 0 ),
            handler: this.actionCopyLink.bind( this ),
        } );
        items.push( this.buttons.copy );

        // Copy a wikilink to the clipboard
        this.buttons.copyWiki = new OoUi.ButtonWidget( {
            label: utils.msg( 'copy-wikilink' ),
            icon: 'wikiText',
            ...buttonParams,
        } );
        this.buttons.copyWikiHelper = new Button( {
            node: this.buttons.copyWiki.$button.get( 0 ),
            handler: this.actionCopyWikilink.bind( this ),
        } );
        items.push( this.buttons.copyWiki );

        // Link to the revision or to the edit
        this.buttons.pageType = new OoUi.ButtonWidget( {
            label: utils.msg( `goto-${ this.options.type }` ),
            icon: 'articleRedirect',
            href: utils.getTypeHref( this.options.type, this.page ),
            target: utils.getTarget( true ),
            ...buttonParams,
        } );
        items.push( this.buttons.pageType );

        if ( !utils.isEmpty( this.page.title ) ) {
            // Link to the page
            this.buttons.page = new OoUi.ButtonWidget( {
                label: utils.msg( 'goto-page' ),
                icon: 'article',
                href: this.page.href,
                target: utils.getTarget( true ),
                ...buttonParams,
            } );
            items.push( this.buttons.page );

            // Link to the history
            this.buttons.history = new OoUi.ButtonWidget( {
                label: utils.msg( 'goto-history' ),
                icon: 'history',
                href: mw.util.getUrl( this.page.title, { action: 'history' } ),
                target: utils.getTarget( true ),
                ...buttonParams,
            } );
            items.push( this.buttons.history );

            // Link to the talk page
            if ( !this.page.mwTitle.isTalkPage() ) {
                this.buttons.talkPage = new OoUi.ButtonWidget( {
                    label: utils.msg( 'goto-talkpage' ),
                    icon: 'speechBubbles',
                    href: this.page.mwTitle.getTalkPage().getUrl(),
                    target: utils.getTarget( true ),
                    ...buttonParams,
                } );
                items.push( this.buttons.talkPage );
            }
        }

        // Open Instant Diffs settings
        this.buttons.settings = new OoUi.ButtonWidget( {
            label: utils.msg( 'goto-settings' ),
            icon: 'settings',
            ...buttonParams,
        } );
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
        return new OoUi.ButtonGroupWidget( { items, classes: [ 'instantDiffs-buttons-group--vertical' ] } );
    };

    renderMenuMobileGroup( buttonParams ) {
        const items = [];

        // Back to the initiator diff link
        if ( this.options.initiatorDiff ) {
            this.buttons.mobileInitiatorDiff = this.renderBackLink( buttonParams );
            items.push( this.buttons.mobileInitiatorDiff );
        }

        // [FlaggedRevisions] Link to all unpatrolled changes
        if ( this.options.links.$pending?.length > 0 ) {
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
            classes: [ 'instantDiffs-buttons-group--vertical', 'instantDiffs-buttons-group--mobile' ],
        } );
    };

    /*** LINKS ***/

    renderSnapshotPrevLink() {
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
    }

    renderSnapshotNextLink() {
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
    }

    renderPrevLink() {
        const link = this.options.links.$prev;
        const diffOldId = mw.config.get( 'wgDiffOldId' );

        // For a revision, add the ability to navigate to the very first revision of the page.
        // For a diff, we show a comparison between two revisions,
        // so there will be no link to navigate to a comparison between nothing and revision.
        let href = null;
        if ( this.options.type === 'revision' && utils.isValidID( diffOldId ) ) {
            const page = {
                title: this.page.title,
                oldid: diffOldId,
                direction: 'prev',
            };
            href = utils.getRevisionHref( page, this.pageParams );
        } else if ( link?.length > 0 ) {
            href = link.attr( 'href' );
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
    }

    renderNextLink() {
        const link = this.options.links.$next;
        const diffNewId = mw.config.get( 'wgDiffNewId' );

        let href = null;
        if ( link?.length > 0 ) {
            if ( this.options.type === 'revision' && utils.isValidID( diffNewId ) ) {
                const page = {
                    title: this.page.title,
                    oldid: diffNewId,
                    direction: 'next',
                };
                href = utils.getRevisionHref( page, this.pageParams );
            } else {
                href = link.attr( 'href' );
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
    }

    renderSwitchLink( params ) {
        const type = this.options.type === 'revision' ? 'diff' : 'revision';

        const button = new OoUi.ButtonWidget( {
            label: utils.msg( `goto-view-${ type }` ),
            href: utils.getTypeHref( type, this.page ),
            target: utils.getTarget( true ),
            framed: true,
            classes: [ 'instantDiffs-button--switch' ],
            ...params,
        } );

        new Link( button.$button.get( 0 ), {
            behavior: 'event',
        } );

        return button;
    }

    renderPendingLink( params ) {
        const link = this.options.links.$pending;

        const button = new OoUi.ButtonWidget( {
            label: utils.msg( 'goto-view-pending' ),
            href: link.attr( 'href' ),
            target: utils.getTarget( true ),
            framed: true,
            icon: 'info',
            invisibleLabel: false,
            classes: [ 'instantDiffs-button--pending' ],
            ...params,
        } );

        new Link( button.$button.get( 0 ), {
            behavior: 'event',
            initiatorDiff: this.diff,
        } );

        return button;
    }

    renderBackLink( params ) {
        const initiator = this.options.initiatorDiff;

        const button = new OoUi.ButtonWidget( {
            label: utils.msg( `goto-back-${ initiator.getType() }` ),
            href: utils.getTypeHref( initiator.getType(), initiator.getPage(), initiator.getPageParams() ),
            target: utils.getTarget( true ),
            framed: true,
            icon: 'newline',
            invisibleLabel: false,
            classes: [ 'instantDiffs-button--back' ],
            ...params,
        } );

        new Link( button.$button.get( 0 ), {
            behavior: 'event',
        } );

        return button;
    }

    renderIDLink( params ) {
        const label = $( `
			<span class="name">${ utils.msg( 'name' ) }</span>
			<span class="version">v.${ id.config.version }</span>
		` );

        params = {
            label: label,
            href: utils.getOrigin( `/wiki/${ id.config.link }` ),
            target: utils.getTarget( true ),
            framed: true,
            classes: [],
            ...params,
        };

        params.classes.push( 'instantDiffs-button--link-id' );

        return new OoUi.ButtonWidget( params );
    }

    /*** LINK ACTIONS ***/

    actionCopyLink() {
        // Hide menu dropdown
        this.toggleMenuDropdown( false );

        const params = {
            minify: utils.defaults( 'linksFormat' ) === 'minify',
            relative: false,
        };
        const href = utils.getTypeHref( this.options.type, this.page, {}, params );

        // Copy href to the clipboard
        utils.clipboardWrite( href );
    }

    actionCopyWikilink() {
        // Hide menu dropdown
        this.toggleMenuDropdown( false );

        const params = {
            wikilink: true,
            wikilinkPreset: utils.defaults( 'wikilinksFormat' ),
            minify: utils.defaults( 'linksFormat' ) === 'minify',
            relative: false,
        };
        const href = utils.getTypeHref( this.options.type, this.page, {}, params );

        // Copy href to the clipboard
        utils.clipboardWrite( href );
    }

    actionOpenSettings() {
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
    }

    onSettingsOpen() {
        // Hide menu dropdown
        this.toggleMenuDropdown( false );
    }

    onSettingsClose() {
        this.diff.focus();
    }

    /*** ACTIONS ***/

    /**
     * Toggle a menu dropdown visibility.
     * @param {boolean} value
     */
    toggleMenuDropdown( value ) {
        this.buttons.menuDropdown.getPopup().toggle( value );
    }

    /**
     * Append a navigation bar to the specified node.
     * @param {HTMLElement} container
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
}

export default Navigation;