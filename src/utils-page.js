import id from './id';
import * as utils from './utils';
import { getModuleExport } from './utils-oojs';
import { getHref, getHrefAbsolute } from './utils-article';
import { getDate, isRegistered, isTemporary } from './utils-user';
import { isEditableContentModel, isWbContentModel } from './utils-api';

import Api from './Api';
import Article from './Article';
import view from './view';
import settings from './settings';

const { h, hf, ht, hj } = utils;

/******* DEPENDENCIES *******/

/**
 * Gets the article dependencies.
 * @param {import('./page').Page.Any} page
 * @return {Array<string>}
 */
export function getDependencies( page ) {
	const article = page.getArticle();

	let dependencies = [];

	// Page common dependencies
	const pageDependencies = id.config.dependencies.page;
	if ( pageDependencies ) {
		dependencies = dependencies.concat(
			getNamespaceDependencies( article, pageDependencies ),
		);
	}

	// Type-specific dependencies
	const typeDependencies = id.config.dependencies[ article.get( 'type' ) ];
	if ( typeDependencies ) {
		dependencies = dependencies.concat(
			getNamespaceDependencies( article, typeDependencies ),
		);
	}

	// Skin-specific dependencies
	const skinDependencies = id.config.dependencies.skins[ mw.config.get( 'skin' ) ];
	if ( skinDependencies ) {
		dependencies = dependencies.concat(
			getNamespaceDependencies( article, skinDependencies ),
		);
	}

	// Detailed-specific dependencies
	if ( page.isDetailed ) {
		const detailedDependencies = id.config.dependencies.detailed;
		if ( detailedDependencies ) {
			dependencies = dependencies.concat(
				getNamespaceDependencies( article, detailedDependencies ),
			);
		}
	}

	// Selector-specific dependencies
	const $container = page.getBody();
	if ( $container instanceof jQuery ) {
		dependencies = dependencies.concat(
			getSelectorDependencies( article, page.getBody() ),
		);
	}

	return dependencies;
}

function getNamespaceDependencies( article, data ) {
	let dependencies = [];
	if ( utils.isEmpty( data ) ) return dependencies;
	if ( utils.isArray( data ) ) return data;

	// Set common dependencies
	if ( utils.isArray( data[ '*' ] ) ) {
		dependencies = dependencies.concat( data[ '*' ] );
	}

	// Set namespace-specific dependencies
	const namespace = article.getTitle()?.getNamespaceId();
	if ( utils.isArray( data[ namespace ] ) ) {
		dependencies = dependencies.concat( data[ namespace ] );
	}

	return dependencies;
}

function getSelectorDependencies( article, $container ) {
	let dependencies = [];
	id.config.dependencies.selectors.forEach( item => {
		const $nodes = $container.find( item.selector.join( ',' ) );
		if ( $nodes.length === 0 ) return;
		dependencies = dependencies.concat(
			getNamespaceDependencies( article, item.dependencies ),
		);
	} );
	return dependencies;
}

export function getMessageDependencies( page ) {
	const article = page.getArticle();

	let dependencies = [];

	// Local article messages
	const localDependencies = id.config.dependencies.messages;
	if ( localDependencies ) {
		dependencies = dependencies.concat(
			getNamespaceDependencies( article, localDependencies ),
		);
	}

	// Foreign article messages
	if ( article.isForeign ) {
		const foreignDependencies = id.config.foreignDependencies.messages;
		if ( foreignDependencies ) {
			dependencies = dependencies.concat(
				getNamespaceDependencies( article, foreignDependencies ),
			);
		}
	}

	return dependencies;
}

/**
 * Gets the foreign article dependencies.
 * @param {import('./page').Page.Any} page
 * @returns {Object<string, Array<string>>}
 */
export function getForeignDependencies( page ) {
	const article = page.getArticle();

	let modules = [];
	let styles = [];
	let links = [];

	const typeDependencies = id.config.foreignDependencies[ article.get( 'type' ) ];
	if ( typeDependencies ) {
		// Modules
		modules = modules.concat(
			getNamespaceDependencies( article, typeDependencies ),
		);

		// Styles only
		styles = styles.concat(
			getNamespaceDependencies( article, typeDependencies.styles ),
		);

		// Content model-specific dependencies
		if ( isWbContentModel( mw.config.get( 'wgPageContentModel' ) ) ) {
			const wikibaseDependencies = typeDependencies.wikibase;
			if ( wikibaseDependencies ) {
				// Modules
				modules = modules.concat(
					getNamespaceDependencies( article, wikibaseDependencies ),
				);

				// Styles only
				styles = styles.concat(
					wikibaseDependencies.styles.all,
					utils.isMF() ? wikibaseDependencies.styles.mobile : wikibaseDependencies.styles.desktop,
				);
			}
		}

		// Styles dependencies
		links = links.concat( getForeignStylesDependencies( article, typeDependencies.links ) );
	}

	return { modules, styles, links };
}

