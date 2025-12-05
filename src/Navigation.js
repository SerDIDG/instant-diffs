import id from './id';
import * as utils from './utils';
import { isEditableContentModel } from './utils-api';
import { getWikilink, getHref, getHrefAbsolute } from './utils-article';
import { updateWatchButtonStatus } from './utils-watch';

import Article from './Article';
import Snapshot from './Snapshot';
import Watch from './Watch';
import Menu from './Menu';
import view from './view';
import settings from './settings';

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
	 * @type {Array}
	 */
	groups = [];

	/**
	 * @type {string}
	 */
	actionRegister;

	/**
	 * @type {import('./Watch').default}
	 */
	watch;

	/**
	 * @type {import('./Menu').default}
	 */
	menu;

	/**
	 * @type {typeof import('./MenuButton').default}
	 */
	MenuButton;

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

		// Lazy-import modules
		this.MenuButton = require( './MenuButton' ).default;

		// Render content
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

		// Render menus
		this.renderMenu();
		this.renderSnapshotLinks();
		this.renderNavigationLinks();
		this.renderShortcutsLinks();
	}

	/******* NAVIGATION *******/

	renderMenu() {
		// Render menu
		this.menu = new Menu();

		// Render groups
		this.menu.renderGroup( {
			name: 'snapshot',
			group: 'left',
			type: 'horizontal',
			$container: this.nodes.$left,
		} );
		this.menu.renderGroup( {
			name: 'navigation',
			group: 'center',
			type: 'horizontal',
			$container: this.nodes.$center,
		} );
		this.menu.renderGroup( {
			name: 'shortcuts',
			group: 'right',
			type: 'horizontal',
			$container: this.nodes.$right,
		} );
		this.groups = [ 'snapshot', 'navigation', 'shortcuts' ];

		this.menu.renderGroup( {
			name: 'mobile',
			group: 'dropdown',
		} );
		this.menu.renderGroup( {
			name: 'custom',
			group: 'dropdown',
		} );
		this.menu.renderGroup( {
			name: 'menu',
			group: 'dropdown',
		} );
		this.menu.renderGroup( {
			name: 'footer',
			group: 'dropdown',
		} );
	}

	/**
	 * Render a snapshot buttons group that navigate between links on the article.
	 */
	renderSnapshotLinks() {
		const options = {
			canShortcut: true,
			shortcutGroup: 'snapshot',
			canMenu: false,
		};

		const mobileOptions = {
			canMenu: true,
			menuGroup: 'mobile',
		};

		// Previous link on the page
		this.renderSnapshotPrevLink( options );

		// Next link on the page
		this.renderSnapshotNextLink( options );

		// Back to the initiator page link
		if ( this.page.getInitiatorPage() ) {
			this.renderBackLink( { ...options, ...mobileOptions } );
		}

		// [FlaggedRevisions] Link to all unpatrolled changes
		if ( !utils.isEmpty( this.options.links.unpatrolled ) ) {
			this.renderUnpatrolledLink( { ...options, ...mobileOptions } );
		}
	}

	/**
	 * Render a main navigation group that navigate between diffs or revisions.
	 */
	renderNavigationLinks() {
		const options = {
			canShortcut: true,
			shortcutType: 'navigation',
			shortcutGroup: 'navigation',
			canMenu: false,
		};

		const mobileOptions = {
			canMenu: true,
			menuGroup: 'mobile',
		};

		// Link to the previous diff
		this.renderPrevLink( options );

		// Link that switch between revision and diff
		if ( ![ 'page' ].includes( this.article.get( 'typeVariant' ) ) ) {
			this.renderSwitchLink( { ...options, ...mobileOptions } );
		}

		// Link to the next diff
		this.renderNextLink( options );
	}

	/**
	 * Render a context buttons group.
	 */
	renderShortcutsLinks() {
		// Render button link groups
		this.renderMenuCustomLinks();
		this.renderMenuLinks();
		this.renderMenuFooterLinks();

		// Render actions menu
		this.renderMenuDropdown();
	}

	/**
	 * Render the custom context links.
	 * @private
	 */
	renderMenuCustomLinks() {
		const options = {
			canShortcut: true,
			shortcutGroup: 'shortcuts',
			canMenu: true,
			menuGroup: 'custom',
		};
	};

	/**
	 * Render the main context links.
	 * @private
	 */
	renderMenuLinks() {
		const options = {
			canShortcut: true,
			shortcutGroup: 'shortcuts',
			canMenu: true,
			menuGroup: 'menu',
		};

		// Copy a link to the clipboard action
		this.renderCopyLink( options );

		// Copy a wikilink to the clipboard action
		this.renderCopyWikiLink( options );

		// Link to the revision or to the edit
		this.renderTypeLink( options );

		// Page-specific links
		if ( !utils.isEmpty( this.article.get( 'title' ) ) ) {
			// Link to the page
			this.renderPageLink( options );

			// Link to the talk page
			if ( this.article.getMW( 'title' ).canHaveTalkPage() ) {
				this.renderTalkPageLink( options );
			}

			// Link to the edit / view source
			if ( isEditableContentModel( mw.config.get( 'wgPageContentModel' ) ) ) {
				this.renderEditLink( options );
			}

			// Link to the history
			this.renderHistoryLink( options );

			// Watch / unwatch star action
			if ( !id.local.mwIsAnon ) {
				this.renderWatchLink( options );
			}
		}

		// Open Instant Diffs settings
		this.renderSettingsLink( options );
	};

	/**
	 * Render the footer context links.
	 * @private
	 */
	renderMenuFooterLinks() {
		const options = {
			canShortcut: false,
			canMenu: true,
			menuGroup: 'footer',
		};

		// Link to the Instant Diffs docs and current running version
		this.renderIDLink( options );
	}

	/**
	 * Render a menu dropdown.
	 * @private
	 */
	renderMenuDropdown() {
		const groups = utils.arrayIntersperse(
			this.menu.getGroupsElements( 'dropdown' ),
			h( 'hr.instantDiffs-buttons-separator' ),
		);

		const button = new OO.ui.PopupButtonWidget( {
			icon: 'menu',
			label: utils.msg( 'goto-menu' ),
			title: utils.msgHint( 'goto-menu', 'menu', settings.get( 'enableHotkeys' ) ),
			invisibleLabel: true,
			popup: {
				$content: $( groups ),
				classes: [
					'instantDiffs-buttons-popup',
					settings.get( 'showMenuIcons' ) ? 'has-icons' : null,
				],
				width: 'auto',
				padded: false,
				anchor: false,
				align: 'backwards',
				autoClose: true,
			},
		} );

		this.menu.registerButton( {
			name: 'actions',
			group: 'shortcuts',
			type: 'shortcut',
			widget: button,
		} );
	}

	/******* LINKS *******/

	/**
	 * Render a snapshot button that navigates to the previous link on the article.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderSnapshotPrevLink( options ) {
		const link = Snapshot.instance.getPreviousLink();

		options = {
			name: 'snapshot-prev',
			label: utils.msg( 'goto-snapshot-prev' ),
			title: utils.msgHint( 'goto-snapshot-prev', 'snapshot-prev', settings.get( 'enableHotkeys' ) ),
			href: link ? link.href : null,
			target: utils.getTarget( true ),
			invisibleLabel: true,
			icon: 'doubleChevronStart',
			disabled: !link,
			link: !!link,
			linkOptions: {
				initiatorLink: link,
				onRequest: () => this.setActionRegister( options.name ),
			},
			...options,
		};

		this.menu.renderButton( options );
	}

	/**
	 * Render a snapshot button that navigates to the next link on the article.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderSnapshotNextLink( options ) {
		const link = Snapshot.instance.getNextLink();

		options = {
			name: 'snapshot-next',
			label: utils.msg( 'goto-snapshot-next' ),
			title: utils.msgHint( 'goto-snapshot-next', 'snapshot-next', settings.get( 'enableHotkeys' ) ),
			href: link ? link.href : null,
			target: utils.getTarget( true ),
			invisibleLabel: true,
			icon: 'doubleChevronEnd',
			disabled: !link,
			link: !!link,
			linkOptions: {
				initiatorLink: link,
				onRequest: () => this.setActionRegister( options.name ),
			},
			...options,
		};

		this.menu.renderButton( options );
	}

	/**
	 * Render a button that navigates to the previous diff or revision.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderPrevLink( options ) {
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

		options = {
			name: 'prev',
			label: $( label ),
			title: utils.msgHint( `goto-prev-${ this.article.get( 'type' ) }`, 'prev', settings.get( 'enableHotkeys' ) ),
			href: href,
			target: utils.getTarget( true ),
			disabled: !href,
			link: !!href,
			linkOptions: {
				onRequest: () => this.setActionRegister( options.name ),
			},
			...options,
		};

		this.menu.renderButton( options );
	}

	/**
	 * Render a button that navigates to the next diff or revision.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderNextLink( options ) {
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

		options = {
			name: 'next',
			label: $( label ),
			title: utils.msgHint( `goto-next-${ this.article.get( 'type' ) }`, 'next', settings.get( 'enableHotkeys' ) ),
			href: href,
			target: utils.getTarget( true ),
			disabled: !href,
			link: !!href,
			linkOptions: {
				onRequest: () => this.setActionRegister( options.name ),
			},
			...options,
		};

		this.menu.renderButton( options );
	}

	/**
	 * Render a button that switches the view between diff or revision.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderSwitchLink( options ) {
		const type = this.article.get( 'type' ) === 'diff' ? 'revision' : 'diff';
		const articleOptions = { type };

		options = {
			name: 'switch',
			label: utils.msg( `goto-view-${ type }` ),
			title: utils.msgHint( `goto-view-${ type }`, 'switch', settings.get( 'enableHotkeys' ) ),
			href: getHref( this.article, {}, articleOptions ),
			target: utils.getTarget( true ),
			icon: 'specialPages',
			classes: [ 'instantDiffs-button--switch' ],
			link: true,
			linkOptions: {
				onRequest: () => this.setActionRegister( options.name ),
			},
			...options,
		};

		this.menu.renderButton( options );
	}

	/**
	 * Render a button that switches to the diff between the last patrolled revision and the current unpatrolled one.
	 * The button appears only if the FlaggedRevs extension is installed and the page has unpatrolled edits.
	 * @private
	 * @param {Object} [options] button configuration options
	 * @returns {import('./MenuButton').default} a MenuButton instance
	 */
	renderUnpatrolledLink( options ) {
		options = {
			name: 'unpatrolled',
			label: utils.msg( 'goto-view-unpatrolled' ),
			title: utils.msgHint( 'goto-view-unpatrolled', 'unpatrolled', settings.get( 'enableHotkeys' ) ),
			href: this.options.links.unpatrolled,
			target: utils.getTarget( true ),
			icon: 'info',
			classes: [ 'instantDiffs-button--pending' ],
			link: true,
			linkOptions: {
				initiatorPage: this.page,
				onRequest: () => this.setActionRegister( options.name ),
			},
			...options,
		};

		this.menu.renderButton( options );
	}

	/**
	 * Render a button that navigates to the previous view.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderBackLink( options ) {
		const initiator = this.page.getInitiatorPage();
		const article = initiator.getArticle();

		options = {
			name: 'back',
			label: utils.msg( `goto-back-${ article.get( 'type' ) }` ),
			title: utils.msgHint( `goto-back-${ article.get( 'type' ) }`, 'back', settings.get( 'enableHotkeys' ) ),
			href: getHref( article, initiator.getArticleParams() ),
			target: utils.getTarget( true ),
			icon: 'newline',
			classes: [ 'instantDiffs-button--back' ],
			link: true,
			linkOptions: {
				onRequest: () => {
					const initiatorAction = initiator.getNavigation()?.getActionRegister();
					const action = !utils.isEmpty( initiatorAction )
						? `${ initiatorAction }-${ options.name }` : options.name;
					this.setActionRegister( action );
				},
			},
			...options,
		};

		this.menu.renderButton( options );
	}

	/**
	 * Render a button that copies a link to the clipboard.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderCopyLink( options ) {
		this.menu.renderButton( {
			name: 'copy-link',
			label: utils.msg( 'copy-link' ),
			icon: 'link',
			handler: this.actionCopyLink.bind( this ),
			...options,
		} );
	}

	/**
	 * Render a button that copies wikilink to the clipboard.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderCopyWikiLink( options ) {
		this.menu.renderButton( {
			name: 'copy-wikilink',
			label: utils.msg( 'copy-wikilink' ),
			icon: 'wikiText',
			handler: this.actionCopyWikilink.bind( this ),
			...options,
		} );
	}

	/**
	 * Render a button that navigates to the diff or to the revision.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderTypeLink( options ) {
		this.menu.renderButton( {
			name: 'link',
			label: utils.msg( `goto-${ this.article.get( 'type' ) }` ),
			href: getHref( this.article ),
			target: utils.getTarget( true ),
			icon: 'articleRedirect',
			...options,
		} );
	}

	/**
	 * Render a button that navigates to the article.
	 * @private
	 * @param {Object} [options] button configuration options
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

		this.menu.renderButton( {
			name: 'page',
			label: utils.msg( 'goto-page' ),
			href: getHrefAbsolute( this.article, href ),
			target: utils.getTarget( true ),
			icon: iconSet[ this.article.getMW( 'title' ).getNamespaceId() ] || iconSet.default,
			...options,
		} );
	}

	/**
	 * Render a button that navigates to the talk article.
	 * @private
	 * @param {Object} [options] button configuration options
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

		this.menu.renderButton( {
			name: 'talkpage',
			label: utils.msg( 'goto-talkpage' ),
			href: getHrefAbsolute( this.article, href ),
			target: utils.getTarget( true ),
			icon: iconSet[ this.article.getMW( 'title' ).getNamespaceId() ] || iconSet.default,
			...options,
		} );
	}

	/**
	 * Render a button that navigates to the page edit.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderEditLink( options ) {
		const isEditable = mw.config.get( 'wgIsProbablyEditable' );
		const href = mw.util.getUrl( this.article.get( 'title' ), { action: 'edit' } );

		this.menu.renderButton( {
			name: 'edit',
			label: utils.msg( isEditable ? 'goto-edit' : 'goto-source' ),
			href: getHrefAbsolute( this.article, href ),
			target: utils.getTarget( true ),
			icon: isEditable ? 'edit' : 'editLock',
			...options,
		} );
	}

	/**
	 * Render a button that navigates to the page history.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderHistoryLink( options ) {
		const href = mw.util.getUrl( this.article.get( 'title' ), { action: 'history' } );

		this.menu.renderButton( {
			name: 'history',
			label: utils.msg( 'goto-history' ),
			href: getHrefAbsolute( this.article, href ),
			target: utils.getTarget( true ),
			icon: 'history',
			...options,
		} );
	}

	/**
	 * Render a button that adds / removes a page from the watchlist.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderWatchLink( options ) {
		this.menu.renderButton( {
			name: 'watch',
			handler: this.actionWatchPage.bind( this ),
			...options,
		} );

		// Post-process each button instance statuses
		this.menu.eachButtonWidget( 'watch', null, widget => {
			updateWatchButtonStatus( this.article, widget );
		} );
	}

	/**
	 * Render a button that opens the settings dialog.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderSettingsLink( options ) {
		this.menu.renderButton( {
			name: 'settings',
			label: utils.msg( 'goto-settings' ),
			icon: 'settings',
			handler: this.actionOpenSettings.bind( this ),
			...options,
		} );
	}

	/**
	 * Render a button that shows a current version of the Instant Diffs and navigates to the homepage.
	 * @private
	 * @param {Object} [options] button configuration options
	 */
	renderIDLink( options ) {
		const label = hf(
			h( 'span.name', utils.msg( 'script-name' ) ),
			ht( ' ' ),
			h( 'span.version', `v.${ id.config.version }` ),
		);

		this.menu.renderButton( {
			name: 'id',
			label: $( label ),
			href: utils.origin( `/wiki/${ id.config.link }` ),
			target: utils.getTarget( true ),
			classes: [ 'instantDiffs-button--link-id' ],
			...options,
		} );
	}

	/******* LINK ACTIONS *******/

	/**
	 * Action that copies a link to the edit or revision to the clipboard.
	 */
	actionCopyLink() {
		const options = {
			relative: false,
			minify: settings.get( 'linksFormat' ) === 'minify',
		};
		const href = getHref( this.article, {}, options );

		// Copy href to the clipboard
		utils.clipboardWrite( href );

		// Hide menu dropdown
		this.toggleMenu( false );
		this.focusButton( 'actions' );
	}

	/**
	 * Action that copies a formatted wikilink to the edit or revision to the clipboard.
	 */
	actionCopyWikilink() {
		this.menu.eachButtonWidget( 'copy-wikilink', null, widget => widget.pending( true ) );

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
				this.menu.eachButtonWidget( 'copy-wikilink', null, widget => widget.pending( false ) );

				// Hide menu dropdown
				this.toggleMenu( false );
				this.focusButton( 'actions' );
			} );
	}

	/**
	 * Action that adds / removes a page from the watchlist.
	 */
	actionWatchPage() {
		if ( !this.watch ) {
			this.watch = new Watch( this.article, {
				onUpdate: state => {
					this.menu.eachButtonWidget( 'watch', null, widget => {
						widget.pending( state === 'loading' );
						updateWatchButtonStatus( this.article, widget );
					} );
				},
			} );
		}

		this.menu.eachButtonWidget( 'watch', null, widget => widget.pending( true ) );

		$.when( this.watch.request() )
			.always( () => {
				this.menu.eachButtonWidget( 'watch', null, widget => widget.pending( false ) );

				// Hide menu dropdown
				this.toggleMenu( false );
				this.focusButton( 'actions' );
			} );
	}

	/**
	 * Action that opens the Settings dialog.
	 */
	actionOpenSettings() {
		settings.once( 'opening', () => this.toggleMenu( false ) );
		settings.once( 'closed', () => this.focusButton( 'actions' ) );

		this.menu.eachButtonWidget( 'settings', null, widget => widget.pending( true ) );

		$.when( settings.load() )
			.always( () => {
				this.menu.eachButtonWidget( 'settings', null, widget => widget.pending( false ) );
			} );
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
	 * @private
	 */
	onHotkey( event ) {
		if ( !settings.get( 'enableHotkeys' ) ) return;

		const isCtrlPressed = event.ctrlKey;
		const isShiftPressed = event.shiftKey;
		const isAltPressed = event.altKey;

		// Define actions map
		const actionMaps = {
			ctrl: {
				ArrowLeft: 'snapshot-prev',
				ArrowRight: 'snapshot-next',
				ArrowUp: 'switch',
				ArrowDown: 'actions',
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

		// Define RTL-specific actions map
		if ( document.dir === 'rtl' ) {
			actionMaps.ctrl.ArrowRight = 'snapshot-prev';
			actionMaps.ctrl.ArrowLeft = 'snapshot-next';
			actionMaps.none.ArrowRight = 'prev';
			actionMaps.none.ArrowLeft = 'next';
		}

		// Get action
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

	/******* BUTTON ACTIONS *******/

	/**
	 * Set focus on the specified button.
	 * Performs transform to the opposite button for the disabled buttons and for the view switching buttons.
	 * @param {string} name an action button name
	 */
	focusButton( name ) {
		const unpatrolledActions = {
			'unpatrolled': 'back',
			'unpatrolled-back': 'unpatrolled',
		};
		const disabledActions = {
			'next': 'prev',
			'prev': 'next',
			'snapshot-next': 'snapshot-prev',
			'snapshot-prev': 'snapshot-next',
		};
		name = unpatrolledActions[ name ] || name;

		this.menu.eachButtonWidget( name, this.groups, widget => {
			if ( widget.isDisabled() ) {
				name = disabledActions[ name ];
				this.menu.eachButtonWidget( name, this.groups, widget => widget.focus() );
			} else {
				widget.focus();
			}
		} );
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

		this.menu.eachButtonWidget( name, this.groups, widget => {
			if ( widget.isDisabled() ) return;

			widget.focus();
			widget.$button.get( 0 ).click();
		} );
	}

	/******* ACTIONS *******/

	/**
	 * Toggle a menu dropdown visibility.
	 * @param {boolean} value
	 */
	toggleMenu( value ) {
		this.menu.eachButtonWidget( 'actions', this.groups, widget => {
			widget.getPopup().toggle( value );
		} );
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