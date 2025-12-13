import id from './id';
import * as utils from './utils';
import { isEditableContentModel } from './utils-api';
import { getWikilink, getHref } from './utils-article';
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
	 * @type {Record<string, HTMLElement>}
	 */
	nodes = {};

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
	 * @param {import('./Page').default} page - A Page instance
	 * @param {import('./Article').default} article - An Article instance
	 * @param {Object} [articleParams] - Article parameters
	 * @param {Object} [options] - Configuration options
	 * @param {string[]} [options.initiatorAction] - An action name
	 * @param {Object} [options.links] - A link nodes object
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

		// Lazy-import modules
		this.MenuButton = require( './MenuButton' ).default;

		// Setup hotkey events
		view.connect( this, { hotkey: 'onHotkey' } );

		// Render content
		this.render();
	}

	/**
	 * Render a navigation bar structure.
	 */
	render() {
		// Render view
		this.nodes.container = h( 'div', { class: [ 'instantDiffs-navigation' ] },
			this.nodes.left = h( 'div', { class: [ 'instantDiffs-navigation-group', 'instantDiffs-navigation-group--left' ] } ),
			this.nodes.center = h( 'div', { class: [ 'instantDiffs-navigation-group', 'instantDiffs-navigation-group--center' ] } ),
			this.nodes.right = h( 'div', { class: [ 'instantDiffs-navigation-group', 'instantDiffs-navigation-group--right' ] } ),
		);

		// Render menus
		this.renderMenu();
		this.renderSnapshotLinks();
		this.renderNavigationLinks();
		this.renderShortcutsLinks();

		// Fire hook on complete
		mw.hook( `${ id.config.prefix }.navigation.complete` ).fire( this );
	}

	/******* NAVIGATION *******/

	/**
	 * Map of the main menu groups.
	 * @type {{left: [string], center: [string], right: string[]}}
	 */
	groupsMap = {
		left: [ 'snapshot' ],
		center: [ 'navigation' ],
		right: [ 'shortcuts-custom', 'shortcuts' ],
	};

	/**
	 * @type {string[]}
	 */
	groups = [];

	/**
	 * Map of the actions menu groups.
	 * @type {string[]}
	 */
	actionGroupsMap = [ 'mobile', 'menu-custom', 'menu', 'footer' ];

	/**
	 * @type {string[]}
	 */
	actionGroups = [];

	/**
	 * Render the menu and its button groups.
	 * @private
	 */
	renderMenu() {
		// Render menu
		this.menu = new Menu( this.article );

		// Render main menu groups
		for ( const [ group, names ] of Object.entries( this.groupsMap ) ) {
			names.forEach( name => {
				this.groups.push( name );
				this.menu.renderGroup( {
					name,
					group,
					type: 'horizontal',
					container: this.nodes[ group ],
				} );
			} );
		}

		// Render actions menu groups
		this.actionGroupsMap.forEach( name => {
			this.actionGroups.push( name );
			this.menu.renderGroup( {
				name,
				group: 'actions',
				type: 'vertical',
			} );
		} );
	}

	/**
	 * Render a snapshot buttons group that navigate between links on the page.
	 * @private
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
	 * @private
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

		// Link that switches between revision and diff
		if ( ![ 'page' ].includes( this.article.get( 'typeVariant' ) ) ) {
			this.renderSwitchLink( { ...options, ...mobileOptions } );
		}

		// Link to the next diff
		this.renderNextLink( options );
	}

	/**
	 * Render a context buttons group.
	 * @private
	 */
	renderShortcutsLinks() {
		// Render button link groups
		this.renderMenuLinks();
		this.renderMenuFooterLinks();

		// Render actions menu
		this.renderMenuActions();
	}

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

			// Link to the page information
			this.renderInfoLink( options );

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
	 * Render an action menu dropdown.
	 * @private
	 */
	renderMenuActions() {
		const groups = utils.arrayIntersperse(
			this.menu.getGroupsElements( 'actions' ),
			h( 'hr.instantDiffs-buttons-separator' ),
		);

		const widget = new OO.ui.PopupButtonWidget( {
			icon: 'menu',
			label: utils.msg( 'goto-actions' ),
			title: utils.msgHint( 'goto-actions', 'actions', settings.get( 'enableHotkeys' ) ),
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
			widget,
		} );
	}

	/******* LINKS *******/

	/**
	 * Render a snapshot button that navigates to the previous link on the article.
	 * @private
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
	 */
	renderSnapshotPrevLink( options ) {
		const link = Snapshot.instance.getPreviousLink();

		options = {
			name: 'snapshotPrev',
			label: utils.msg( 'goto-snapshot-prev' ),
			title: utils.msgHint( 'goto-snapshot-prev', 'snapshot-prev', settings.get( 'enableHotkeys' ) ),
			icon: 'doubleChevronStart',
			href: link ? link.href : null,
			disabled: !link,
			setLink: !!link,
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
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
	 */
	renderSnapshotNextLink( options ) {
		const link = Snapshot.instance.getNextLink();

		options = {
			name: 'snapshotNext',
			label: utils.msg( 'goto-snapshot-next' ),
			title: utils.msgHint( 'goto-snapshot-next', 'snapshot-next', settings.get( 'enableHotkeys' ) ),
			icon: 'doubleChevronEnd',
			href: link ? link.href : null,
			disabled: !link,
			setLink: !!link,
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
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
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
			disabled: !href,
			setLink: !!href,
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
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
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
			disabled: !href,
			setLink: !!href,
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
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
	 */
	renderSwitchLink( options ) {
		const type = this.article.get( 'type' ) === 'diff' ? 'revision' : 'diff';
		const articleOptions = { type };

		options = {
			name: 'switch',
			label: utils.msg( `goto-view-${ type }` ),
			title: utils.msgHint( `goto-view-${ type }`, 'switch', settings.get( 'enableHotkeys' ) ),
			icon: 'specialPages',
			href: getHref( this.article, {}, articleOptions ),
			classes: [ 'instantDiffs-button--switch' ],
			setLink: true,
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
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
	 */
	renderUnpatrolledLink( options ) {
		options = {
			name: 'unpatrolled',
			label: utils.msg( 'goto-view-unpatrolled' ),
			title: utils.msgHint( 'goto-view-unpatrolled', 'unpatrolled', settings.get( 'enableHotkeys' ) ),
			icon: 'info',
			href: this.options.links.unpatrolled,
			classes: [ 'instantDiffs-button--pending' ],
			setLink: true,
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
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
	 */
	renderBackLink( options ) {
		const initiator = this.page.getInitiatorPage();
		const article = initiator.getArticle();

		options = {
			name: 'back',
			label: utils.msg( `goto-back-${ article.get( 'type' ) }` ),
			title: utils.msgHint( `goto-back-${ article.get( 'type' ) }`, 'back', settings.get( 'enableHotkeys' ) ),
			icon: 'newline',
			href: getHref( article, initiator.getArticleParams() ),
			classes: [ 'instantDiffs-button--back' ],
			setLink: true,
			linkOptions: {
				onRequest: () => {
					const initiatorAction = initiator.getNavigation()?.getActionRegister();
					const action = !utils.isEmpty( initiatorAction )
						? `${ options.name }-${ initiatorAction }` : options.name;
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
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
	 */
	renderCopyLink( options ) {
		this.menu.renderButton( {
			name: 'copyLink',
			label: utils.msg( 'copy-link' ),
			icon: 'link',
			handler: this.actionCopyLink.bind( this ),
			...options,
		} );
	}

	/**
	 * Render a button that copies wikilink to the clipboard.
	 * @private
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
	 */
	renderCopyWikiLink( options ) {
		this.menu.renderButton( {
			name: 'copyWikiLink',
			label: utils.msg( 'copy-wikilink' ),
			icon: 'wikiText',
			handler: this.actionCopyWikilink.bind( this ),
			...options,
		} );
	}

	/**
	 * Render a button that navigates to the diff or to the revision.
	 * @private
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
	 */
	renderTypeLink( options ) {
		this.menu.renderButton( {
			name: 'link',
			label: utils.msg( `goto-${ this.article.get( 'type' ) }` ),
			icon: 'articleRedirect',
			href: getHref( this.article ),
			...options,
		} );
	}

	/**
	 * Render a button that navigates to the article.
	 * @private
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
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
			icon: iconSet[ this.article.getMW( 'title' ).getNamespaceId() ] || iconSet.default,
			href: href,
			...options,
		} );
	}

	/**
	 * Render a button that navigates to the talk article.
	 * @private
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
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
			name: 'talkPage',
			label: utils.msg( 'goto-talkpage' ),
			icon: iconSet[ this.article.getMW( 'title' ).getNamespaceId() ] || iconSet.default,
			href: href,
			...options,
		} );
	}

	/**
	 * Render a button that navigates to the page edit.
	 * @private
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
	 */
	renderEditLink( options ) {
		const isEditable = mw.config.get( 'wgIsProbablyEditable' );
		const href = mw.util.getUrl( this.article.get( 'title' ), { action: 'edit' } );

		this.menu.renderButton( {
			name: 'edit',
			label: utils.msg( isEditable ? 'goto-edit' : 'goto-source' ),
			icon: isEditable ? 'edit' : 'editLock',
			href: href,
			...options,
		} );
	}

	/**
	 * Render a button that navigates to the page history.
	 * @private
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
	 */
	renderHistoryLink( options ) {
		const href = mw.util.getUrl( this.article.get( 'title' ), { action: 'history' } );

		this.menu.renderButton( {
			name: 'history',
			label: utils.msg( 'goto-history' ),
			icon: 'history',
			href: href,
			...options,
		} );
	}

	/**
	 * Render a button that navigates to the page information.
	 * @private
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
	 */
	renderInfoLink( options ) {
		const href = mw.util.getUrl( this.article.get( 'title' ), { action: 'info' } );

		this.menu.renderButton( {
			name: 'info',
			label: utils.msg( 'goto-info' ),
			icon: 'info',
			href: href,
			...options,
		} );
	}

	/**
	 * Render a button that adds / removes a page from the watchlist.
	 * @private
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
	 */
	renderWatchLink( options ) {
		this.menu.renderButton( {
			name: 'watch',
			label: utils.msg( 'action-watch' ),
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
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
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
	 * @param {Menu.ButtonOptions} [options] - Button configuration options
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
			icon: null,
			href: utils.origin( `/wiki/${ id.config.link }` ),
			classes: [ 'instantDiffs-button--link-id' ],
			...options,
		} );
	}

	/******* LINK ACTIONS *******/

	/**
	 * Action that copies a link to the edit or revision to the clipboard.
	 * @private
	 * @param {import('./MenuButton').default} widget
	 */
	actionCopyLink( widget ) {
		const options = {
			relative: false,
			minify: settings.get( 'linksFormat' ) === 'minify',
		};
		const href = getHref( this.article, {}, options );

		// Copy href to the clipboard
		utils.clipboardWrite( href );

		// Focus the action button
		this.focusAction( widget );
	}

	/**
	 * Action that copies a formatted wikilink to the edit or revision to the clipboard.
	 * @private
	 * @param {import('./MenuButton').default} widget
	 */
	actionCopyWikilink( widget ) {
		this.menu.eachButtonWidget( 'copyWikiLink', null, widget => {
			widget.pending( true );
		} );

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
				this.menu.eachButtonWidget( 'copyWikiLink', null, widget => {
					widget.pending( false );
				} );

				// Focus the action button
				this.focusAction( widget );
			} );
	}

	/**
	 * Action that adds / removes a page from the watchlist.
	 * @private
	 * @param {import('./MenuButton').default} widget
	 */
	actionWatchPage( widget ) {
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

		this.menu.eachButtonWidget( 'watch', null, widget => {
			widget.pending( true );
		} );

		$.when( this.watch.request() )
			.always( () => {
				this.menu.eachButtonWidget( 'watch', null, widget => {
					widget.pending( false );
				} );

				// Focus the action button
				this.focusAction( widget );
			} );
	}

	/**
	 * Action that opens the Settings dialog.
	 * @private
	 * @param {import('./MenuButton').default} widget
	 */
	actionOpenSettings( widget ) {
		settings.once( 'opening', () => this.toggleActions( false ) );
		settings.once( 'closed', () => this.focusAction( widget ) );

		this.menu.eachButtonWidget( 'settings', null, widget => {
			widget.pending( true );
		} );

		$.when( settings.load() )
			.always( () => {
				this.menu.eachButtonWidget( 'settings', null, widget => {
					widget.pending( false );
				} );
			} );
	}

	/******* BUTTONS ACTIONS *******/

	/**
	 * Map of action names to their counterpart actions.
	 * @type {Record<string, string>}
	 */
	actionCounterparts = {
		'unpatrolled': 'back',
		'back-unpatrolled': 'unpatrolled',
	};

	/**
	 * Map of disabled action names to their alternative actions.
	 * @type {Record<string, string>}
	 */
	disabledActionCounterparts = {
		'next': 'prev',
		'prev': 'next',
		'snapshotNext': 'snapshotPrev',
		'snapshotPrev': 'snapshotNext',
	};

	/**
	 * Set focus on the specified button.
	 * If the button is disabled, attempts to focus its counterpart instead.
	 * @param {import('./MenuButton').default|string} widgetOrName - Button widget or action name
	 * @returns {boolean} True if a button was successfully focused
	 */
	focusAction( widgetOrName ) {
		// Hide actions menu
		this.toggleActions( false );

		// Handle MenuButton instance
		if ( widgetOrName instanceof this.MenuButton ) {
			return this.focusActionByWidget( widgetOrName );
		}

		// Handle string action name
		if ( utils.isString( widgetOrName ) ) {
			return this.focusActionByName( widgetOrName );
		}

		return false;
	}

	/**
	 * Focus a button by action widget
	 * @private
	 * @param {import('./MenuButton').default} widget - Button widget
	 * @returns {boolean} True if a button was successfully focused
	 */
	focusActionByWidget( widget ) {
		if ( widget.isDisabled() ) return false;

		// If the widget is in main groups, focus it directly
		const group = widget.getOption( 'group' );
		if ( this.groups.includes( group ) ) {
			widget.focus();
			return true;
		}

		// Otherwise, try to focus 'actions' as fallback
		return this.focusActionByName( 'actions' );
	}

	/**
	 * Focus a button by action name, with fallback to disabled counterpart
	 * @private
	 * @param {string} name - Action name to focus
	 * @returns {boolean} True if a button was successfully focused
	 */
	focusActionByName( name ) {
		// Apply action counterpart transformation
		name = this.actionCounterparts[ name ] || name;

		// Try to focus on the primary action
		const focused = this.menu.focusButton( name, this.groups );
		if ( focused ) return true;

		// If the primary action was disabled, try the counterpart
		name = this.disabledActionCounterparts[ name ];
		if ( !name ) return false;

		return this.menu.focusButton( name, this.groups );
	}

	/**
	 * Set focus and click the specified button if not disabled.
	 * @param {string} name - An action button name
	 */
	clickAction( name ) {
		// FixMe: find a way to make the popup hide automatically when the button loses focus
		if ( name !== 'actions' ) {
			this.toggleActions( false );
		}

		this.menu.eachButtonWidget( name, this.groups, widget => {
			if ( !widget.isDisabled() ) {
				widget.focus();
				widget.execHandler();
				return true;
			}
		} );
	}

	/**
	 * Toggle the actions menu dropdown visibility.
	 * @param {boolean} value
	 */
	toggleActions( value ) {
		this.menu.eachButtonWidget( 'actions', this.groups, widget => {
			widget.getPopup().toggle( value );
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

	/******* CUSTOM ACTIONS *******/

	/**
	 * Render a custom action button.
	 * @param {Menu.ButtonOptions} options - Button configuration options
	 */
	addCustomAction( options ) {
		// Validate options.
		// Note that the custom action-specific options must override some user options.
		options = {
			...options,
			canShortcut: true,
			shortcutGroup: 'shortcuts-custom',
			canMenu: true,
			menuGroup: 'menu-custom',
		};

		// Validate name
		if ( utils.isEmpty( options.name ) ) return;
		options.name = `custom-${ options.name }`;

		// Render menu button
		this.menu.renderButton( options );
	}

	/**
	 * Get a custom action button.
	 * @param {string} name - An action button name
	 * @returns {*}
	 */
	getCustomAction( name ) {
		if ( utils.isEmpty( name ) ) return;
		name = `custom-${ name }`;

		return this.menu.getButton( name, [ 'shortcuts-custom', 'menu-custom' ] );
	}

	/**
	 * Get a custom action button widget.
	 * @param {string} name - An action button name
	 * @returns {*}
	 */
	getCustomActionWidget( name ) {
		const action = this.getCustomAction( name );
		if ( !action ) return;

		return action.map( entry => entry.widget );
	}

	/**
	 * Execute a handler on each custom action button.
	 * @param {string} name - An action button name
	 * @param {Function} handler - An action handler
	 */
	eachCustomAction( name, handler ) {
		const action = this.getCustomAction( name );
		if ( !action ) return;

		action.forEach( entry => handler( entry ) );
	}

	/**
	 * Execute a handler on each custom action button widget.
	 * @param {string} name - An action name
	 * @param {Function} handler - An action handler
	 */
	eachCustomActionWidget( name, handler ) {
		const action = this.getCustomActionWidget( name );
		if ( !action ) return;

		action.forEach( entry => handler( entry ) );
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
				ArrowLeft: 'snapshotPrev',
				ArrowRight: 'snapshotNext',
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

		// Define an RTL-specific actions map
		if ( document.dir === 'rtl' ) {
			actionMaps.ctrl.ArrowRight = 'snapshotPrev';
			actionMaps.ctrl.ArrowLeft = 'snapshotNext';
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
			this.clickAction( action );
		}
	}

	/******* ACTIONS *******/

	/**
	 * Get the Article instance.
	 * @returns {import('./Article').default}
	 */
	getArticle() {
		return this.article;
	}

	/**
	 * Get the Menu instance.
	 * @returns {import('./Menu').default}
	 */
	getMenu() {
		return this.menu;
	}

	/**
	 * Fire hooks and events.
	 */
	fire() {
		this.focusAction( this.options.initiatorAction );
	}

	/**
	 * Append a navigation bar to the specified node.
	 * @param {Element} container
	 * @param {string} [insertMethod]
	 */
	embed( container, insertMethod ) {
		utils.embed( this.nodes.container, container, insertMethod );
	}

	/**
	 * Detach a navigation bar from the DOM.
	 */
	detach() {
		// Hide menu dropdown
		this.toggleActions( false );

		// Disconnect hotkey events
		view.disconnect( this, { hotkey: 'onHotkey' } );

		this.nodes.container.remove();
		this.isDetached = true;
	}
}

export default Navigation;