function getForeignStylesDependencies( article, data ) {
	let styles = [];
	if ( utils.isEmpty( data ) ) return styles;

	// Set common dependencies
	if ( utils.isArray( data[ '*' ] ) ) {
		styles = styles.concat(
			data[ '*' ].map( title => getStyleHref( article, title ) ),
		);
	}

	// Set namespace-specific dependencies
	const namespace = article.getTitle()?.getNamespaceId();
	if ( utils.isArray( data[ namespace ] ) ) {
		styles = styles.concat(
			data[ namespace ].map( title => getStyleHref( article, title ) ),
		);
	}

	return styles;
}

export function loadForeignDependencies( page, data ) {
	const article = page.getArticle();

	const dependencies = utils.getMissingDependencies( data );
	const hostname = article.get( 'hostname' );
	const action = mw.util.wikiScript( 'load' );
	const params = $.param( {
		modules: dependencies.join( '|' ),
		skin: mw.config.get( 'skin' ),
	} );

	mw.loader.load( `https://${ hostname }${ action }?${ params }` );
}

export function loadForeignStylesDependencies( page, data ) {
	const article = page.getArticle();

	const dependencies = utils.getMissingDependencies( data );
	const hostname = article.get( 'hostname' );
	const action = mw.util.wikiScript( 'load' );
	const params = $.param( {
		modules: dependencies.join( '|' ),
		only: 'styles',
		skin: mw.config.get( 'skin' ),
	} );

	mw.loader.load( `https://${ hostname }${ action }?${ params }`, 'text/css' );
}

/**
 * Appends given urls array as link tags to the head.
 * @param {Array<string>} urls
 * @returns {Array<HTMLLinkElement>|undefined}
 */
export function addLinkTags( urls ) {
	if ( utils.isEmpty( urls ) ) return;
	return urls.map( url => mw.loader.addLinkTag?.( url ) );
}

/**
 * Removes link tags from the head.
 * @param {Array<HTMLLinkElement>} tags
 */
export function removeLinkTags( tags ) {
	if ( utils.isEmpty( tags ) ) return;
	tags.forEach( tag => tag?.remove() );
}

function getStyleHref( article, title ) {
	const href = mw.util.getUrl( title, { action: 'raw', ctype: 'text/css' } );
	return article.isForeign
		? getHrefAbsolute( article, href )
		: href;
}

/******* DIFF TABLE *******/

/**
 * Renders the <table> structure for displaying diff table.
 * @param {string} body diff table body HTML string
 * @returns {Element}
 */
export function renderDiffTable( body ) {
	const nodes = {};

	// Render structure
	nodes.container = h( 'table', {
			class: [
				'diff',
				'diff-type-table',
				`diff-contentalign-${ mw.config.get( 'wgContentLanguageDir' ) === 'rtl' ? 'right' : 'left' }`,
				`diff-editfont-${ mw.user.options.get( 'editfont' ) }`,
			],
		},
		h( 'colgroup',
			h( 'col', { class: 'diff-marker' } ),
			h( 'col', { class: 'diff-content' } ),
			h( 'col', { class: 'diff-marker' } ),
			h( 'col', { class: 'diff-content' } ),
		),
		nodes.head = h( 'tbody',
			h( 'tr', { class: 'diff-title', lang: id.local.userLanguage },
				nodes.deleted = h( 'td', { class: [ 'diff-otitle', 'diff-side-deleted' ], colSpan: 2 } ),
				nodes.added = h( 'td', { class: [ 'diff-ntitle', 'diff-side-added' ], colSpan: 2 } ),
			),
		),
		nodes.body = h( 'tbody' ),
	);

	// Render body
	if ( !utils.isEmpty( body ) ) {
		utils.setHTML( nodes.body, body );
	} else if ( body === '' ) {
		nodes.notice = h( 'tr',
			h( 'td', { class: 'diff-notice', colSpan: 4 },
				h( 'div', { class: 'mw-diff-empty' }, mw.msg( 'diff-empty' ) ),
			),
		);
		nodes.body.append( nodes.notice );
	}

	return nodes;
}

