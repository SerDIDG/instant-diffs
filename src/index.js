/**
 * Instant Diffs
 *
 * Author: Serhio Magpie
 * Licenses: MIT, CC BY-SA
 * Documentation: https://www.mediawiki.org/wiki/Instant_Diffs
 */

// <nowiki>

$( function () {
	const _config = {
		name: 'Instant Diffs',
		version: '1.2.0-b.10',
		link: 'Instant_Diffs',
		discussion: 'Talk:Instant_Diffs',
		origin: 'https://mediawiki.org',
		prefix: 'instantDiffs',
		messagePrefix: 'instant-diffs',
		settingsPrefix: 'userjs-instantDiffs',

		dependencies: {
			styles: '/w/index.php?title=User:Serhio_Magpie/instantDiffs.test.css&action=raw&ctype=text/css',
			messages: '/w/index.php?title=User:Serhio_Magpie/instantDiffs-i18n/$lang.js&action=raw&ctype=text/javascript',
			main: [
				'mediawiki.api',
				'mediawiki.util',
				'mediawiki.storage',
				'mediawiki.notification',
				'mediawiki.Title',
			],
			dialog: [
				'oojs',
				'oojs-ui',
				'oojs-ui.styles.icons-movement',
				'oojs-ui.styles.icons-interactions',
				'oojs-ui.styles.icons-layout',
			],
			content: [
				'mediawiki.diff',
				'mediawiki.diff.styles',
				'mediawiki.interface.helpers.styles',
				'ext.flaggedRevs.basic',
				'ext.thanks.corethank',
			],
			settings: [
				'oojs',
				'oojs-ui',
			],
		},

		// Settings list
		settings: {
			showLink: true,
			showPageLink: true,
			highlightLine: true,
			markWatchedLine: true,
			unHideDiffs: true,
			openInNewTab: true,
			linksFormat: true,
			wikilinksFormat: true,
			enableMobile: true,
			notifyErrors: true,
		},

		// Settings defaults
		defaults: {
			debug: false,
			logTimers: true,
			showLink: false,
			showPageLink: true,
			highlightLine: true,
			markWatchedLine: true,
			unHideDiffs: true,
			openInNewTab: true,
			linksFormat: 'full',
			wikilinksFormat: 'special',
			enableMobile: true,
			notifyErrors: true,
		},

		// Including / excluding rules
		include: {
			actions: [ 'view', 'history' ],
		},

		exclude: {
			pages: [ 'GlobalContributions' ],
		},

		// Action labels
		labels: {
			page: {
				ltr: '➔',
				rtl: '🡰',
			},
			diff: '❖',
			revision: '✪',
			error: '𝓔',
		},

		// Wikilink format presets
		wikilinkPresets: {
			link: {
				page: '[$href $msg]',
				diff: '[$href $msg]',
				revision: '[$href $msg]',
			},
			special: {
				page: '[[Special:Redirect/page/$1|$msg]]',
				diff: '[[Special:Diff/$1|$msg]]',
				revision: '[[Special:PermanentLink/$1|$msg]]',
			},
		},

		// MediaWiki config
		mwConfigBackup: [
			'thanks-confirmation-required',
			'wgArticleId',
			'wgCurRevisionId',
			'wgRevisionId',
			'wgDiffOldId',
			'wgDiffNewId',
			'wgPageContentModel',
		],
		skinBodyClasses: {
			'vector-2022': [ 'vector-body' ],
			vector: [ 'vector-body' ],
			monobook: [ 'monobook-body' ],
			minerva: [ 'content' ],
			timeless: [ 'mw-body' ],
		},

		// Content selectors
		bodyContentSelector: '#bodyContent',

		// Link selectors
		specialPages: [
			'Special:Diff',
			'Special:PermanentLink',
			'Special:MobileDiff',
		],
		specialPagesSearchRegExp: '^($1)',									// $1 - joined specialPages
		specialPagesPathRegExp: '$1($2)',									// $1 - article path, $2 - joined specialPages
		specialPagesSelector: 'a[title^="$1"]',								// $1 - each of the specialPages

		articlePathRegExp: '^($1)',											// $1 - article path
		sectionRegExp: /^\/\*\s*(.*?)\s*\*\/.*$/,

		linkSelector: [														// $1 - server
			'a[data-instantdiffs-link]',
			'a.external[href*="$1"]',
			'a.mw-changeslist-diff',
			'a.mw-changeslist-diff-cur',
			'a.mw-changeslist-groupdiff',
			'.mw-fr-reviewlink a',
			'.mw-history-histlinks a',
			'a.mw-changeslist-date.mw-newpages-time',						// [[Special:Newpages]]
			'.mw-diff-bytes + a',
			'.mw-fr-pending-changes-table a.cdx-docs-link',
			'#mw-revision-nav a',											// [[Special:PermanentLink]]
			'.diff-type-table #differences-prevlink',						// [[Special:Diff]]
			'.diff-type-table #differences-nextlink',						// [[Special:Diff]]
		],

		changeLists: [
			'Watchlist',
			'Recentchanges',
			'Recentchangeslinked',
		],
		contributionLists: [
			'Contributions',
			'GlobalContributions',
		],
		otherLists: [
			'Newpages',
			'PendingChanges',
		],

		mwLine: {
			seen: [
				'mw-changeslist-line-not-watched',
				'mw-enhanced-not-watched',
				'mw-changeslist-watchedseen',
			],
			unseen: [
				'mw-changeslist-line-watched',
				'mw-enhanced-watched',
				'mw-changeslist-watchedunseen',
			],
		},
		mwLineTitle: {
			selector: [
				'.mw-changeslist-title',
				'.mw-contributions-title',
				'.mw-newpages-pagename',
				'.mw-fr-pending-changes-page-title',
			],
		},
		mwLink: {
			id: [
				'differences-prevlink',										// [[Special:Diff]]
				'differences-nextlink',										// [[Special:Diff]]
			],
			hasClass: [
				'mw-changeslist-date',
				'mw-changeslist-diff',
				'mw-changeslist-diff-cur',
				'mw-changeslist-groupdiff',
				'mw-newpages-time',											// [[Special:Newpages]]
			],
			closestTo: [
				'.mw-pager-navigation-bar + ul',
				'.mw-history-histlinks',
				'.mw-fr-hist-difflink',
				'.mw-fr-reviewlink',
				'#mw-fr-reviewnotice',
				'#mw-fr-revisiontag',
				'#mw-fr-revisiontag-edit',
				'#mw-fr-revision-tag-edit',
				'.mw-fr-pending-changes-table',
				'#mw-revision-nav',											// [[Special:PermanentLink]]
			],
		},
		mwLinkDiffOnly: {
			id: [
				'differences-prevlink',										// [[Special:Diff]]
				'differences-nextlink',										// [[Special:Diff]]
			],
			closestTo: [
				'#mw-revision-nav',											// [[Special:PermanentLink]]
			],
		},
		mwLinkPrepend: {
			id: [
				'differences-nextlink',										// [[Special:Diff]]
			],
		},
		mwLinkExclude: {
			closestTo: [
				'.comment',													// Edit summary in the edit lists
			],
		},
	};

	const _local = {
		mwIsAnon: null,
		mwEndPoint: null,
		mwEndPointUrl: null,
		mwApi: null,
		mwArticlePath: null,
		mwServers: [],
		titleText: null,
		language: null,
		messages: {},

		dialog: null,
		settings: null,
		snapshot: null,

		links: new Map(),
		linkSelector: null,

		specialPages: [],
		specialPagesPrefixed: [],
		specialPagesAliases: {},
		specialPagesAliasesPrefixed: {},
		specialPagesPathRegExp: null,
		specialPagesSearchRegExp: null,
		articlePathRegExp: null,
	};

	const _timers = {};

	/******* UTILS *******/

	const _utils = {};

	/*** BASIC TYPES ***/

	_utils.isEmpty = ( str ) => {
		return !str || str.length === 0;
	};

	_utils.isBoolean = ( value ) => {
		return typeof value === 'boolean';
	};

	_utils.isFunction = ( value ) => {
		return typeof value === 'function';
	};

	/*** MESSAGES ***/

	_utils.msg = function () {
		const params = Array.from( arguments );
		if ( !_utils.isEmpty( params[ 0 ] ) ) {
			params[ 0 ] = _utils.getMsgKey( params[ 0 ] );
		}
		return mw.msg.apply( mw.msg, params );
	};

	_utils.isMessageExists = ( str ) => {
		if ( _utils.isEmpty( str ) ) return false;
		return mw.message( _utils.getMsgKey( str ) ).exists();
	};

	_utils.processMessages = () => {
		const language = mw.config.get( 'wgUserLanguage' );

		// Do not set strings when the language is qqx for debagging
		if ( language === 'qqx' ) {
			_local.language = language;
			return;
		}

		// Merge current language strings with English for fallback
		_local.language = instantDiffs.i18n[ language ] ? language : 'en';
		_local.messages = instantDiffs.i18n[ _local.language ];
		if ( _local.language !== 'en' ) {
			_local.messages = $.extend( {}, instantDiffs.i18n.en, _local.messages );
		}

		// Set strings key-value pairs
		const processedMessages = {};
		for ( const [ key, value ] of Object.entries( _local.messages ) ) {
			processedMessages[ _utils.getMsgKey( key ) ] = value;
		}

		mw.messages.set( processedMessages );
	};

	_utils.getMsgKey = ( str ) => {
		return `${ _config.messagePrefix }-${ str }`;
	};

	_utils.getErrorMessage = ( str, page, error ) => {
		str = _utils.isMessageExists( str ) ? str : 'error-generic';
		page = $.extend( {}, page );
		error = $.extend( {}, error );
		return _utils.msg(
			str,
			page.oldid || page.curid,
			page.diff,
			page.titleText || page.title,
			error.message || _utils.msg( 'error-wasted' ),
		);
	};

	_utils.notifyError = ( str, page, error, silent ) => {
		silent = !_utils.isBoolean( silent ) ? _utils.defaults( 'notifyErrors' ) : silent;

		// Silent all errors if a document is hidden or in the process of unloading
		if ( instantDiffs.isUnloading ) return;
		if ( document.visibilityState === 'hidden' ) {
			silent = true;
		}

		const message = _utils.getErrorMessage( str, page, error );
		if ( silent ) {
			console.warn( `${ _utils.msg( 'name' ) }: ${ message }`, page, error );
			return;
		}

		if ( typeof mw !== 'undefined' && mw.notify ) {
			const $container = $( '<div>' )
				.addClass( 'instantDiffs-notification' );
			const $label = $( '<div>' )
				.addClass( 'instantDiffs-notification-label' )
				.appendTo( $container );
			const $link = new Button( {
				label: _utils.msg( 'name' ),
				href: _utils.getOrigin( `/wiki/${ _config.link }` ),
				target: '_blank',
				container: $label,
			} );
			const $message = $( '<div>' )
				.text( message )
				.appendTo( $container );

			mw.notify( $container, { type: 'error', tag: `${ _config.prefix }-${ error.type }` } );
		}

		console.error( `${ _utils.msg( 'name' ) }: ${ message }`, page, error );
	};

	/*** COMMON ***/

	_utils.defaults = ( key ) => {
		return key ? instantDiffs.defaults[ key ] : instantDiffs.defaults;
	};

	_utils.setDefaults = ( data, save ) => {
		instantDiffs.defaults = $.extend( {}, instantDiffs.defaults, data );

		// Temporary save defaults to the local User Options
		if ( save && !_local.mwIsAnon ) {
			try {
				mw.user.options.set( _config.settingsPrefix, JSON.stringify( instantDiffs.defaults ) );
			} catch ( e ) {}
		}
	};

	_utils.processDefaults = () => {
		// Set settings stored in the Local Storage
		try {
			const settings = mw.storage.getObject( `${ _config.prefix }-settings` );
			_utils.setDefaults( settings, false );
		} catch ( e ) {}

		// Set settings stored in the User Options
		if ( !_local.mwIsAnon ) {
			try {
				const settings = JSON.parse( mw.user.options.get( `${ _config.settingsPrefix }-settings` ) );
				_utils.setDefaults( settings, false );
			} catch ( e ) {}
		}
	};

	_utils.getOrigin = ( path ) => {
		return `${ _config.origin }${ path }`;
	};

	_utils.getDependencies = ( data ) => {
		return data.filter( item => {
			const state = mw.loader.getState( item );
			return state && ![ 'error', 'missing' ].includes( state );
		} );
	};

	_utils.isAllowed = () => {
		return _config.include.actions.includes( mw.config.get( 'wgAction' ) ) &&
			!_config.exclude.pages.includes( mw.config.get( 'wgCanonicalSpecialPageName' ) );
	};

	_utils.logTimer = ( name, start, end ) => {
		let diff = end - start;
		if ( diff < 1000 ) {
			diff = `${ diff }ms`;
		} else {
			diff = `${ ( diff / 1000 ).toFixed( 2 ) }s`;
		}
		console.info( `${ _utils.msg( 'name' ) }: ${ name }: ${ diff }.` );
	};

	/*** LINKS ***/

	_utils.getLinks = ( $container ) => {
		if ( typeof $container === 'undefined' ) {
			$container = _utils.getBodyContentNode();
		}
		return $container.find( _local.linkSelector );
	};

	_utils.getLabel = ( type ) => {
		const label = _config.labels[ type ];
		if ( !label ) return;
		return typeof label === 'object' ? label[ document.dir ] : label;
	};

	_utils.getTarget = ( isInDialog ) => {
		return _utils.defaults( 'openInNewTab' ) && isInDialog ? '_blank' : '_self';
	};

	/*** DIFF \ REVISION ***/

	_utils.isValidID = ( id ) => {
		return !_utils.isEmpty( id ) && !isNaN( id );
	};

	_utils.isValidDir = ( dir ) => {
		return !_utils.isEmpty( dir ) && [ 'next', 'prev', 'cur' ].includes( dir );
	};

	_utils.isCompareHidden = ( data ) => {
		return data && ( data.fromtexthidden || data.totexthidden );
	};

	_utils.isRevisionHidden = ( data ) => {
		return data && data.slots?.main?.texthidden;
	};

	_utils.getWikilink = ( page, pageParams, params ) => {
		pageParams = $.extend( {}, pageParams );
		params = $.extend( {
			wikilink: true,
			wikilinkPreset: 'special',
			type: 'diff',
			href: null,
		}, params );

		// Get diff \ oldid params
		let id = null;
		if ( !_utils.isEmpty( pageParams.oldid ) && !_utils.isEmpty( pageParams.diff ) ) {
			id = `${ pageParams.oldid }/${ pageParams.diff }`;
		} else if ( !_utils.isEmpty( pageParams.oldid ) ) {
			id = pageParams.oldid;
		} else if ( !_utils.isEmpty( pageParams.diff ) ) {
			id = pageParams.diff;
		} else if ( !_utils.isEmpty( pageParams.curid ) ) {
			id = pageParams.curid;
		}

		// Get preset
		const preset = _config.wikilinkPresets[ params.wikilinkPreset ] || _config.wikilinkPresets.special;

		// Format wikilink
		const wikilink = preset[ params.type ];
		return wikilink
			.replace( '$1', id )
			.replace( '$href', params.href )
			.replace( '$msg', _utils.msg( `wikilink-${ params.type }` ) );
	};

	_utils.getHref = ( page, pageParams, params ) => {
		pageParams = $.extend( {}, pageParams );
		params = $.extend( {
			wikilink: false,
			wikilinkPreset: null,
			type: null,
			minify: false,
			relative: true,
		}, params );

		// Get url with the current origin
		let url;
		if ( !_utils.isEmpty( page.title ) ) {
			url = new URL( mw.util.getUrl( page.title, pageParams ), _local.mwEndPointUrl.origin );
		} else {
			url = new URL( _local.mwEndPointUrl );
			url.search = new URLSearchParams( pageParams ).toString();
		}

		// Minify href
		if ( params.minify ) {
			url.pathname = '';
			url.searchParams.delete( 'title' );
		}

		// Get relative or absolute href
		params.href = decodeURIComponent( params.relative ? ( url.pathname + url.search + url.hash ) : url.toString() );

		// Get wikilink
		if ( params.wikilink ) {
			return _utils.getWikilink( page, pageParams, params );
		}

		return params.href;
	};

	_utils.getDiffHref = ( page, pageParams, params ) => {
		pageParams = $.extend( {}, pageParams );
		params = $.extend( params, { type: 'diff' } );

		// Minify url in cases where provided id and diff / oldid = prev
		if ( _utils.isValidID( page.oldid ) && _utils.isValidDir( page.diff ) && page.diff === 'prev' ) {
			pageParams.diff = page.oldid;
		} else if ( _utils.isValidID( page.diff ) && _utils.isValidDir( page.oldid ) && page.oldid === 'prev' ) {
			pageParams.diff = page.diff;
		} else {
			if ( !_utils.isEmpty( page.oldid ) ) {
				pageParams.oldid = page.oldid;
			}
			if ( !_utils.isEmpty( page.diff ) ) {
				pageParams.diff = page.diff;
			}
			if ( _utils.isEmpty( page.oldid ) && _utils.isEmpty( page.diff ) && _utils.isValidID( page.curid ) ) {
				params.type = 'page';
				pageParams.curid = page.curid;
			}
		}

		return _utils.getHref( page, pageParams, params );
	};

	_utils.getRevisionHref = ( page, pageParams, params ) => {
		pageParams = $.extend( {}, pageParams );
		params = $.extend( params, { type: 'revision' } );

		if ( _utils.isValidID( page.oldid ) ) {
			pageParams.oldid = page.oldid;
		} else if ( _utils.isValidID( page.curid ) ) {
			params.type = 'page';
			pageParams.curid = page.curid;
		}

		return _utils.getHref( page, pageParams, params );
	};

	_utils.getSplitSpecialUrl = ( title ) => {
		const localizedPermanentLink = _local.specialPagesAliasesPrefixed[ 'Special:PermanentLink' ];
		const splitParams = title.split( '/' );
		const page = {};
		if ( splitParams[ 0 ] === localizedPermanentLink ) {
			page.oldid = splitParams[ 1 ];
		} else {
			if ( splitParams.length > 1 ) {
				page.diff = splitParams.pop();
			}
			if ( splitParams.length > 1 ) {
				page.oldid = splitParams.pop();
			}
		}
		return page;
	};

	_utils.getTitleFromUrl = ( href ) => {
		try {
			const url = new URL( href );
			return url.searchParams.get( 'title' );
		} catch ( e ) {
			return null;
		}
	};

	_utils.getOldidFromUrl = ( href ) => {
		try {
			const url = new URL( href );
			return url.searchParams.get( 'oldid' );
		} catch ( e ) {
			return null;
		}
	};

	_utils.getHashFromUrl = ( href ) => {
		try {
			const url = new URL( href );
			return url.hash;
		} catch ( e ) {
			return null;
		}
	};

	_utils.getCompareTitle = ( compare ) => {
		if ( compare.torevid ) {
			return compare.totitle;
		}
		if ( compare.fromrevid ) {
			return compare.fromtitle;
		}
		return null;
	};

	_utils.getCompareSection = ( compare ) => {
		let sectionMatch;
		if ( compare.torevid ) {
			if ( !_utils.isEmpty( compare.tocomment ) ) {
				sectionMatch = compare.tocomment.match( _config.sectionRegExp );
			}
			return sectionMatch && sectionMatch[ 1 ] || null;
		}
		if ( compare.fromrevid ) {
			if ( !_utils.isEmpty( compare.fromcomment ) ) {
				sectionMatch = compare.fromcomment.match( _config.sectionRegExp );
			}
			return sectionMatch && sectionMatch[ 1 ] || null;
		}
		return null;
	};

	_utils.getRevisionSection = ( revision ) => {
		let sectionMatch;
		if ( revision && !_utils.isEmpty( revision.comment ) ) {
			sectionMatch = revision.comment.match( _config.sectionRegExp );
		}
		return sectionMatch && sectionMatch[ 1 ] || null;
	};

	_utils.extendPage = ( page, params = {} ) => {
		if ( _utils.isValidID( params.oldid ) ) {
			page.oldid = params.oldid;
		}
		if ( !_utils.isEmpty( params.title ) ) {
			page.title = params.title;
		}
		if ( !_utils.isEmpty( params.section ) ) {
			page.section = params.section.replace( /^#/, '' );
		}

		if ( !_utils.isEmpty( page.title ) ) {
			page.mwTitle = new mw.Title( page.title );
			page.titleText = page.mwTitle.getPrefixedText();

			if ( !_utils.isEmpty( page.section ) ) {
				page.titleSection = [ page.title, page.section ].join( '#' );
				page.titleTextSection = [ page.titleText, page.section ].join( '#' );
			}

			page.href = mw.util.getUrl( page.titleSection || page.title );
		}

		return page;
	};

	/*** MW ***/

	_utils.getMobileServer = () => {
		const server = mw.config.get( 'wgServer' );
		const prefix = new RegExp( `^//www.` ).test( server ) ? 'www.' : '';

		const language = mw.config.get( 'wgContentLanguage' );
		if ( !_utils.isEmpty( language ) ) {
			const regExp = new RegExp( `^//${ language }` );
			if ( regExp.test( server ) ) {
				return server.replace( regExp, `//${ language }.m` );
			}
		}

		const project = mw.config.get( 'wgNoticeProject' );
		if ( !_utils.isEmpty( project ) ) {
			const regExp = new RegExp( `^//${ prefix }${ project }` );
			if ( regExp.test( server ) ) {
				return server.replace( regExp, !_utils.isEmpty( prefix ) ? `//m.${ project }` : `//${ project }.m` );
			}
		}
	};

	_utils.getBodyContentNode = () => {
		let $content = $( _config.bodyContentSelector );
		if ( !$content || $content.length === 0 ) {
			$content = $( document.body );
		}
		return $content;
	};

	_utils.backupMWConfig = () => {
		const data = {};
		_config.mwConfigBackup.forEach( key => {
			data[ key ] = mw.config.get( key );
		} );
		return data;
	};

	_utils.restoreMWConfig = ( data ) => {
		_config.mwConfigBackup.forEach( key => {
			if ( typeof data[ key ] !== 'undefined' ) {
				mw.config.set( key, data[ key ] );
			}
		} );
	};

	_utils.isMWLink = ( node, preset ) => {
		let isConfirmed = false;

		// Validate preset
		preset = preset || _config.mwLink;

		// Check if a node id matches
		if ( preset.id ) {
			isConfirmed = preset.id.some( id => ( node.id === id ) );
			if ( isConfirmed ) return isConfirmed;
		}

		// Check if a node contains a className
		if ( preset.hasClass ) {
			isConfirmed = preset.hasClass.some( className => node.classList.contains( className ) );
			if ( isConfirmed ) return isConfirmed;
		}

		// Check if a node contains children by a selector
		if ( preset.hasChild ) {
			isConfirmed = preset.hasChild.some( selector => node.querySelector( selector ) );
			if ( isConfirmed ) return isConfirmed;
		}

		// Check if a node is a child of a parent by a selector
		if ( preset.closestTo ) {
			isConfirmed = preset.closestTo.some( selector => node.closest( selector ) );
		}
		return isConfirmed;
	};

	_utils.getMWDiffLine = ( item ) => {
		// ChangeLists
		if ( _config.changeLists.includes( mw.config.get( 'wgCanonicalSpecialPageName' ) ) ) {
			return item.link.closest( '.mw-changeslist-line' );
		}

		// E.g. Contributions page, etc
		return item.link.closest( 'li, tr' );
	};

	_utils.getMWDiffLineTitle = ( item ) => {
		const selector = _config.mwLineTitle.selector.join( ',' );
		item.$title = item.$line.find( selector );
		if ( item.$title?.length === 0 ) return;

		const title = item.$title.attr( 'title' );
		return !_utils.isEmpty( title ) ? title : item.$title.text();
	};

	/*** ELEMENTS ***/

	_utils.addClick = ( node, handler, useAltKey = true ) => {
		const callback = ( event ) => {
			if ( event ) {
				// Prevent default behavior for Space\Enter buttons
				if ( isNotToggleKey( event ) || event.button || event.ctrlKey ) return;

				event.preventDefault();

				// Open a link in the current tab if an alt key is pressed
				if ( useAltKey && event.altKey && !_utils.isEmpty( node.href ) ) {
					window.location.href = node.href;
					return;
				}
			}
			handler( event );
		};

		const isNotToggleKey = ( event ) => {
			return event.type === 'keypress' && ![ 'Enter', 'Space' ].includes( event.code );
		};

		// Add title about alternative click action
		if ( useAltKey && !_utils.isEmpty( node.href ) ) {
			if ( _utils.isEmpty( node.dataset.altTitle ) ) {
				node.dataset.altTitle = node.title;
			}
			node.dataset.altTitle = [ node.dataset.altTitle, _utils.msg( 'alt-click' ) ].join( ' ' );
			node.dataset.origTitle = node.title;

			node.addEventListener( 'mouseenter', () => ( node.title = node.dataset.altTitle ) );
			node.addEventListener( 'mouseleave', () => ( node.title = node.dataset.origTitle ) );
		}

		node.addEventListener( 'click', callback );
		node.addEventListener( 'keypress', callback );
	};

	_utils.clipboardWrite = ( text, callback ) => {
		if ( _utils.isEmpty( text ) ) return;

		const success = () => {
			mw.notify( _utils.msg( 'copy-link-copied' ), { tag: 'copyLink' } );
			_utils.isFunction( callback ) && callback( true );
		};

		const error = () => {
			mw.notify( _utils.msg( 'copy-link-error' ), { tag: 'copyLink', type: 'error' } );
			_utils.isFunction( callback ) && callback( false );
		};

		if ( navigator.clipboard?.writeText ) {
			navigator.clipboard.writeText( text )
				.then( success )
				.catch( error );
		} else {
			const $textarea = $( '<textarea>' )
				.val( text )
				.appendTo( document.body )
				.select();

			const successful = document.execCommand( 'copy' );
			$textarea.remove();

			successful ? success() : error();
		}
	};

	_utils.embedElement = ( node, container, insertMethod ) => {
		if ( !container ) return node;

		if ( container instanceof jQuery ) {
			$( node )[ insertMethod ]( container );
			return node;
		}

		switch ( insertMethod ) {
			case 'insertBefore' :
				container.before( node );
				break;

			case 'insertAfter' :
				container.after( node );
				break;

			case 'appendChild' :
			default:
				container.appendChild( node );
				break;
		}

		return node;
	};

	_utils.renderOoUiElement = ( $element ) => {
		return new OO.ui.Element( { $element } );
	};

	_utils.applyOoUiPolyfill = () => {
		// "findFirstSelectedItem" method was added in the MediaWiki 1.39 / wmf.23
		if ( !_utils.isFunction( OO.ui.RadioSelectWidget.prototype.findFirstSelectedItem ) ) {
			OO.ui.RadioSelectWidget.prototype.findFirstSelectedItem = function () {
				const selected = this.findSelectedItems();
				return Array.isArray( selected ) ? selected[ 0 ] || null : selected;
			};
		}
	};

	_utils.getPlaceholderClasses = ( modifiers = [] ) => {
		const classes = [ 'instantDiffs-panel-placeholder' ];
		modifiers.forEach( modifier => classes.push( `instantDiffs-panel-placeholder--${ modifier }` ) );
		if ( _utils.defaults( 'showLink' ) ) {
			classes.push( 'has-link' );
		}
		return classes;
	};

	_utils.getPlaceholder = () => {
		return $( '<span>' ).addClass( _utils.getPlaceholderClasses() );
	};

	_utils.getWindowManager = function () {
		const manager = new OO.ui.WindowManager();
		$( document.body ).append( manager.$element );
		return manager;
	};

	/******* BUTTON CONSTRUCTOR *******/

	function Button( options ) {
		this.options = $.extend( {
			node: null,
			tag: 'button',
			classes: [],
			label: null,
			title: null,
			href: null,
			target: '_self',
			handler: null,
			container: null,
			insertMethod: 'appendTo',
			ariaHaspopup: false,
			altTitle: null,
			useAltKey: false,
		}, options );

		// Validate
		if ( !_utils.isEmpty( this.options.href ) ) {
			this.options.tag = 'a';
		}

		if ( this.options.node && this.options.node.nodeType === 1 ) {
			this.node = this.options.node;
			this.process();
		} else {
			this.render();
		}
	}

	Button.prototype.render = function () {
		this.node = document.createElement( this.options.tag );
		this.node.innerText = this.options.label;
		this.node.classList.add.apply( this.node.classList, this.options.classes );

		if ( !_utils.isEmpty( this.options.title ) ) {
			this.node.title = this.options.title;
		}
		if ( !_utils.isEmpty( this.options.href ) ) {
			this.node.href = this.options.href;
			this.node.target = this.options.target;
		} else {
			this.node.setAttribute( 'tabindex', '0' );
			this.node.setAttribute( 'role', 'button' );
		}

		this.process();
		this.embed( this.options.container, this.options.insertMethod );
	};

	Button.prototype.process = function () {
		if ( !_utils.isFunction( this.options.handler ) ) return;

		if ( this.options.ariaHaspopup ) {
			this.node.setAttribute( 'aria-haspopup', 'dialog' );
		}
		if ( !_utils.isEmpty( this.options.altTitle ) ) {
			this.node.dataset.altTitle = this.options.altTitle;
		}

		_utils.addClick( this.node, this.options.handler.bind( this ), this.options.useAltKey );
	};

	Button.prototype.embed = function ( container, insertMethod ) {
		_utils.embedElement( this.node, container, insertMethod );
	};

	Button.prototype.remove = function () {
		this.node.remove();
	};

	Button.prototype.pending = function ( value ) {
		this.node.classList.toggle( 'instantDiffs-link--pending', value );
	};

	Button.prototype.getContainer = function () {
		return this.node;
	};

	/******* SNAPSHOT CONSTRUCTOR *******/

	function Snapshot() {
		this.links = Array.from( _utils.getLinks() );
	}

	Snapshot.prototype.setLink = function ( link ) {
		this.link = link;
	};

	Snapshot.prototype.hasLink = function ( link ) {
		return this.links.indexOf( link.getNode() ) !== -1;
	};

	Snapshot.prototype.getLength = function () {
		return this.links.length;
	};

	Snapshot.prototype.getIndex = function () {
		return this.link ? this.links.indexOf( this.link.getNode() ) : -1;
	};

	Snapshot.prototype.getPreviousLink = function ( currentIndex ) {
		if ( typeof currentIndex === 'undefined' ) {
			currentIndex = this.getIndex();
		}

		if ( currentIndex !== -1 && currentIndex > 0 ) {
			const previousIndex = currentIndex - 1;
			const previousLinkNode = this.links[ previousIndex ];
			const previousLink = _local.links.get( previousLinkNode );
			return this.isLinkValid( previousLink ) ? previousLink : this.getPreviousLink( previousIndex );
		}
	};

	Snapshot.prototype.getNextLink = function ( currentIndex ) {
		if ( typeof currentIndex === 'undefined' ) {
			currentIndex = this.getIndex();
		}

		if ( currentIndex !== -1 && ( currentIndex + 1 ) < this.getLength() ) {
			const nextIndex = currentIndex + 1;
			const nextLinkNode = this.links[ nextIndex ];
			const nextLink = _local.links.get( nextLinkNode );
			return this.isLinkValid( nextLink ) ? nextLink : this.getNextLink( nextIndex );
		}
	};

	Snapshot.prototype.isLinkValid = function ( link ) {
		return link && ( link.isProcessed || ( !link.isLoaded && link.hasRequest ) );
	};

	/******* LINK CONSTRUCTOR *******/

	function Link( node, options ) {
		this.node = node;
		this.options = $.extend( true, {
			type: null,
			behavior: 'default',            // default | basic | event
			insertMethod: 'insertAfter',
			initiatorLink: null,
			initiatorDialog: null,
			initiatorDiff: null,
			onOpen: function () {},
			onClose: function () {},
		}, options );

		this.nodes = {};
		this.page = {};
		this.action = {};
		this.mw = {
			hasLink: false,
			hasLine: false,
		};
		this.manual = {
			hasLink: false,
			behavior: 'default',
		};
		this.isLoading = false;
		this.isLoaded = false;
		this.isProcessed = false;
		this.hasRequest = false;

		// Check if a link was opened from the ID dialog
		if ( _local.dialog && _local.dialog.isParent( this.node ) ) {
			this.options.initiatorDialog = _local.dialog;
			this.options.initiatorDiff = _local.dialog.getDiff();
		}

		// Check if a link generated by MediaWiki
		this.mw.hasLink = _utils.isMWLink( this.node, _config.mwLink );
		if ( this.mw.hasLink ) {
			this.mw.link = this.node;

			this.mw.isDiffOnly = _utils.isMWLink( this.mw.link, _config.mwLinkDiffOnly );
			this.mw.isExcluded = _utils.isMWLink( this.mw.link, _config.mwLinkExclude );
			if ( !this.mw.isExcluded ) {
				this.options.behavior = 'basic';
			}
			this.mw.isPrepend = _utils.isMWLink( this.mw.link, _config.mwLinkPrepend );
			if ( this.mw.isPrepend ) {
				this.options.insertMethod = 'insertBefore';
			}

			this.mw.line = _utils.getMWDiffLine( this.mw );
			if ( this.mw.line ) {
				this.mw.hasLine = true;
				this.mw.$line = $( this.mw.line ).addClass( 'instantDiffs-line' );
				this.mw.title = _utils.getMWDiffLineTitle( this.mw );
			}
		}

		// Check if a link was marked manually by the "data-instantdiffs-link" attribute: default | basic | event | link (deprecated)
		this.manual.behavior = this.node.dataset.instantdiffsLink;
		if ( this.manual.behavior === 'link' ) {
			this.manual.behavior = 'event';
		}
		if ( [ 'default', 'basic', 'event' ].includes( this.manual.behavior ) ) {
			this.options.behavior = this.manual.behavior;
			this.manual.hasLink = true;
		}

		// Validate configuration
		this.config = $.extend( {}, _utils.defaults(), {
			showPageLink: _utils.defaults( 'showPageLink' ) && this.options.behavior === 'default',
		} );

		_local.links.set( this.node, this );

		this.process();
	}

	Link.prototype.process = function () {
		this.href = this.node.href;
		if ( _utils.isEmpty( this.href ) ) return;

		// Validate url
		const urlParts = {};
		try {
			this.url = new URL( this.href );
			urlParts.title = this.url.searchParams.get( 'title' );
			urlParts.pathname = decodeURIComponent( this.url.pathname );
			urlParts.pathnameNormalized = urlParts.pathname.replace( new RegExp( _local.mwArticlePath ), '' );
		} catch ( e ) {
			return;
		}

		// Get link origin and index.php endpoint
		this.page.origin = this.url.origin;
		this.page.mwEndPoint = `${ this.page.origin }${ mw.config.get( 'wgScript' ) }`;
		this.page.mwEndPointUrl = new URL( this.page.mwEndPoint );

		if ( _local.specialPagesSearchRegExp.test( urlParts.title ) ) {
			// Get components from splitting url title
			this.page = $.extend( this.page, _utils.getSplitSpecialUrl( urlParts.title ) );
		} else if ( _local.specialPagesPathRegExp.test( urlParts.pathname ) ) {
			// Get components from splitting url pathname
			this.page = $.extend( this.page, _utils.getSplitSpecialUrl( urlParts.pathnameNormalized ) );
		} else {
			// Get components from url search parameters
			const components = [ 'title', 'curid', 'oldid', 'diff', 'direction' ];
			components.forEach( component => {
				this.page[ component ] = this.url.searchParams.get( component );
			} );

			// As a last resort, get the page title from url pathname
			if ( _utils.isEmpty( this.page.title ) && _local.articlePathRegExp.test( urlParts.pathname ) ) {
				this.page.title = urlParts.pathnameNormalized;
			}
		}

		// Check if parameter values following by pipeline
		if ( !_utils.isEmpty( this.page.diff ) && this.page.diff.indexOf( '|' ) > -1 ) {
			this.page.diff = this.page.diff.split( '|' ).shift();
		}
		if ( !_utils.isEmpty( this.page.oldid ) && this.page.oldid.indexOf( '|' ) > -1 ) {
			this.page.oldid = this.page.oldid.split( '|' ).shift();
		}
		if ( !_utils.isEmpty( this.page.curid ) && this.page.curid.indexOf( '|' ) > -1 ) {
			this.page.curid = this.page.curid.split( '|' ).shift();
		}

		// Validate components
		if ( [ 0, '0', 'current' ].includes( this.page.diff ) ) {
			this.page.diff = 'cur';
		}
		if ( !_utils.isValidDir( this.page.direction ) ) {
			this.page.direction = 'prev';
		}

		// Populate the page title from the watchlist line entry for edge cases
		// Link minifiers like [[:ru:User:Stjn/minilink.js]] often remove titles from links
		if ( _utils.isEmpty( this.page.title ) && this.mw.hasLine ) {
			this.page.title = this.mw.title;
		}

		// Validate page params
		this.page.isValid = this.validate();

		// Extend page object
		this.page = _utils.extendPage( this.page );

		switch ( this.options.behavior ) {
			// Render actions for the special links generated by MediaWiki
			case 'basic':
				this.renderBasic();
				break;

			// Add events on the existing link
			case 'event':
				this.renderManual();
				break;

			// Add the link node to the Intersection Observer to enable lazy data loading
			case 'default':
			default:
				this.renderRequest();
				break;
		}
	};

	Link.prototype.validate = function () {
		// Prepare a request for a revision
		if ( _utils.isValidID( this.page.oldid ) && _utils.isEmpty( this.page.diff ) ) {
			this.options.type = 'revision';
			return true;
		}

		// Request a compare by given ids
		if ( _utils.isValidID( this.page.diff ) || _utils.isValidID( this.page.oldid ) ) {
			this.options.type = 'diff';

			// Swap parameters if oldid is a direction and a title is empty
			if ( _utils.isEmpty( this.page.title ) && _utils.isValidDir( this.page.oldid ) ) {
				const dir = this.page.oldid;
				this.page.oldid = this.page.diff;
				this.page.diff = dir;
			}

			// Swap parameters if oldid is empty: special pages do not have a page title attribute
			if ( _utils.isEmpty( this.page.oldid ) ) {
				this.page.oldid = this.page.diff;
				this.page.diff = this.page.direction;
			}

			// Fix a tenet bug
			if (
				_utils.isValidID( this.page.oldid ) &&
				_utils.isValidID( this.page.diff ) &&
				parseInt( this.page.oldid ) > parseInt( this.page.diff )
			) {
				const diff = this.page.oldid;
				this.page.oldid = this.page.diff;
				this.page.diff = diff;
			}
			return true;
		}

		// Request a compare by given title and direction
		if ( !_utils.isEmpty( this.page.title ) && _utils.isValidDir( this.page.diff ) ) {
			this.options.type = 'diff';
			return true;
		}

		// Request a page by given curid
		if ( _utils.isValidID( this.page.curid ) ) {
			this.options.type = 'revision';
			return true;
		}

		return false;
	};

	/*** OBSERVER ***/

	Link.prototype.observe = function () {
		if ( this.isObserved ) return;
		this.isObserved = true;
		_local.observer.observe( this.node );
	};

	Link.prototype.unobserve = function () {
		if ( !this.isObserved ) return;
		this.isObserved = false;
		_local.observer.unobserve( this.node );
	};

	Link.prototype.onIntersect = function () {
		if ( this.isLoading || this.isLoaded || !this.isObserved ) return;
		this.unobserve();
		this.request();
	};

	/*** REQUESTS ***/

	Link.prototype.renderRequest = function () {
		this.hasRequest = this.page.isValid;

		if ( this.hasRequest ) {
			this.toggleSpinner( true );
			this.observe();
		} else {
			this.toggleSpinner( false );
			this.isLoaded = true;
			this.isProcessed = false;
			this.unobserve();
		}
	};

	Link.prototype.request = function () {
		switch ( this.options.type ) {
			case 'revision':
				this.requestRevision();
				break;

			case 'diff':
				this.requestDiff();
				break;
		}
	};

	/*** REQUEST REVISION ***/

	Link.prototype.requestRevision = function () {
		if ( this.isLoading ) return;

		this.isLoading = true;
		this.error = null;

		const params = {
			action: 'query',
			prop: 'revisions',
			rvprop: [ 'ids', 'timestamp', 'user', 'comment', 'content' ],
			rvslots: 'main',
			rvsection: 0,
			format: 'json',
			formatversion: 2,
			uselang: _local.language,
		};

		if ( !_utils.isEmpty( this.page.oldid ) ) {
			params.revids = this.page.oldid;
		} else if ( !_utils.isEmpty( this.page.curid ) ) {
			params.pageids = this.page.curid;
		}

		return _local.mwApi
			.get( params )
			.then( this.onRequestRevisionDone.bind( this ) )
			.fail( this.onRequestRevisionError.bind( this ) );
	};

	Link.prototype.onRequestRevisionError = function ( error, data ) {
		this.isLoading = false;

		this.error = {
			type: 'revision',
			code: !_utils.isEmpty( this.page.curid ) ? 'curid' : 'generic',
		};

		if ( data?.error ) {
			this.error.code = data.error.code;
			this.error.message = data.error.info;
		} else {
			this.error.message = error;
			_utils.notifyError( `error-revision-${ this.error.code }`, this.page, this.error, true );
		}

		this.renderError();
	};

	Link.prototype.onRequestRevisionDone = function ( data ) {
		this.isLoading = false;

		// Render error if the query request is completely failed
		const query = data?.query;
		if ( !query || ( !query.badrevids && !query.badpageids && !query.pages ) ) {
			return this.onRequestRevisionError( null, data );
		}

		// Get a page for the query request
		const page = query.pages?.[ 0 ];
		const revision = page?.revisions?.[ 0 ];

		// Check for a specific error code
		const error = { type: 'revision' };
		if ( query.badrevids ) {
			error.code = 'badrevids';
		} else if ( query.badpageids ) {
			error.code = 'badpageids';
		} else if ( !page || page.missing || !revision ) {
			error.code = 'missing';
		} else if ( page.invalid ) {
			error.code = 'invalid';
			error.info = page.invalidreason;
		}

		// Render error if exist
		if ( error.code ) {
			this.error = error;
			return this.renderError();
		}

		this.revision = revision;
		this.page.isHidden = _utils.isRevisionHidden( this.revision );
		this.page = _utils.extendPage( this.page, {
			title: page.title,
			section: _utils.getRevisionSection( this.revision ),
		} );

		this.renderSuccess();
	};

	/*** REQUEST DIFF ***/

	Link.prototype.requestDiff = function () {
		if ( this.isLoading ) return;

		this.isLoading = true;
		this.error = null;

		const params = {
			action: 'compare',
			prop: [ 'title', 'ids', 'timestamp', 'user', 'comment' ],
			fromrev: _utils.isValidID( this.page.oldid ) ? this.page.oldid : undefined,
			fromtitle: !_utils.isEmpty( this.page.title ) ? this.page.title : undefined,
			torev: _utils.isValidID( this.page.diff ) ? this.page.diff : undefined,
			torelative: _utils.isValidDir( this.page.diff ) ? this.page.diff : undefined,
			format: 'json',
			formatversion: 2,
			uselang: _local.language,
		};
		return _local.mwApi
			.get( params )
			.then( this.onRequestDiffDone.bind( this ) )
			.fail( this.onRequestDiffError.bind( this ) );
	};

	Link.prototype.onRequestDiffError = function ( error, data ) {
		this.isLoading = false;

		this.error = {
			type: 'diff',
		};

		if ( data?.error ) {
			this.error.code = data.error.code;
			this.error.message = data.error.info;
		} else {
			this.error.message = error;
			_utils.notifyError( 'error-diff-generic', this.page, this.error, true );
		}

		this.renderError();
	};

	Link.prototype.onRequestDiffDone = function ( data ) {
		this.isLoading = false;

		// Render error if the compare request is completely failed
		this.compare = data?.compare;
		if ( !this.compare ) {
			return this.onRequestDiffError( null, data );
		}

		this.page.isHidden = _utils.isCompareHidden( this.compare );
		this.page = _utils.extendPage( this.page, {
			title: _utils.getCompareTitle( this.compare ),
			section: _utils.getCompareSection( this.compare ),
		} );

		this.renderSuccess();
	};

	/*** RENDER ***/

	Link.prototype.renderManual = function () {
		if ( _utils.isEmpty( this.page.diff ) && _utils.isEmpty( this.page.oldid ) && _utils.isEmpty( this.page.curid ) ) return;

		this.isLoaded = true;
		this.isProcessed = true;

		this.action.button = new Button( {
			node: this.node,
			handler: this.openDialog.bind( this ),
			ariaHaspopup: true,
		} );

		mw.hook( `${ _config.prefix }.link.renderSuccess` ).fire( this );
	};

	Link.prototype.renderBasic = function () {
		if ( _utils.isEmpty( this.page.diff ) && _utils.isEmpty( this.page.oldid ) && _utils.isEmpty( this.page.curid ) ) return;
		if ( this.mw.isDiffOnly && this.options.type !== 'diff' ) return;

		this.isLoaded = true;
		this.isProcessed = true;

		this.renderSuccess();
	};

	Link.prototype.renderError = function () {
		this.isLoaded = true;
		this.toggleSpinner( false );

		// Render panel structure
		this.renderWrapper();

		let messageName;
		if ( this.error.type ) {
			messageName = [ 'error', this.error.type, this.error.code || 'generic' ].join( '-' );
			if ( !_utils.isMessageExists( messageName ) ) {
				messageName = [ 'error', this.error.type, 'generic' || 'generic' ].join( '-' );
			}
		}
		const message = _utils.getErrorMessage( messageName, this.page, this.error );

		this.nodes.error = document.createElement( 'span' );
		this.nodes.error.innerText = _utils.getLabel( 'error' );
		this.nodes.error.title = message;
		this.nodes.error.classList.add.apply( this.nodes.error.classList, [ 'item', 'error', 'error-info' ] );
		this.nodes.inner.appendChild( this.nodes.error );

		this.embed( this.node, 'insertAfter' );
		mw.hook( `${ _config.prefix }.link.renderError` ).fire( this );
	};

	Link.prototype.renderSuccess = function () {
		this.isLoaded = true;
		this.isProcessed = true;
		this.toggleSpinner( false );

		// Render panel structure and action links
		this.renderWrapper();

		if ( this.mw.hasLink || this.revision || this.compare ) {
			if ( this.options.type === 'revision' ) {
				this.renderRevisionAction();
			} else {
				this.renderDiffAction();
			}
		}
		if ( this.config.showPageLink ) {
			this.renderPageAction();
		}

		this.embed( this.node, this.options.insertMethod );
		mw.hook( `${ _config.prefix }.link.renderSuccess` ).fire( this );
	};

	Link.prototype.renderWrapper = function () {
		this.nodes.container = this.nodes.inner = document.createElement( 'span' );
		this.nodes.container.classList.add.apply( this.nodes.container.classList, [ 'instantDiffs-panel', 'nowrap', 'noprint' ] );
	};

	Link.prototype.renderAction = function ( params ) {
		params = $.extend( {
			tag: 'a',
			label: null,
			title: null,
			href: null,
			target: _utils.getTarget( this.options.initiatorDialog ),
			handler: null,
			classes: [],
			modifiers: [],
			container: this.nodes.inner,
		}, params );

		params.classes = [ 'item', 'text', 'instantDiffs-action', ...params.classes ];
		params.modifiers.forEach( modifier => params.classes.push( `instantDiffs-action--${ modifier }` ) );

		return new Button( params );
	};

	Link.prototype.renderRevisionAction = function () {
		// Indicate hidden revisions for sysops
		let message = 'revision-title';
		if ( this.page.isHidden ) {
			this.action.hasError = true;
			message = `${ message }-admin`;
		}

		// Render new link or mutate current
		if ( _utils.defaults( 'showLink' ) ) {
			this.renderLinkAction( message );
		} else {
			this.mutateLinkAction( message );
		}
	};

	Link.prototype.renderDiffAction = function () {
		// Indicate hidden revisions for sysops
		let message = 'diff-title';
		if ( this.page.isHidden ) {
			this.action.hasError = true;
			message = `${ message }-admin`;
		}

		// Render new link or mutate current
		if ( _utils.defaults( 'showLink' ) ) {
			this.renderLinkAction( message );
		} else {
			this.mutateLinkAction( message );
		}
	};

	Link.prototype.renderLinkAction = function ( message ) {
		const classes = [];
		if ( this.action.hasError ) {
			classes.push( 'error', 'error-admin' );
		}

		this.action.button = this.renderAction( {
			label: _utils.getLabel( this.options.type ),
			title: _utils.msg( message ),
			classes: classes,
			modifiers: [ this.options.type ],
			handler: this.openDialog.bind( this ),
			ariaHaspopup: true,
		} );
	};

	Link.prototype.mutateLinkAction = function ( message ) {
		const classes = [ 'instantDiffs-link', `instantDiffs-link--${ this.options.type }`, `is-${ this.options.insertMethod }` ];
		if ( this.action.hasError ) {
			classes.push( 'instantDiffs-link--error' );
		}

		this.node.classList.remove( 'external' );
		this.node.classList.add( ...classes );
		this.node.setAttribute( 'data-instantdiffs-link', this.options.behavior );

		this.action.button = new Button( {
			node: this.node,
			handler: this.openDialog.bind( this ),
			ariaHaspopup: true,
			altTitle: _utils.msg( message ),
			useAltKey: true,
		} );
	};

	Link.prototype.renderPageAction = function () {
		this.page.button = this.renderAction( {
			label: _utils.getLabel( 'page' ),
			title: this.page.titleTextSection || this.page.titleText,
			href: this.page.href,
			modifiers: [ 'page' ],
		} );
	};

	/*** DIALOG ***/

	Link.prototype.openDialog = function () {
		if ( _local.dialog && _local.dialog.isLoading ) return;

		if ( !_local.dialog ) {
			_local.dialog = new Dialog();
		}
		_local.dialog.process( this, {
			initiatorDiff: this.options.initiatorDiff,
			onOpen: this.onDialogOpen.bind( this ),
			onClose: this.onDialogClose.bind( this ),
		} );

		this.toggleLoader( true );
		$.when( _local.dialog.load() ).always( () => this.toggleLoader( false ) );
	};

	Link.prototype.onDialogOpen = function () {
		if ( this.mw.hasLine && this.config.highlightLine ) {
			this.mw.$line.addClass( 'instantDiffs-line--highlight' );
		}

		if ( _utils.isFunction( this.options.onOpen ) ) {
			this.options.onOpen( this );
		}

		if ( this.options.initiatorLink instanceof Link ) {
			this.options.initiatorLink.onDialogOpen();
		}
	};

	Link.prototype.onDialogClose = function () {
		if ( this.mw.hasLine ) {
			if ( this.config.highlightLine ) {
				this.mw.$line.removeClass( 'instantDiffs-line--highlight' );
			}
			if (
				this.config.markWatchedLine &&
				_config.changeLists.includes( mw.config.get( 'wgCanonicalSpecialPageName' ) )
			) {
				this.mw.$line
					.removeClass( _config.mwLine.unseen )
					.addClass( _config.mwLine.seen );
			}
		}

		if ( _utils.isFunction( this.options.onClose ) ) {
			this.options.onClose( this );
		}

		if ( this.options.initiatorLink instanceof Link ) {
			this.options.initiatorLink.onDialogClose();
		}
	};

	/*** ACTIONS ***/

	Link.prototype.toggleLoader = function ( value ) {
		if ( this.action.button ) {
			this.action.button.pending( value );
		} else {
			this.node.classList.toggle( 'instantDiffs-link--pending', value );
		}
	};

	Link.prototype.toggleSpinner = function ( value ) {
		const classes = _utils.getPlaceholderClasses( [ 'loader', this.options.type ] );

		if ( value ) {
			this.node.classList.add( ...classes );
		} else {
			this.node.classList.remove( ...classes );
		}
	};

	Link.prototype.embed = function ( container, insertMethod ) {
		_utils.embedElement( this.nodes.container, container, insertMethod );
	};

	Link.prototype.getContainer = function () {
		return this.nodes.container;
	};

	Link.prototype.getNode = function () {
		return this.node;
	};

	Link.prototype.getInitiatorLink = function () {
		return this.options.initiatorLink || this;
	};

	Link.prototype.getPage = function () {
		return this.page;
	};

	Link.prototype.getRevision = function () {
		return this.revision;
	};

	Link.prototype.getCompare = function () {
		return this.compare;
	};

	/******* DIFF CONSTRUCTOR *******/

	function Diff( page, options ) {
		this.page = $.extend( {
			title: null,
			section: null,
			oldid: null,
			diff: null,
			curid: null,
			direction: null,
		}, page );

		this.options = $.extend( true, {
			type: 'diff',
			initiatorDiff: null,
			initiatorDialog: null,
		}, options );

		this.pageParams = {
			action: 'render',
			diffonly: this.options.type === 'diff' ? 1 : 0,
			unhide: _utils.defaults( 'unHideDiffs' ) ? 1 : 0,
			uselang: _local.language,
		};

		this.mwConfg = {
			'thanks-confirmation-required': true,
			wgDiffOldId: null,
			wgDiffNewId: null,
		};

		this.nodes = {};
		this.buttons = {};
		this.links = {};
		this.isLoading = false;

		// Validate page object
		if ( [ 0, '0', 'current' ].includes( this.page.diff ) ) {
			this.page.diff = 'cur';
		}
		if ( !_utils.isValidDir( this.page.direction ) ) {
			this.page.direction = 'prev';
		}
		this.page = _utils.extendPage( this.page );
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
			format: 'json',
			formatversion: 2,
			uselang: _local.language,
		};

		if ( !_utils.isEmpty( this.page.oldid ) ) {
			params.oldid = this.page.oldid;
		} else if ( !_utils.isEmpty( this.page.curid ) ) {
			params.pageid = this.page.curid;
		}

		return _local.mwApi
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
		_utils.notifyError( 'error-dependencies-parse', this.page, params, true );
	};

	Diff.prototype.onRequestPageDependenciesDone = function ( data ) {
		// Render error if the parse request is completely failed
		const parse = data?.parse;
		if ( !parse ) {
			return this.onRequestPageDependenciesError( null, data );
		}

		mw.loader.load( parse.modules );
		mw.loader.load( parse.modulestyles );
		mw.loader.load( parse.modulescripts );
		mw.config.set( parse.jsconfigvars );
	};

	Diff.prototype.request = function () {
		this.isLoading = true;
		this.error = null;

		const page = {
			title: !_utils.isEmpty( this.page.title ) ? this.page.title : undefined,
			diff: !_utils.isEmpty( this.page.diff ) ? this.page.diff : this.page.direction,
			oldid: !_utils.isEmpty( this.page.oldid ) ? this.page.oldid : undefined,
			curid: !_utils.isEmpty( this.page.curid ) ? this.page.curid : undefined,
		};

		const params = {
			url: _local.mwEndPoint,
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
			code: this.options.type === 'revision' && !_utils.isEmpty( this.page.curid ) ? 'curid' : 'generic',
		};

		if ( data?.error ) {
			this.error.code = data.error.code;
			this.error.message = data.error.info;
		}
		_utils.notifyError( `error-${ this.error.type }-${ this.error.code }`, this.page, this.error );

		this.render();
		mw.hook( `${ _config.prefix }.diff.renderError` ).fire( this );
		mw.hook( `${ _config.prefix }.diff.renderComplete` ).fire( this );
	};

	Diff.prototype.onRequestDone = function ( data ) {
		this.isLoading = false;
		this.data = data;

		if ( !this.data ) {
			return this.onRequestError();
		}

		this.render();
		mw.hook( `${ _config.prefix }.diff.renderSuccess` ).fire( this );
		mw.hook( `${ _config.prefix }.diff.renderComplete` ).fire( this );
	};

	/*** RENDER ***/

	Diff.prototype.render = function () {
		const classes = [ 'instantDiffs-dialog-content', 'mw-body-content', `mw-content-${ document.dir }` ];
		const skinClasses = _config.skinBodyClasses[ mw.config.get( 'skin' ) ];
		if ( skinClasses ) {
			classes.push( ...skinClasses );
		}

		this.nodes.$container = $( '<div>' )
			.attr( 'dir', document.dir )
			.addClass( classes );

		if ( this.error ) {
			this.renderError();
		} else {
			this.renderContent();
		}

		this.renderNavigation();
	};

	Diff.prototype.renderContent = function () {
		this.nodes.data = $.parseHTML( this.data );
		this.nodes.$data = $( this.nodes.data );

		// Collect missing data from the diff table
		this.collectDataFromTable();

		// Content warnings
		this.nodes.$data
			.filter( '.cdx-message ' )
			.appendTo( this.nodes.$container );
		this.nodes.$data
			.find( '.cdx-message ' )
			.appendTo( this.nodes.$container );

		// Render a warning when revision was not found
		this.nodes.$emptyMessage = this.nodes.$data.filter( 'p' );
		if ( this.nodes.$emptyMessage.length > 0 ) {
			this.renderEmptyMessage();
		}

		// Flagged Revisions
		this.nodes.$frNotice = this.nodes.$data
			.filter( '#mw-fr-revisiontag-old' )
			.appendTo( this.nodes.$container );

		// Revision Table
		if ( this.options.type === 'diff' ) {
			this.renderDiffTable();
		}

		// Parsed page content
		this.nodes.$pageContent = this.nodes.$data.filter( '.mw-parser-output' );
		if ( this.nodes.$pageContent.length > 0 ) {
			this.nodes.$data
				.filter( '.diff-currentversion-title' )
				.appendTo( this.nodes.$container );
			this.nodes.$pageContent
				.appendTo( this.nodes.$container );
		}

		// Set additional config variables
		mw.config.set( this.mwConfg );
	};

	Diff.prototype.renderDiffTable = function () {
		this.nodes.$frDiff = this.nodes.$data
			.filter( '#mw-fr-diff-headeritems' )
			.appendTo( this.nodes.$container );

		// All unpatrolled diffs link
		this.nodes.$diffToStableLink = this.nodes.$frDiff
			.find( '.fr-diff-to-stable a' )
			.detach();

		// Diff table
		this.nodes.$table = this.nodes.$data
			.filter( 'table.diff' )
			.appendTo( this.nodes.$container );

		// Request next / previous diff using ajax
		this.nodes.$prevLink = this.nodes.$table
			.find( '#differences-prevlink' )
			.detach();

		this.nodes.$nextLink = this.nodes.$table
			.find( '#differences-nextlink' )
			.detach();

		// Clear whitespaces
		const leftTitle4 = this.nodes.$table.find( '#mw-diff-otitle4' );
		if ( leftTitle4.length > 0 ) {
			leftTitle4.text( leftTitle4.text().trim() );
		}
		const rightTitle4 = this.nodes.$table.find( '#mw-diff-ntitle4' );
		if ( rightTitle4.length > 0 ) {
			rightTitle4.text( rightTitle4.text().trim() );
		}
	};

	Diff.prototype.renderError = function () {
		this.nodes.$emptyMessage = $( `<p>${ _utils.msg( 'error-revision-missing' ) }</p>` );
		if ( this.error?.message ) {
			this.nodes.$emptyMessage.add( `<p>${ this.error.message }</p>` );
		}
		this.renderEmptyMessage();
	};

	Diff.prototype.renderEmptyMessage = function () {
		this.nodes.$emptyWarning = $( '<div>' )
			.addClass( [ 'cdx-message', 'cdx-message--block', 'cdx-message--warning', 'plainlinks' ] )
			.appendTo( this.nodes.$container );

		this.nodes.$emptyWarningContent = $( '<div>' )
			.addClass( [ 'cdx-message__content' ] )
			.append( this.nodes.$emptyMessage )
			.appendTo( this.nodes.$emptyWarning );
	};

	Diff.prototype.collectDataFromTable = function () {
		const $fromLinks = this.nodes.$data.find( '#mw-diff-otitle1 strong > a, #mw-diff-otitle4 > a' );
		const $toLinks = this.nodes.$data.find( '#mw-diff-ntitle1 strong > a, #mw-diff-ntitle4 > a' );

		// Get diff and oldid
		if ( $fromLinks.length > 0 && $toLinks.length > 0 ) {
			const oldid = _utils.getOldidFromUrl( $fromLinks.prop( 'href' ) );
			const diff = _utils.getOldidFromUrl( $toLinks.prop( 'href' ) );
			if ( _utils.isValidID( oldid ) && _utils.isValidID( diff ) ) {
				this.mwConfg.wgDiffOldId = oldid;
				this.mwConfg.wgDiffNewId = diff;
				this.mwConfg.wgRevisionId = diff;
			}
		}

		// Get page title
		const $links = $toLinks.add( $fromLinks );
		if ( _utils.isEmpty( this.page.title ) && $links.length > 0 ) {
			const title = _utils.getTitleFromUrl( $links.prop( 'href' ) );
			this.page = _utils.extendPage( this.page, { title } );
		}

		// Populate diff id value
		if ( this.page.diff === 'cur' && $toLinks.length > 0 ) {
			const diff = _utils.getOldidFromUrl( $toLinks.prop( 'href' ) );
			if ( _utils.isValidID( diff ) ) {
				this.page.diff = diff;
			}
		}

		// Populate section name
		const $toSectionLinks = this.nodes.$data.find( '#mw-diff-ntitle3 .autocomment a' );
		if ( _utils.isEmpty( this.page.section ) && $toSectionLinks.length > 0 ) {
			const section = _utils.getHashFromUrl( $toSectionLinks.prop( 'href' ) );
			this.page = _utils.extendPage( this.page, { section } );
		}
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

		this.renderNavigationLinks();
		this.renderNavigationMainLinks();
		this.renderNavigationMenuLinks();
	};

	Diff.prototype.renderNavigationLinks = function () {
		const items = [];

		if ( _local.snapshot.getLength() > 1 && _local.snapshot.getIndex() !== -1 ) {
			// Previous link on the page
			const previousLink = _local.snapshot.getPreviousLink();
			this.buttons.snapshotBack = new OO.ui.ButtonWidget( {
				label: _utils.msg( 'goto-snapshot-prev' ),
				title: _utils.msg( 'goto-snapshot-prev' ),
				invisibleLabel: true,
				icon: 'doubleChevronStart',
				href: previousLink ? _utils.getDiffHref( previousLink.getPage() ) : null,
				target: _utils.getTarget( true ),
				disabled: !previousLink,
			} );
			if ( previousLink ) {
				this.links.snapshotBack = new Link( this.buttons.snapshotBack.$button.get( 0 ), {
					behavior: 'event',
					initiatorLink: previousLink,
				} );
			}
			items.push( this.buttons.snapshotBack );

			// Next link on the page
			const nextLink = _local.snapshot.getNextLink();
			this.buttons.snapshotNext = new OO.ui.ButtonWidget( {
				label: _utils.msg( 'goto-snapshot-next' ),
				title: _utils.msg( 'goto-snapshot-next' ),
				invisibleLabel: true,
				icon: 'doubleChevronEnd',
				href: nextLink ? _utils.getDiffHref( nextLink.getPage() ) : null,
				target: _utils.getTarget( true ),
				disabled: !nextLink,
			} );
			if ( nextLink ) {
				this.links.snapshotNext = new Link( this.buttons.snapshotNext.$button.get( 0 ), {
					behavior: 'event',
					initiatorLink: nextLink,
				} );
			}
			items.push( this.buttons.snapshotNext );
		}

		if ( this.options.initiatorDiff ) {
			this.renderNavigationBackLink();
			items.push( this.buttons.initiatorDiff );
		}

		this.buttons.linksGroup = new OO.ui.ButtonGroupWidget( {
			items: items,
		} );
		this.nodes.$navigationLeft.append( this.buttons.linksGroup.$element );
	};

	Diff.prototype.renderNavigationBackLink = function () {
		this.buttons.initiatorDiff = new OO.ui.ButtonWidget( {
			label: _utils.msg( `goto-back-${ this.options.initiatorDiff.options.type }` ),
			icon: 'newline',
			href: _utils.getDiffHref( this.options.initiatorDiff.getPage(), this.options.initiatorDiff.getPageParams() ),
			target: _utils.getTarget( true ),
		} );
		this.links.initiatorDiff = new Link( this.buttons.initiatorDiff.$button.get( 0 ), {
			behavior: 'event',
		} );
	};

	Diff.prototype.renderNavigationMainLinks = function () {
		const items = [];

		if ( this.options.type === 'revision' ) {
			// Link to the revisions diff
			this.renderNavigationDiffLink();
			items.push( this.buttons.diff );
		} else {
			// Link to the previous diff
			const hasPrevLink = this.nodes.$prevLink && this.nodes.$prevLink.length;
			this.buttons.prev = new OO.ui.ButtonWidget( {
				label: [ ( document.dir === 'ltr' ? '←' : '→' ), _utils.msg( 'goto-prev-diff' ) ].join( ' ' ),
				href: hasPrevLink ? this.nodes.$prevLink.attr( 'href' ) : null,
				target: _utils.getTarget( true ),
				disabled: !hasPrevLink,
			} );
			if ( hasPrevLink ) {
				this.links.prev = new Link( this.buttons.prev.$button.get( 0 ), {
					behavior: 'event',
				} );
			}
			items.push( this.buttons.prev );

			// Link to all unpatrolled changes
			if ( this.nodes.$diffToStableLink && this.nodes.$diffToStableLink.length > 0 ) {
				this.buttons.diffToStable = new OO.ui.ButtonWidget( {
					label: this.nodes.$diffToStableLink.text(),
					href: this.nodes.$diffToStableLink.attr( 'href' ),
					target: _utils.getTarget( true ),
				} );
				this.links.diffToStable = new Link( this.buttons.diffToStable.$button.get( 0 ), {
					behavior: 'event',
					initiatorDiff: this,
				} );
				items.push( this.buttons.diffToStable );
			}

			// Link to the next diff
			const hasNextLink = this.nodes.$nextLink && this.nodes.$nextLink.length > 0;
			this.buttons.next = new OO.ui.ButtonWidget( {
				label: [ _utils.msg( 'goto-next-diff' ), ( document.dir === 'ltr' ? '→' : '←' ) ].join( ' ' ),
				href: hasNextLink ? this.nodes.$nextLink.attr( 'href' ) : null,
				target: _utils.getTarget( true ),
				disabled: !hasNextLink,
			} );
			if ( hasNextLink ) {
				this.links.next = new Link( this.buttons.next.$button.get( 0 ), {
					behavior: 'event',
				} );
			}
			items.push( this.buttons.next );
		}

		this.buttons.mainLinksGroup = new OO.ui.ButtonGroupWidget( {
			items: items,
		} );
		this.nodes.$navigationCenter.append( this.buttons.mainLinksGroup.$element );
	};

	Diff.prototype.renderNavigationDiffLink = function () {
		const page = $.extend( {}, this.page, { diff: 'prev' } );

		this.buttons.diff = new OO.ui.ButtonWidget( {
			label: _utils.msg( 'goto-view-diff' ),
			href: _utils.getDiffHref( page, this.pageParams ),
			target: _utils.getTarget( true ),
		} );
		this.links.diff = new Link( this.buttons.diff.$button.get( 0 ), {
			behavior: 'event',
			initiatorDiff: this,
		} );
	};

	Diff.prototype.renderNavigationMenuLinks = function () {
		const items = [];

		// Copy a link to the clipboard
		this.buttons.linkCopy = new OO.ui.ButtonWidget( {
			label: _utils.msg( 'copy-link' ),
			framed: false,
			classes: [ 'instantDiffs-button--link' ],
		} );
		this.buttons.linkCopyHelper = new Button( {
			node: this.buttons.linkCopy.$button.get( 0 ),
			handler: this.actionCopyLink.bind( this ),
		} );
		items.push( this.buttons.linkCopy );

		// Copy a wikilink to the clipboard
		this.buttons.wikilinkCopy = new OO.ui.ButtonWidget( {
			label: _utils.msg( 'copy-wikilink' ),
			framed: false,
			classes: [ 'instantDiffs-button--link' ],
		} );
		this.buttons.wikilinkCopyHelper = new Button( {
			node: this.buttons.wikilinkCopy.$button.get( 0 ),
			handler: this.actionCopyWikilink.bind( this ),
		} );
		items.push( this.buttons.wikilinkCopy );

		// Link to the revision or to the edit
		if ( this.options.type === 'revision' ) {
			this.buttons.linkRevision = new OO.ui.ButtonWidget( {
				label: _utils.msg( 'goto-revision' ),
				href: _utils.getRevisionHref( this.page ),
				target: _utils.getTarget( true ),
				framed: false,
				classes: [ 'instantDiffs-button--link' ],
			} );
			items.push( this.buttons.linkRevision );
		} else {
			this.buttons.linkEdit = new OO.ui.ButtonWidget( {
				label: _utils.msg( 'goto-edit' ),
				href: _utils.getDiffHref( this.page ),
				target: _utils.getTarget( true ),
				framed: false,
				classes: [ 'instantDiffs-button--link' ],
			} );
			items.push( this.buttons.linkEdit );
		}

		if ( !_utils.isEmpty( this.page.title ) ) {
			// Link to the page
			this.buttons.linkPage = new OO.ui.ButtonWidget( {
				label: _utils.msg( 'goto-page' ),
				href: this.page.href,
				target: _utils.getTarget( true ),
				framed: false,
				classes: [ 'instantDiffs-button--link' ],
			} );
			items.push( this.buttons.linkPage );

			// Link to the history
			this.buttons.linkHistory = new OO.ui.ButtonWidget( {
				label: _utils.msg( 'goto-history' ),
				href: mw.util.getUrl( this.page.title, { action: 'history' } ),
				target: _utils.getTarget( true ),
				framed: false,
				classes: [ 'instantDiffs-button--link' ],
			} );
			items.push( this.buttons.linkHistory );

			// Link to the talk page
			if ( !this.page.mwTitle.isTalkPage() ) {
				this.buttons.linkTalkPage = new OO.ui.ButtonWidget( {
					label: _utils.msg( 'goto-talkpage' ),
					href: this.page.mwTitle.getTalkPage().getUrl(),
					target: _utils.getTarget( true ),
					framed: false,
					classes: [ 'instantDiffs-button--link' ],
				} );
				items.push( this.buttons.linkTalkPage );
			}
		}

		// Open Instant Diffs settings
		this.buttons.linkSettings = new OO.ui.ButtonWidget( {
			label: _utils.msg( 'goto-settings' ),
			framed: false,
			classes: [ 'instantDiffs-button--link' ],
		} );
		this.buttons.linkSettingsHelper = new Button( {
			node: this.buttons.linkSettings.$button.get( 0 ),
			handler: this.actionOpenSettings.bind( this ),
		} );
		items.push( this.buttons.linkSettings );

		// Separator
		items.push( _utils.renderOoUiElement( $( '<hr>' ) ) );

		// Link to the Instant Diffs docs and current running version
		const linkIdLabel = $( `
			<span class="name">${ _utils.msg( 'name' ) }</span>
			<span class="version">v.${ _config.version }</span>
		` );
		this.buttons.linkID = new OO.ui.ButtonWidget( {
			label: linkIdLabel,
			href: _utils.getOrigin( `/wiki/${ _config.link }` ),
			target: _utils.getTarget( true ),
			framed: false,
			classes: [ 'instantDiffs-button--link', 'instantDiffs-button--link-id' ],
		} );
		items.push( this.buttons.linkID );

		// Render menu group
		this.buttons.menuLinksGroup = new OO.ui.ButtonGroupWidget( {
			items: items,
			classes: [ 'instantDiffs-group--vertical' ],
		} );
		this.buttons.menuDropdown = new OO.ui.PopupButtonWidget( {
			icon: 'menu',
			label: _utils.msg( 'goto-links' ),
			title: _utils.msg( 'goto-links' ),
			invisibleLabel: true,
			popup: {
				$content: this.buttons.menuLinksGroup.$element,
				width: 'auto',
				padded: false,
				anchor: false,
				align: 'backwards',
			},
		} );
		this.nodes.$navigationRight.append( this.buttons.menuDropdown.$element );
	};

	/*** ACTIONS ***/

	Diff.prototype.actionCopyLink = function () {
		// Hide menu dropdown
		this.buttons.menuDropdown.getPopup().toggle( false );

		const params = {
			minify: _utils.defaults( 'linksFormat' ) === 'minify',
			relative: false,
		};
		const href = this.options.type === 'revision'
			? _utils.getRevisionHref( this.page, {}, params )
			: _utils.getDiffHref( this.page, {}, params );

		// Copy href to the clipboard
		_utils.clipboardWrite( href );
	};

	Diff.prototype.actionCopyWikilink = function () {
		// Hide menu dropdown
		this.buttons.menuDropdown.getPopup().toggle( false );

		const params = {
			wikilink: true,
			wikilinkPreset: _utils.defaults( 'wikilinksFormat' ),
			minify: _utils.defaults( 'linksFormat' ) === 'minify',
			relative: false,
		};
		const href = this.options.type === 'revision'
			? _utils.getRevisionHref( this.page, {}, params )
			: _utils.getDiffHref( this.page, {}, params );

		// Copy href to the clipboard
		_utils.clipboardWrite( href );
	};

	Diff.prototype.actionOpenSettings = function () {
		if ( _local.settings && _local.settings.isLoading ) return;

		if ( !_local.settings ) {
			_local.settings = new Settings();
		}
		_local.settings.process( {
			onOpen: this.onSettingsOpen.bind( this ),
			onClose: this.onSettingsClose.bind( this ),
		} );

		this.buttons.linkSettingsHelper.pending( true );
		$.when( _local.settings.load() ).always( () => this.buttons.linkSettingsHelper.pending( false ) );
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
		if ( !_utils.defaults( 'openInNewTab' ) ) return;
		const $links = this.nodes.$container.find( 'a:not(.mw-thanks-thank-link, .jquery-confirmable-element)' );
		$links.each( ( i, node ) => node.setAttribute( 'target', '_blank' ) );
	};

	Diff.prototype.updateSize = function ( params ) {
		params = $.extend( {
			top: 0,
		}, params );
		this.nodes.$navigation.toggleClass( 'is-sticky', params.top > 0 );
	};

	Diff.prototype.getPage = function () {
		return this.page;
	};

	Diff.prototype.getPageTitleText = function () {
		return ( this.error || _utils.isEmpty( this.page.title ) ) ? _utils.msg( 'error-revision-missing' ) : this.page.titleText;
	};

	Diff.prototype.getPageParams = function () {
		return this.pageParams;
	};

	Diff.prototype.getContainer = function () {
		return this.nodes.$container;
	};

	Diff.prototype.detach = function () {
		mw.hook( `${ _config.prefix }.diff.beforeDetach` ).fire( this );
		this.nodes.$container.detach();
	};

	/******* DIALOG CONSTRUCTOR *******/

	function Dialog() {
		this.isDependenciesLoaded = false;
		this.isConstructed = false;
		this.isOpen = false;
		this.isLoading = false;

		this.nodes = {};
		this.options = {};
		this.opener = {
			link: null,
			options: {},
		};
		this.initiator = {
			link: null,
			options: {},
		};
		this.previousInitiator = {
			link: null,
			options: {},
		};

		this.link = null;
		this.diff = null;
		this.mwConfigBackup = null;
	}

	Dialog.prototype.process = function ( link, options ) {
		this.link = link;
		this.options = $.extend( true, {
			initiatorDiff: null,
			onOpen: function () {},
			onClose: function () {},
		}, options );

		if ( !this.isOpen ) {
			this.opener.link = this.link;
			this.opener.options = $.extend( true, {}, this.options );

			// Get a new snapshot of the links to properly calculate indexes for navigation between them
			_local.snapshot = new Snapshot();
		}

		if ( this.link instanceof Link ) {
			const initiatorLink = this.link.getInitiatorLink();
			if ( _local.snapshot.hasLink( initiatorLink ) ) {
				this.previousInitiator = $.extend( true, {}, this.initiator );
				this.initiator.link = initiatorLink;
				this.initiator.options = $.extend( true, {}, this.options );

				// Set only the initiator links for the current point of navigation
				_local.snapshot.setLink( this.initiator.link );
			}
		}
	};

	Dialog.prototype.load = function () {
		if ( this.isLoading ) return;

		if ( this.isDependenciesLoaded ) {
			return this.request();
		}

		this.isLoading = true;
		this.error = null;

		return $.when( mw.loader.using( this.getDependencies() ) )
			.then( this.onLoadSuccess.bind( this ) )
			.fail( this.onLoadError.bind( this ) );
	};

	Dialog.prototype.getDependencies = function () {
		return _config.dependencies.dialog.concat(
			_utils.getDependencies( _config.dependencies.content ),
		);
	};

	Dialog.prototype.onLoadError = function ( error ) {
		this.isLoading = false;
		this.isDependenciesLoaded = false;
		this.error = {
			type: 'dependencies',
			message: error && error.message ? error.message : null,
		};
		_utils.notifyError( 'error-dependencies-generic', null, this.error );
	};

	Dialog.prototype.onLoadSuccess = function () {
		this.isLoading = false;
		this.isDependenciesLoaded = true;
		return this.request();
	};

	Dialog.prototype.construct = function () {
		const that = this;
		this.isConstructed = true;

		// Define custom dialog width
		// ToDo: find or suggest more elegant solution
		OO.ui.WindowManager.static.sizes.instantDiffs = {
			width: 1200,
		};

		// Construct a custom MessageDialog
		this.MessageDialog = function () {
			that.MessageDialog.super.call( this, {
				classes: [ 'instantDiffs-dialog' ],
			} );
		};
		OO.inheritClass( this.MessageDialog, OO.ui.MessageDialog );

		this.MessageDialog.static.name = 'Instant Diffs Dialog';
		this.MessageDialog.static.size = 'instantDiffs';
		this.MessageDialog.static.actions = [
			{
				action: 'close',
				label: _utils.msg( 'close' ),
			},
		];

		this.MessageDialog.prototype.initialize = function () {
			// Parent method
			that.MessageDialog.super.prototype.initialize.apply( this, arguments );

			// Close the dialog by clicking on the overlay
			this.$overlay.on( 'click', this.close.bind( this ) );

			// Set content scroll events.
			// FixMe: maybe we need to use a promise like in WindowManager?
			this.container.$element.on( 'scroll', that.onScroll.bind( that ) );
		};

		this.MessageDialog.prototype.getSetupProcess = function ( data ) {
			data = data || {};

			// Parent method
			return that.MessageDialog.super.prototype.getSetupProcess.call( this, data )
				.next( function () {
					// Close the dialog on click by overlay
					this.$overlay.on( 'click', this.close.bind( this ) );

					// Label click workaround
					this.appendHiddenInput();

					// Set a vertical scroll position to the top of the content
					this.container.$element.scrollTop( 0 );
				}, this );
		};

		this.MessageDialog.prototype.getUpdateProcess = function ( data ) {
			data = data || {};

			return new OO.ui.Process()
				.next( function () {
					this.title.setLabel(
						data.title !== undefined ? data.title : this.constructor.static.title,
					);
					this.message.setLabel(
						data.message !== undefined ? data.message : this.constructor.static.message,
					);

					// Label click workaround
					this.appendHiddenInput();

					// Set focus on the dialog to restore emitting close event by pressing esc key
					this.focus();

					// Set a vertical scroll position to the top of the content
					this.container.$element.scrollTop( 0 );
				}, this );
		};

		this.MessageDialog.prototype.update = function ( data ) {
			return this.getUpdateProcess( data ).execute();
		};

		this.MessageDialog.prototype.focus = function () {
			this.$content.trigger( 'focus' );
		};

		this.MessageDialog.prototype.appendHiddenInput = function () {
			// Workaround, because we don't want the first input to be focused on click almost anywhere in
			// the dialog, which happens because the whole message is wrapped in the <label> element.
			// @see {@link https://github.com/jwbth/convenient-discussions/blob/20a7e7410b8331f1678c66851abbd5eeb4c4e51f/src/js/modal.js#L281}
			this.$dummyInput = $( '<input>' )
				.addClass( 'instantDiffs-hidden' )
				.prependTo( this.message.$element );
		};

		// Construct MessageDialog and attach it to the Window Managers
		this.dialog = new this.MessageDialog();
		this.manager = _utils.getWindowManager();
		this.manager.addWindows( [ this.dialog ] );
	};

	Dialog.prototype.request = function () {
		if ( !this.isConstructed ) {
			this.construct();
		}

		this.isLoading = true;
		this.error = null;

		// When the Diff is about to change, restore the mw.config to the initial state
		if ( this.mwConfigBackup ) {
			_utils.restoreMWConfig( this.mwConfigBackup );
		}
		if ( !this.mwConfigBackup ) {
			this.mwConfigBackup = _utils.backupMWConfig();
		}

		// Construct the Diff options
		const page = this.link.getPage();
		const options = {
			type: this.link.options.type,
			initiatorDiff: this.options.initiatorDiff,
			initiatorDialog: this,
		};

		// Load the Diff content
		this.previousDiff = this.diff;
		this.diff = new Diff( page, options );
		return $.when( this.diff.load() )
			.then( this.onRequestSuccess.bind( this ) )
			.fail( this.onRequestError.bind( this ) );
	};

	Dialog.prototype.onRequestError = function () {
		this.isLoading = false;
		this.open();
	};

	Dialog.prototype.onRequestSuccess = function () {
		this.isLoading = false;
		this.open();
	};

	Dialog.prototype.open = function () {
		const options = {
			title: this.diff.getPageTitleText(),
			message: this.diff.getContainer(),
		};

		if ( this.isOpen ) {
			this.dialog.update( options ).then( this.onUpdate.bind( this ) );
		} else {
			this.windowInstance = this.manager.openWindow( this.dialog, options );
			this.windowInstance.opened.then( this.onOpen.bind( this ) );
			this.windowInstance.closed.then( this.onClose.bind( this ) );
		}
	};

	Dialog.prototype.onOpen = function () {
		this.isOpen = true;
		this.fire();

		if ( _utils.isFunction( this.options.onOpen ) ) {
			this.options.onOpen( this );
		}
	};

	Dialog.prototype.onClose = function () {
		this.isOpen = false;

		if ( this.diff ) {
			this.diff.detach();
			this.diff = null;
		}

		if ( this.mwConfigBackup ) {
			_utils.restoreMWConfig( this.mwConfigBackup );
			this.mwConfigBackup = null;
		}

		if ( _utils.isFunction( this.options.onClose ) ) {
			this.options.onClose( this );
		}
		if ( _utils.isFunction( this.opener.options.onClose ) ) {
			this.opener.options.onClose( this );
		}
		if ( _utils.isFunction( this.initiator.options.onClose ) ) {
			this.initiator.options.onClose( this );
		}
	};

	Dialog.prototype.onUpdate = function () {
		this.fire();

		if (
			this.previousInitiator.link instanceof Link &&
			this.opener.link !== this.previousInitiator.link &&
			_utils.isFunction( this.previousInitiator.options.onClose )
		) {
			this.previousInitiator.options.onClose( this );
		}
		if (
			this.initiator.link instanceof Link &&
			this.opener.link !== this.initiator.link &&
			_utils.isFunction( this.initiator.options.onOpen )
		) {
			this.initiator.options.onOpen( this );
		}
	};

	Dialog.prototype.onScroll = function ( event ) {
		// Update diff content positions and sizes
		this.diff.updateSize( {
			top: event.target.scrollTop,
		} );
	};

	/*** ACTIONS ***/

	Dialog.prototype.fire = function () {
		// Detach previous Diff if exists
		if ( this.previousDiff instanceof Diff ) {
			this.previousDiff.detach();
		}

		mw.hook( 'wikipage.content' ).fire( this.diff.getContainer() );
		mw.hook( 'wikipage.diff' ).fire( this.diff.getContainer() );

		// Open links in a new tab, except for confirmable links
		this.diff.processLinksTaget();

		// Refresh dialog content height
		this.dialog.updateSize();
	};

	Dialog.prototype.focus = function () {
		this.dialog.focus();
	};

	Dialog.prototype.getDiff = function () {
		return this.diff;
	};

	Dialog.prototype.isParent = function ( node ) {
		return $.contains( this.dialog.$content.get( 0 ), node );
	};

	/******* DIALOG BUTTON CONSTRUCTOR *******/

	function DialogButton( options ) {
		this.options = $.extend( {}, options, {
			handler: this.openDialog.bind( this ),
			ariaHaspopup: true,
		} );
		this.page = {
			title: null,
			oldid: null,
			diff: null,
		};
		this.button = new Button( this.options );
	}

	DialogButton.prototype.openDialog = function () {
		if ( _local.dialog && _local.dialog.isLoading ) return;

		if ( !_local.dialog ) {
			_local.dialog = new Dialog();
		}
		_local.dialog.process( this, {
			onOpen: this.onDialogOpen.bind( this ),
			onClose: this.onDialogClose.bind( this ),
		} );

		this.toggleLoader( true );
		$.when( _local.dialog.load() ).always( () => this.toggleLoader( false ) );
	};

	DialogButton.prototype.toggleLoader = function ( value ) {
		this.button.pending( value );
	};

	DialogButton.prototype.embed = function ( container, insertMethod ) {
		this.button.embed( container, insertMethod );
	};

	DialogButton.prototype.onDialogOpen = function () {};
	DialogButton.prototype.onDialogClose = function () {};
	DialogButton.prototype.getPage = function () {};
	DialogButton.prototype.getCompare = function () {};

	/*** COMPARE BUTTON ***/

	function HistoryCompareButton( options ) {
		DialogButton.call( this, options );
		this.page.title = _local.titleText;
	}

	HistoryCompareButton.prototype = Object.create( DialogButton.prototype );
	HistoryCompareButton.prototype.constructor = HistoryCompareButton;

	HistoryCompareButton.prototype.getPage = function () {
		this.page.$oldid = $( '#mw-history-compare input[name="oldid"]:checked' );
		this.page.$oldidLine = this.page.$oldid.closest( 'li' );
		this.page.oldid = this.page.$oldid.val();

		this.page.$diff = $( '#mw-history-compare input[name="diff"]:checked' );
		this.page.$diffLine = this.page.$diff.closest( 'li' );
		this.page.diff = this.page.$diff.val();

		return this.page;
	};

	HistoryCompareButton.prototype.onDialogOpen = function () {
		if ( _utils.defaults( 'highlightLine' ) ) {
			this.page.$oldidLine.addClass( 'instantDiffs-line--highlight' );
			this.page.$diffLine.addClass( 'instantDiffs-line--highlight' );
		}
	};

	HistoryCompareButton.prototype.onDialogClose = function () {
		if ( _utils.defaults( 'highlightLine' ) ) {
			this.page.$oldidLine.removeClass( 'instantDiffs-line--highlight' );
			this.page.$diffLine.removeClass( 'instantDiffs-line--highlight' );
		}
	};

	/******* SETTINGS CONSTRUCTOR *******/

	function Settings() {
		this.isDependenciesLoaded = false;
		this.isConstructed = false;
		this.isOpen = false;
		this.isLoading = false;

		this.nodes = {};
		this.options = {};
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

		return $.when( mw.loader.using( _utils.getDependencies( _config.dependencies.settings ) ) )
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
		_utils.notifyError( 'error-dependencies-generic', null, this.error );
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
			wrapper.SettingsDialog.super.call( this );
		};
		OO.inheritClass( this.SettingsDialog, OO.ui.ProcessDialog );

		this.SettingsDialog.static.name = 'Instant Diffs Settings Dialog';
		this.SettingsDialog.static.title = _utils.msg( 'settings-title' );
		this.SettingsDialog.static.actions = [
			{
				action: 'save',
				modes: 'edit',
				label: _utils.msg( 'save' ),
				flags: [ 'primary', 'progressive' ],
			},
			{
				action: 'reload',
				modes: 'finish',
				label: _utils.msg( 'reload' ),
				flags: [ 'primary', 'progressive' ],
			},
			{
				modes: [ 'edit', 'finish' ],
				label: _utils.msg( 'close' ),
				title: _utils.msg( 'close' ),
				invisibleLabel: true,
				icon: 'close',
				flags: [ 'safe', 'close' ],
			},
		];

		this.SettingsDialog.prototype.initialize = function () {
			wrapper.SettingsDialog.super.prototype.initialize.apply( this, arguments );

			// Apply polyfills for older wikis
			_utils.applyOoUiPolyfill();

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
			this.panelFinish.$element.append( $( `<p>${ _utils.msg( 'settings-saved' ) }</p>` ) );

			// Render switchable layout
			this.stackLayout = new OO.ui.StackLayout( {
				items: [ this.panelEdit, this.panelFinish ],
			} );
			this.$body.append( this.stackLayout.$element );
		};

		this.SettingsDialog.prototype.renderLinksFieldset = function () {
			// Show Link
			this.inputs.showLink = new OO.ui.CheckboxInputWidget( {
				selected: _utils.defaults( 'showLink' ),
			} );
			this.fields.showLink = new OO.ui.FieldLayout( this.inputs.showLink, {
				label: _utils.msg( 'settings-show-link' ),
				align: 'inline',
				help: _utils.msg( 'settings-show-link-help' ),
				helpInline: true,
			} );
			this.fields.showLink.toggle( instantDiffs.settings.showLink );

			// Show Page Link
			this.inputs.showPageLink = new OO.ui.CheckboxInputWidget( {
				selected: _utils.defaults( 'showPageLink' ),
			} );
			this.fields.showPageLink = new OO.ui.FieldLayout( this.inputs.showPageLink, {
				label: _utils.msg( 'settings-show-page-link' ),
				align: 'inline',
				help: _utils.msg( 'settings-show-page-link-help' ),
				helpInline: true,
			} );
			this.fields.showPageLink.toggle( instantDiffs.settings.showPageLink );

			// Highlight list lines when Diff Dialog opens
			this.inputs.highlightLine = new OO.ui.CheckboxInputWidget( {
				selected: _utils.defaults( 'highlightLine' ),
			} );
			this.fields.highlightLine = new OO.ui.FieldLayout( this.inputs.highlightLine, {
				label: _utils.msg( 'settings-highlight-line' ),
				align: 'inline',
			} );
			this.fields.highlightLine.toggle( instantDiffs.settings.highlightLine );

			// Mark watched lines when Diff Dialog opens
			this.inputs.markWatchedLine = new OO.ui.CheckboxInputWidget( {
				selected: _utils.defaults( 'markWatchedLine' ),
			} );
			this.fields.markWatchedLine = new OO.ui.FieldLayout( this.inputs.markWatchedLine, {
				label: _utils.msg( 'settings-mark-watched-line' ),
				align: 'inline',
			} );
			this.fields.markWatchedLine.toggle( instantDiffs.settings.markWatchedLine );

			// Fieldset
			this.layouts.links = new OO.ui.FieldsetLayout( {
				label: _utils.msg( 'settings-fieldset-links' ),
			} );
			this.layouts.links.addItems( [
				this.fields.showLink,
				this.fields.showPageLink,
				this.fields.highlightLine,
				this.fields.markWatchedLine,
			] );
			this.layouts.links.toggle(
				instantDiffs.settings.showLink ||
				instantDiffs.settings.showPageLink ||
				instantDiffs.settings.highlightLine ||
				instantDiffs.settings.markWatchedLine,
			);
		};

		this.SettingsDialog.prototype.renderDialogFieldset = function () {
			// Unhide revisions and diff content for administrators
			this.inputs.unHideDiffs = new OO.ui.CheckboxInputWidget( {
				selected: _utils.defaults( 'unHideDiffs' ),
			} );
			this.fields.unHideDiffs = new OO.ui.FieldLayout( this.inputs.unHideDiffs, {
				label: _utils.msg( 'settings-unhide-diffs' ),
				align: 'inline',
				help: _utils.msg( 'settings-unhide-diffs-help' ),
				helpInline: true,
			} );
			this.fields.unHideDiffs.toggle( instantDiffs.settings.unHideDiffs );

			// Open links in the new tab
			this.inputs.openInNewTab = new OO.ui.CheckboxInputWidget( {
				selected: _utils.defaults( 'openInNewTab' ),
			} );
			this.fields.openInNewTab = new OO.ui.FieldLayout( this.inputs.openInNewTab, {
				label: _utils.msg( 'settings-open-in-new-tab' ),
				align: 'inline',
			} );
			this.fields.openInNewTab.toggle( instantDiffs.settings.openInNewTab );

			// Copy links format
			this.inputOptions.linksFormat = {};
			this.inputOptions.linksFormat.full = new OO.ui.RadioOptionWidget( {
				data: 'full',
				label: _utils.msg( 'settings-links-format-full' ),
			} );
			this.inputOptions.linksFormat.minify = new OO.ui.RadioOptionWidget( {
				data: 'minify',
				label: _utils.msg( 'settings-links-format-minify' ),
			} );
			this.inputs.linksFormat = new OO.ui.RadioSelectWidget( {
				items: Object.values( this.inputOptions.linksFormat ),
			} );
			this.inputs.linksFormat.on( 'select', this.onLinksFormatChoose.bind( this ) );

			this.fields.linksFormat = new OO.ui.FieldLayout( this.inputs.linksFormat, {
				label: _utils.msg( 'settings-links-format' ),
				align: 'inline',
				help: 'placeholder',
				helpInline: true,
			} );
			this.fields.linksFormat.toggle( instantDiffs.settings.linksFormat );

			// Copy wikilinks format
			this.inputOptions.wikilinksFormat = {};
			this.inputOptions.wikilinksFormat.link = new OO.ui.RadioOptionWidget( {
				data: 'link',
				label: _utils.msg( 'settings-wikilinks-format-link' ),
			} );
			this.inputOptions.wikilinksFormat.spacial = new OO.ui.RadioOptionWidget( {
				data: 'special',
				label: _utils.msg( 'settings-wikilinks-format-special' ),
			} );
			this.inputs.wikilinksFormat = new OO.ui.RadioSelectWidget( {
				items: Object.values( this.inputOptions.wikilinksFormat ),
			} );
			this.inputs.wikilinksFormat.on( 'select', this.onWikilinksFormatChoose.bind( this ) );

			this.fields.wikilinksFormat = new OO.ui.FieldLayout( this.inputs.wikilinksFormat, {
				label: _utils.msg( 'settings-wikilinks-format' ),
				align: 'inline',
				help: 'placeholder',
				helpInline: true,
			} );
			this.fields.wikilinksFormat.toggle( instantDiffs.settings.wikilinksFormat );

			// Fieldset
			this.layouts.dialog = new OO.ui.FieldsetLayout( {
				label: _utils.msg( 'settings-fieldset-dialog' ),
			} );
			this.layouts.dialog.addItems( [
				this.fields.unHideDiffs,
				this.fields.openInNewTab,
				this.fields.linksFormat,
				this.fields.wikilinksFormat,
			] );
			this.layouts.dialog.toggle(
				instantDiffs.settings.unHideDiffs ||
				instantDiffs.settings.openInNewTab ||
				instantDiffs.settings.linksFormat ||
				instantDiffs.settings.wikilinksFormat,
			);

			// Trigger selects actions
			this.inputs.linksFormat.selectItemByData( _utils.defaults( 'linksFormat' ) );
			this.inputs.wikilinksFormat.selectItemByData( _utils.defaults( 'wikilinksFormat' ) );
		};

		this.SettingsDialog.prototype.renderGeneralFieldset = function () {
			// Unhide revisions and diff content for administrators
			this.inputs.enableMobile = new OO.ui.CheckboxInputWidget( {
				selected: _utils.defaults( 'enableMobile' ),
			} );
			this.fields.enableMobile = new OO.ui.FieldLayout( this.inputs.enableMobile, {
				label: _utils.msg( 'settings-enable-mobile' ),
				align: 'inline',
				help: _utils.msg( 'settings-enable-mobile-help' ),
				helpInline: true,
			} );
			this.fields.enableMobile.toggle( instantDiffs.settings.enableMobile );

			// Open links in the new tab
			this.inputs.notifyErrors = new OO.ui.CheckboxInputWidget( {
				selected: _utils.defaults( 'notifyErrors' ),
			} );
			this.fields.notifyErrors = new OO.ui.FieldLayout( this.inputs.notifyErrors, {
				label: _utils.msg( 'settings-notify-errors' ),
				align: 'inline',
			} );
			this.fields.notifyErrors.toggle( instantDiffs.settings.notifyErrors );

			// Fieldset
			this.layouts.general = new OO.ui.FieldsetLayout( {
				label: _utils.msg( 'settings-fieldset-general' ),
			} );
			this.layouts.general.addItems( [
				this.fields.enableMobile,
				this.fields.notifyErrors,
			] );
			this.layouts.general.toggle(
				instantDiffs.settings.enableMobile ||
				instantDiffs.settings.notifyErrors,
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
			const title = _utils.msg( 'wikilink-example-title' );
			const diff = _utils.getDiffHref( { title, oldid: '12345', diff: 'prev' }, {}, params );
			const revision = _utils.getRevisionHref( { title, oldid: '12345' }, {}, params );
			const page = _utils.getRevisionHref( { title, curid: '12345' }, {}, params );
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
				return new OO.ui.Process( () => this.processActionSave() );
			}
			if ( action === 'reload' ) {
				return new OO.ui.Process( () => this.processActionReload() );
			}
			return wrapper.SettingsDialog.super.prototype.getActionProcess.call( this, action );
		};

		this.SettingsDialog.prototype.processActionSave = function () {
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
			const error = new OO.ui.Error( _utils.msg( 'error-setting-save' ) );
			this.showErrors( error );
		};

		this.SettingsDialog.prototype.processActionReload = function () {
			this.pushPending();
			window.location.reload();
		};

		this.SettingsDialog.prototype.getUpdateProcess = function ( data ) {
			return new OO.ui.Process()
				.next( () => {
					this.actions.setMode( 'edit' );
					this.stackLayout.setItem( this.panelEdit );
					this.processActionUpdate( _utils.defaults() );
				}, this );
		};

		this.SettingsDialog.prototype.processActionUpdate = function ( settings ) {
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
		};

		this.SettingsDialog.prototype.update = function ( data ) {
			return this.getUpdateProcess( data ).execute();
		};

		this.SettingsDialog.prototype.getBodyHeight = function () {
			return 535;
		};

		// Construct MessageDialog and attach it to the Window Managers
		this.dialog = new this.SettingsDialog();
		this.manager = _utils.getWindowManager();
		this.manager.addWindows( [ this.dialog ] );
	};

	/*** USER OPTIONS ***/

	Settings.prototype.request = function () {
		if ( !this.isConstructed ) {
			this.construct();
		}
		if ( _local.mwIsAnon ) {
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
			uselang: _local.language,
		};
		return _local.mwApi
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
		_utils.notifyError( 'error-setting-request', null, this.error );

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
			const settings = JSON.parse( options[ `${ _config.settingsPrefix }-settings` ] );
			_utils.setDefaults( settings, true );
		} catch ( e ) {}

		this.open();
	};

	Settings.prototype.save = function ( settings ) {
		// Update settings stored in the Local Storage
		mw.storage.setObject( `${ _config.prefix }-settings`, settings );

		// Guest settings stored only in the Local Storage
		if ( _local.mwIsAnon ) return true;

		// Check if the Global Preferences extension is available
		const dependencies = _utils.getDependencies( [ 'ext.GlobalPreferences.global' ] );
		if ( dependencies.length > 0 ) {
			return this.saveGlobal( settings );
		}

		return this.saveLocal( settings );
	};

	Settings.prototype.saveLocal = function ( settings ) {
		const params = [
			`${ _config.settingsPrefix }-settings`,
			JSON.stringify( settings ),
		];
		return _local.mwApi.saveOption.apply( _local.mwApi, params );
	};

	Settings.prototype.saveGlobal = function ( settings ) {
		const params = {
			action: 'globalpreferences',
			optionname: `${ _config.settingsPrefix }-settings`,
			optionvalue: JSON.stringify( settings ),
		};
		return _local.mwApi.postWithEditToken( params );
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
		if ( _utils.isFunction( this.options.onOpen ) ) {
			this.options.onOpen( this );
		}
	};

	Settings.prototype.onClose = function () {
		this.isOpen = false;
		if ( _utils.isFunction( this.options.onClose ) ) {
			this.options.onClose( this );
		}
	};

	/******* PAGE SPECIFIC FUNCTIONS *******/

	function applyPageSpecificAdjustments() {
		if ( !_utils.isAllowed() ) return;

		// Change Lists
		if ( _config.changeLists.includes( mw.config.get( 'wgCanonicalSpecialPageName' ) ) ) {
			return processChangelistPage();
		}

		// User Contributions
		if ( _config.contributionLists.includes( mw.config.get( 'wgCanonicalSpecialPageName' ) ) ) {
			return processContributionsPage();
		}

		// History
		if ( mw.config.get( 'wgAction' ) === 'history' ) {
			return processHistoryPage();
		}
	}

	function processChangelistPage() {
		// Add an instantDiffs-line CSS class
		$( '.mw-changeslist-line' ).addClass( 'instantDiffs-line' );
	}

	function processContributionsPage() {
		// Fill empty links
		const $contributionsLines = $( '.mw-contributions-list .mw-changeslist-links > span:first-child' );
		$contributionsLines.each( ( i, node ) => {
			const $node = $( node );
			if ( $node.find( 'a' ).length === 0 ) {
				$node.wrapInner( _utils.getPlaceholder() );
			}
		} );
	}

	function processHistoryPage() {
		// Add an instantDiffs-line CSS class that adds spaces between selector checkboxes
		const $revisionLines = $( '#pagehistory > li, #pagehistory .mw-contributions-list > li' )
			.addClass( 'instantDiffs-line--history' );

		// Add a compare button only if the number of lines is greater than 1
		if ( $revisionLines.length <= 1 ) return;

		// Fill empty links
		$revisionLines.each( ( i, node ) => {
			const $container = $( node );
			const $cur = $container.find( '.mw-history-histlinks > span:first-child' );
			const $prev = $container.find( '.mw-history-histlinks > span:last-child' );
			if ( $cur.find( 'a' ).length === 0 ) {
				$cur.wrapInner( _utils.getPlaceholder() );
			}
			if ( $prev.find( 'a' ).length === 0 ) {
				$prev.wrapInner( _utils.getPlaceholder() );
			}
		} );

		// Dynamic revision selector
		const $revisionSelector = $( '.mw-history-compareselectedversions' );
		$revisionSelector.each( ( i, node ) => {
			const $container = $( node );
			const $button = $container.find( '.mw-history-compareselectedversions-button' );

			new HistoryCompareButton( {
				label: _utils.msg( 'compare', _config.labels.diff ),
				title: _utils.msg( 'compare-title', _config.name ),
				classes: [ 'mw-ui-button', 'cdx-button', 'instantDiffs-button--compare' ],
				insertMethod: 'insertAfter',
				container: $button,
			} );

			$( '<span>' )
				.text( ' ' )
				.addClass( 'instantDiffs-spacer' )
				.insertAfter( $button );
		} );
	}

	/******* PREPARE ******/

	function prepare() {
		// Hide the links panel to prevent blinking before the main stylesheet is applied
		mw.util.addCSS( `
			.instantDiffs-panel { display:none; }
		` );

		// Prepare locale variables
		_local.mwIsAnon = mw.user?.isAnon?.() ?? true;
		_local.mwEndPoint = `${ location.origin }${ mw.config.get( 'wgScript' ) }`;
		_local.mwEndPointUrl = new URL( _local.mwEndPoint );
		_local.mwApi = new mw.Api();
		_local.mwArticlePath = mw.config.get( 'wgArticlePath' ).replace( '$1', '' );
		_local.titleText = new mw.Title( mw.config.get( 'wgPageName' ) ).getPrefixedText();

		// Get hostnames (including mobile variants) used to assemble the link selector
		_local.mwServers.push( mw.config.get( 'wgServer' ) );
		const mobileServer = _utils.getMobileServer();
		if ( mobileServer ) {
			_local.mwServers.push( mobileServer );
		}

		// Init links Intersection Observer
		const observerParams = {
			threshold: 0,
			rootMargin: '20% 0px 20% 0px',
		};
		if ( _utils.defaults( 'debug' ) ) {
			delete observerParams.rootMargin;
		}
		_local.observer = new IntersectionObserver( observe, observerParams );

		// Init unload events
		window.addEventListener( 'beforeunload', unload );

		// Get other dependencies
		return Promise.allSettled( [
			getLocalizedTitles(),
			...getMessages(),
		] );
	}

	function getLocalizedTitles() {
		// Try to get cached specialPages from local storage
		_local.specialPagesAliases = mw.storage.getObject( `${ _config.prefix }-specialPagesAliases` );
		if (
			_local.specialPagesAliases &&
			Object.keys( _local.specialPagesAliases ).length === _config.specialPages.length
		) {
			return true;
		}

		// Request localized specialPages
		const params = {
			action: 'query',
			titles: _config.specialPages,
			format: 'json',
			formatversion: 2,
		};
		return _local.mwApi
			.get( params )
			.then( onRequestLocalizedTitlesDone );
	}

	function onRequestLocalizedTitlesDone( data ) {
		if ( !data?.query?.pages ) return;

		_local.specialPagesAliases = {};

		// Fallback for names of special pages
		_config.specialPages.forEach( item => {
			_local.specialPagesAliases[ item ] = item;
		} );

		// Localized names of special pages
		if ( data.query.normalized ) {
			data.query.normalized.forEach( item => {
				_local.specialPagesAliases[ item.from ] = item.to;
			} );
		}

		mw.storage.setObject( `${ _config.prefix }-specialPagesAliases`, _local.specialPagesAliases );
	}

	function getMessages() {
		return [ 'en', mw.config.get( 'wgUserLanguage' ) ]
			.filter( ( value, index, self ) => self.indexOf( value ) === index )
			.map( lang => {
				const path = _config.dependencies.messages.replace( '$lang', lang );
				return mw.loader.getScript( _utils.getOrigin( path ) );
			} );
	}

	function assembleLinkSelector() {
		// Assemble RegExp for testing for mwArticlePath
		_local.articlePathRegExp = new RegExp(
			_config.articlePathRegExp.replaceAll( '$1', _local.mwArticlePath ),
		);

		// Start assemble links selector
		const linkSelector = [];
		_config.linkSelector.forEach( item => {
			if ( /\$1/.test( item ) ) {
				_local.mwServers.forEach( server => {
					linkSelector.push(
						item.replaceAll( '$1', server ),
					);
				} );
			} else {
				linkSelector.push( item );
			}
		} );

		// Assemble special pages link selector
		_local.specialPages = [];
		_local.specialPagesPrefixed = [];
		_local.specialPagesAliasesPrefixed = {};

		const specialPagesKeys = Object.keys( _local.specialPagesAliases );
		specialPagesKeys.forEach( name => {
			const title = _local.specialPagesAliases[ name ];
			const titlePrefixed = new mw.Title( title ).getPrefixedDb();

			_local.specialPagesPrefixed.push( titlePrefixed );
			_local.specialPagesAliasesPrefixed[ name ] = titlePrefixed;

			linkSelector.push(
				_config.specialPagesSelector.replaceAll( '$1', title ),
			);
		} );

		// Join link selector assembled results
		_local.linkSelector = linkSelector.join( ',' );

		// Assemble RegExp for testing page titles in the links
		const specialPagesPrefixed = _local.specialPagesPrefixed.join( '|' );
		_local.specialPagesPathRegExp = new RegExp(
			_config.specialPagesPathRegExp
				.replaceAll( '$1', _local.mwArticlePath )
				.replaceAll( '$2', specialPagesPrefixed ),
		);
		_local.specialPagesSearchRegExp = new RegExp(
			_config.specialPagesSearchRegExp.replaceAll( '$1', specialPagesPrefixed ),
		);
	}

	/******* RUN *******/

	function run() {
		instantDiffs.isRunning = true;

		// Track on run start time
		_timers.run = Date.now();

		// Load dependencies and prepare variables
		mw.loader.load( _utils.getOrigin( _config.dependencies.styles ), 'text/css' );
		mw.loader.using( _config.dependencies.main )
			.then( prepare )
			.then( ready )
			.fail( error => {
				_utils.notifyError( 'error-prepare-generic', null, {
					type: 'prepare',
					message: error?.message,
				} );
			} );
	}

	function ready() {
		_utils.processDefaults();
		_utils.processMessages();

		// Check if the script is enabled on the mobile skin (Minerva)
		if ( mw.config.get( 'skin' ) === 'minerva' && !_utils.defaults( 'enableMobile' ) ) {
			_utils.notifyError( 'error-prepare-mobile', null, { type: 'mobile' }, true );
			return;
		}

		// Perform page-specific adjustments after preparation and call the ready state
		instantDiffs.isReady = true;
		document.body.classList.add( 'instantDiffs-enabled' );
		assembleLinkSelector();
		applyPageSpecificAdjustments();

		// Track on ready time
		_timers.ready = Date.now();

		// Fire the ready state hook
		mw.hook( `${ _config.prefix }.ready` ).fire( instantDiffs );

		// Add process hook listeners
		mw.hook( 'wikipage.content' ).add( processContent );
		mw.hook( `${ _config.prefix }.process` ).add( process );
	}

	function processContent( $context ) {
		// Check the including / excluding rules only for the 'wikipage.content' hook
		if ( !$context || !_utils.isAllowed() ) return;

		// Process all page links including system messages on the first run
		instantDiffs.isFirstRun = !instantDiffs.isRunCompleted;
		if ( instantDiffs.isFirstRun ) {
			instantDiffs.isRunCompleted = true;
			$context = _utils.getBodyContentNode();
		}

		// Process links
		process( $context );

		// Log timers for the first run
		if ( _utils.defaults( 'logTimers' ) && instantDiffs.isFirstRun ) {
			_utils.logTimer( 'ready time', _timers.run, _timers.ready );
			_utils.logTimer( 'total time', _timers.run, _timers.processEnd );
		}
	}

	function process( $context ) {
		if ( !$context ) return;

		// Track on process start time
		_timers.processStart = Date.now();

		// Get all links using the assembled selector and skip those already processed
		const links = _utils.getLinks( $context )
			.filter( ( index, node ) => !_local.links.has( node ) )
			.map( ( index, node ) => new Link( node ) );

		// Track on process end time
		_timers.processEnd = Date.now();

		// Log timers for the process
		if ( _utils.defaults( 'logTimers' ) && links.length > 0 ) {
			console.info( `${ _utils.msg( 'name' ) }: links processed: ${ links.length }.` );
			_utils.logTimer( 'process time', _timers.processStart, _timers.processEnd );
		}

		// Fire the process end hook
		mw.hook( `${ _config.prefix }.processed` ).fire( links );
	}

	function observe( entries ) {
		entries.forEach( entry => {
			if ( !entry.isIntersecting ) return;

			const link = _local.links.get( entry.target );
			if ( link ) {
				link.onIntersect();
			}
		} );
	}

	function unload() {
		instantDiffs.isUnloading = true;
		_local.observer?.disconnect();
	}

	/******* EXPORTS *******/

	window.instantDiffs ||= {};
	if ( instantDiffs.isRunning ) {
		_utils.notifyError( 'error-prepare-version', null, {
			type: 'version',
			message: `loaded: ${ instantDiffs.config.version }, current: ${ _config.version }`,
		}, true );
		return;
	}

	instantDiffs.config = _config;
	instantDiffs.local = _local;
	instantDiffs.utils = _utils;
	instantDiffs.api = { Button, DialogButton, HistoryCompareButton, Dialog, Diff, Link };
	instantDiffs.settings ||= {};
	instantDiffs.settings = $.extend( {}, instantDiffs.config.settings, instantDiffs.settings );
	instantDiffs.defaults ||= {};
	instantDiffs.defaults = $.extend( {}, instantDiffs.config.defaults, instantDiffs.defaults );

	/******* EXTENSIONS *******/

	/*** [[commons:User:JWBTH/CD]] ***/

	mw.hook( 'convenientDiscussions.preprocessed' ).add( function ( cd ) {
		const id = instantDiffs;
		if ( !cd || !id ) return;

		const renderLink = ( link ) => {
			if ( !link.isProcessed || !link.config.showPageLink || link.cd ) return;

			link.cd = {};
			link.cd.href = getHref( link );
			if ( id.utils.isEmpty( link.cd.href ) ) return;

			if ( link.page.button ) {
				link.page.button.remove();
			}

			link.cd.button = link.renderAction( {
				label: id.utils.getLabel( 'page' ),
				title: id.utils.msg( 'goto-cd' ),
				href: link.cd.href,
				modifiers: [ 'page', 'message' ],
			} );
		};

		const getHref = ( link ) => {
			if ( !link.compare && !link.revision ) return;

			const page = cd.api.pageRegistry.get( link.page.titleText );
			if ( !page || !page.isProbablyTalkPage() ) return;

			if ( link.revision ) {
				if ( link.revision.revid ) {
					link.cd.date = new Date( link.revision.timestamp );
					link.cd.user = link.revision.user;
				}
			} else if ( link.compare ) {
				if ( link.compare.torevid ) {
					link.cd.date = new Date( link.compare.totimestamp );
					link.cd.user = link.compare.touser;
				} else if ( link.compare.fromrevid ) {
					link.cd.date = new Date( link.compare.fromtimestamp );
					link.cd.user = link.compare.fromuser;
				}
			}

			if ( link.cd.date && link.cd.user ) {
				try {
					link.cd.anchor = cd.api.generateCommentId( link.cd.date, link.cd.user );
				} catch ( e ) {}
			}

			if ( !link.cd.anchor ) return;

			let href = `#${ link.cd.anchor }`;
			if ( link.page.titleText !== id.local.titleText ) {
				href = mw.util.getUrl( `${ link.page.titleText }${ href }` );
			}
			return href;
		};

		// Process already rendered links
		if ( id.isRunCompleted ) {
			for ( const link of id.local.links.values() ) {
				renderLink( link );
			}
		}

		// Add hook listener to process newly added links
		mw.hook( `${ instantDiffs.config.prefix }.link.renderSuccess` ).add( function ( link ) {
			if ( !link ) return;
			renderLink( link );
		} );
	} );

	/*** [[:en:User:Cacycle/wikEdDiff]] ***/

	mw.hook( `${ instantDiffs.config.prefix }.diff.beforeDetach` ).add( function ( diff ) {
		if ( !diff ) return;

		// Reset diff table linking
		// FixMe: Suggest a better solution
		if (
			typeof wikEd !== 'undefined' &&
			wikEd.diffTableLinkified &&
			diff.options.type === 'diff' &&
			( diff.nodes.$table.length > 0 && wikEd.diffTable === diff.nodes.$table.get( 0 ) )
		) {
			wikEd.diffTableLinkified = false;
		}
	} );

	/******* BOOTSTRAP *******/

	run();

} );

// </nowiki>