/**
 * Renders the diff table side.
 * @param {Object} data
 * @returns {DocumentFragment}
 */
export function renderDiffTableSide( data ) {
	data = {
		prefix: 'n',
		title: null,
		revid: null,
		previd: null,
		curRevid: null,
		hostname: null,
		timestamp: null,
		texthidden: false,
		user: null,
		userhidden: false,
		comment: null,
		commenthidden: false,
		...data,
	};

	const prefix = `mw-diff-${ data.prefix }title`;
	const title = data.revid === data.curRevid ? 'currentrev-asof' : 'revisionasof';
	const article = new Article( {
		type: 'revision',
		title: data.title,
		oldid: data.revid,
		hostname: data.hostname,
	} );

	return hf(
		h( 'div', { id: `${ prefix }1` },
			h( 'strong',
				data.texthidden
					? h( 'span', { class: 'history-deleted' }, mw.msg( title, getDate( data.timestamp ) ) )
					: hf(
						h( 'a', { href: getHref( article ) }, mw.msg( title, getDate( data.timestamp ) ) ),
						renderDiffEditLinks( article, data ),
					),
			),
		),
		h( 'div', { id: `${ prefix }2` },
			data.userhidden
				? h( 'span', { class: [ 'mw-userlink', 'history-deleted' ] }, mw.msg( 'rev-deleted-user' ) )
				: renderUserLink( article, data.user ),
		),
		h( 'div', { id: `${ prefix }3` },
			data.commenthidden
				? h( 'span', { class: [ 'comment', 'history-deleted' ] }, mw.msg( 'rev-deleted-comment' ) )
				: !utils.isEmpty( data.comment )
					? h( 'span', { class: [ 'comment', 'comment--without-parentheses' ], innerHTML: data.comment } )
					: h( 'span', { class: [ 'comment', 'mw-comment-none' ] }, mw.msg( 'changeslist-nocomment' ) ),
		),
	);
}

/**
 * Process the diff table for the revision view.
 * Dependent on 'showRevisionInfo' settings, shows the right side of the table or hides the table completely.
 * @param {JQuery} $table
 */
export function processRevisionDiffTable( $table ) {
	if ( settings.get( 'showRevisionInfo' ) ) {
		// Hide the left side of the table and left only related to the revision info
		$table.find( 'td:is(.diff-otitle, .diff-side-deleted)' ).addClass( 'instantDiffs-hidden' );
		$table.find( 'td:is(.diff-ntitle, .diff-side-added)' ).attr( 'colspan', '4' );

		// Hide comparison lines
		$table.find( 'tr:not([class])' ).addClass( 'instantDiffs-hidden' );
	} else {
		$table.addClass( 'instantDiffs-hidden' );
	}
}

/**
 * Renders the diff table edit links.
 * @param {import('./Article').default} article
 * @param {Object} data
 * @returns {DocumentFragment}
 */
export function renderDiffEditLinks( article, data ) {
	const isEditableCm = isEditableContentModel( mw.config.get( 'wgPageContentModel' ) );
	const isWbBCm = isWbContentModel( mw.config.get( 'wgPageContentModel' ) );
	const isEditable = mw.config.get( 'wgIsProbablyEditable' );

	const container = hf();

	// Edit / View
	if ( isEditableCm ) {
		container.append(
			ht( ' ' ),
			h( 'span', { class: 'mw-diff-edit' },
				h( 'a', {
					href: getHref( article, { action: 'edit' } ),
					title: article.get( 'title' ),
				}, mw.msg( isEditable ? 'editold' : 'viewsourceold' ) ),
			),
		);
	}

	// Restore (Wikibase)
	if ( isEditable && !isEditableCm && isWbBCm && data.revid !== data.curRevid ) {
		container.append(
			ht( ' ' ),
			h( 'span', { class: 'mw-diff-edit' },
				h( 'a', {
					href: getHref( article, { action: 'edit', restore: data.revid } ),
					title: article.get( 'title' ),
				}, mw.msg( 'wikibase-restoreold' ) ),
			),
		);
	}

	// Undo
	if ( isEditable && utils.isValidID( data.previd ) ) {
		container.append(
			ht( ' ' ),
			h( 'span', { class: 'mw-diff-edit' },
				h( 'a', {
						href: getHref( article, { action: 'edit', undoafter: data.previd, undo: data.revid } ),
						title: mw.msg( 'tooltip-undo' ),
					}, mw.msg( 'editundo' ),
				),
			),
		);
	}

	return container;
}

/**
 * Renders the diff table user link.
 * @param {import('./Article').default} article
 * @param {string} user
 * @returns {DocumentFragment}
 */
export function renderUserLink( article, user ) {
	const temporary = isTemporary( user );
	const userTitle = new mw.Title( user, 2 ).getPrefixedText();
	const userHref = getHrefAbsolute( article, mw.util.getUrl( userTitle ) );

	const talkTitle = new mw.Title( user, 3 ).getPrefixedText();
	const talkHref = getHrefAbsolute( article, mw.util.getUrl( talkTitle ) );

	const contribTitle = new mw.Title( `Contributions/${ user }`, -1 ).getPrefixedText();
	const contribHref = getHrefAbsolute( article, mw.util.getUrl( contribTitle ) );

	const userLinks = [
		h( 'a', {
				class: [ 'mw-redirect', 'mw-usertoollinks-talk' ],
				title: talkTitle,
				href: talkHref,
			},
			mw.msg( 'talkpagelinktext' ),
		),
	];
	if ( !temporary ) {
		userLinks.push(
			h( 'a', {
					class: [ 'mw-redirect', 'mw-usertoollinks-contribs' ],
					title: contribTitle,
					href: contribHref,
				},
				mw.msg( 'contribslink' ),
			),
		);
	}
	const linksFragment = hf( ...utils.arrayIntersperse( userLinks, ht( mw.msg( 'pipe-separator' ) ) ) );

	return hf(
		renderUserInfoCardButton( user ),
		h( 'a', {
				class: !temporary ? 'mw-userlink' : 'mw-tempuserlink',
				title: !temporary ? userTitle : contribTitle,
				href: !temporary ? userHref : contribHref,
			},
			h( 'bdi', user ),
		),
		ht( mw.msg( 'word-separator' ) ),
		h( 'span', { class: 'mw-usertoollinks' },
			hj( mw.message( 'parentheses', linksFragment ).parseDom() ),
		),
	);
}

/**
 * Renders the user info card button element.
 * @returns {HTMLAnchorElement|undefined} The created button element
 */
export function renderUserInfoCardButton( user ) {
	if ( !mw.user.options.get( 'checkuser-userinfocard-enable' ) || !isRegistered( user ) ) return;

	const iconClasses = [
		'cdx-button__icon',
		'ext-checkuser-userinfocard-button__icon',
		( isTemporary( user )
			? 'ext-checkuser-userinfocard-button__icon--userTemporary'
			: 'ext-checkuser-userinfocard-button__icon--userAvatar' ),
	];

	const buton = h( 'a', {
			class: 'ext-checkuser-userinfocard-button cdx-button cdx-button--action-default cdx-button--weight-quiet cdx-button--fake-button cdx-button--fake-button--enabled cdx-button--icon-only cd-comment-author-userInfoCard-button',
			role: 'button',
			tabindex: 0,
			href: 'javascript:void(0)',
			ariaLabel: mw.msg( 'checkuser-userinfocard-toggle-button-aria-label' ),
			'data-username': user,
		},
		h( 'span', { class: iconClasses } ),
	);

	// Set non-standard attributes
	buton.setAttribute( 'aria-haspopover', 'dialog' );

	return buton;
}

/**
 * Renders mobile diff footer.
 * @returns {DocumentFragment}
 */
export function renderDiffMobileFooter( data ) {
	data = {
		title: null,
		revid: null,
		hostname: null,
		user: null,
		userhidden: false,
		...data,
	};

	const article = new Article( {
		type: 'revision',
		title: data.title,
		oldid: data.revid,
		hostname: data.hostname,
	} );

	return h( 'div', { class: [ 'mw-diff-mobile-footer' ] },
		h( 'h3', { class: [ 'mw-diff-mobile-footer__header' ] },
			!data.userhidden
				? renderUserLink( article, data.user )
				: h( 'span', { class: [ 'mw-userlink', 'history-deleted' ] }, mw.msg( 'rev-deleted-user' ) ),
		),
	);
}

/******* INLINE FORMAT TOGGLE *******/

/**
 * Restores the Inline toggle switch button.
 * @param {JQuery} $container
 * @returns {boolean} a render status
 */
export function restoreInlineFormatToggle( $container ) {
	if (
		!$container || $container.length === 0 ||
		mw.loader.getState( 'mediawiki.diff' ) !== 'ready'
	) {
		return false;
	}

	const $inlineToggleSwitchLayout = $container.find( '#mw-diffPage-inline-toggle-switch-layout' );
	const inlineFormatToggle = getModuleExport( 'mediawiki.diff', './inlineFormatToggle.js' );

	try {
		inlineFormatToggle( $inlineToggleSwitchLayout );
		return true;
	} catch {}

	return false;
}

/******* VISUAL EDITOR / DIFFS *******/

/**
 * Restores the Visual Diffs buttons.
 * @param {JQuery} $container
 * @returns {boolean} a render status
 */
export function restoreVisualDiffs( $container ) {
	if (
		!$container || $container.length === 0 ||
		!utils.isValidID( mw.config.get( 'wgDiffOldId' ) ) ||
		!utils.isValidID( mw.config.get( 'wgDiffNewId' ) ) ||
		!isVisualDiffsAvailable( mw.config.get( 'wgPageContentModel' ) ) ||
		mw.loader.getState( 'ext.visualEditor.diffPage.init' ) !== 'ready'
	) {
		return false;
	}

	let $diffModeContainer = $container.find( '.ve-init-mw-diffPage-diffMode' );
	if ( $diffModeContainer.length > 0 ) return true;

	// Structure
	$diffModeContainer = $( '<div>' ).addClass( 've-init-mw-diffPage-diffMode' );

	// Append before inline toggle container if exists
	const $inlineToggleContainer = $container.find( '.mw-diffPage-inlineToggle-container' );
	if ( $inlineToggleContainer.length > 0 ) {
		$inlineToggleContainer.before( $diffModeContainer );
	} else {
		$container.append( $diffModeContainer );
	}

	return true;
}

/**
 * Checks if the Visual Diffs can execute on the specified content model.
 * @param {string} contentModel
 * @return {boolean}
 */
export function isVisualDiffsAvailable( contentModel ) {
	const veConfig = mw.config.get( 'wgVisualEditorConfig' );
	return veConfig && Object.prototype.hasOwnProperty.call( veConfig.contentModels, contentModel );
}

/******* ROLLBACK *******/

/**
 * Restores and implement a rollback link behavior. Partially copied from the MediaWiki Core:
 * @see {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/core/+/refs/heads/master/resources/src/mediawiki.misc-authed-curate/rollback.js}
 * @param {JQuery} $container
 * @returns {boolean} a render status
 */
export function restoreRollbackLink( $container ) {
	if ( !$container || $container.length === 0 ) return false;

	// Target elements map
	const selectors = [
		'.mw-rollback-link a[data-mw="interface"]',     // Pre 1.46
		'.mw-rollback-link a[data-mw-interface]',       // From 1.46 (T409187)
	];

	// Make the rollback link confirmable
	$container.confirmable( {
		i18n: {
			confirm: mw.msg( 'rollback-confirmation-confirm' ),
			yes: mw.msg( 'rollback-confirmation-yes' ),
			no: mw.msg( 'rollback-confirmation-no' ),
		},
		delegate: selectors.join( ',' ),
		handler: ( e ) => {
			e.preventDefault();
			postRollback( e.target );
		},
	} );

	return true;
}

function postRollback( link ) {
	// Hide the link and show a spinner inside the brackets.
	const $spinner = $.createSpinner( { size: 'small', type: 'inline' } );
	$( link ).css( 'display', 'none' ).after( $spinner );

	const params = {
		action: 'rollback',
		title: utils.getTitleFromUrl( link.href ),
		user: mw.util.getParamValue( 'from', link.href ),
		token: mw.util.getParamValue( 'token', link.href ),
		formatversion: 2,
		uselang: id.local.userLanguage,
	};

	Api.post( params )
		.then( ( data ) => {
			const $message = $( utils.textDom( data?.rollback?.summary ) );
			utils.addTargetToLinks( $message );

			mw.notify( $message, { tag: 'rollback' } );

			// Remove the link wrapper (including the spinner).
			$( link ).closest( '.mw-rollback-link' ).remove();

			// Refresh view contents
			view.refresh();
		} )
		.catch( ( code, data ) => {
			const $message = $( utils.textDom( data?.error?.info ) );
			utils.addTargetToLinks( $message );

			mw.notify( $message, { type: 'error', tag: 'rollback' } );

			// Restore the link. This allows the user to try again
			// (or open it in a new window, bypassing this ajax handler).
			$spinner.remove();
			$( link ).css( 'display', '' );
		} );
}