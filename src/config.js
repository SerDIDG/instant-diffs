/**
 * Configuration.
 * @type {Record<string, any>}
 */
export const config = {
	version: '__version__',
	link: 'Instant_Diffs',
	discussion: 'Talk:Instant_Diffs',
	outname: '__outname__',
	outdir: '__outdir__',
	origin: '__origin__',
	server: '__server__',
	prefix: 'instantDiffs',
	messagePrefix: 'instant-diffs',
	settingsPrefix: 'userjs-instantDiffs',

	dependencies: {
		styles: '__styles__',
		i18n: '__i18n__',
		main: [
			'oojs',
			'mediawiki.api',
			'mediawiki.util',
			'mediawiki.user',
			'mediawiki.storage',
			'mediawiki.notification',
			'mediawiki.ForeignApi',
			'mediawiki.Title',
		],
		settings: [
			'oojs',
			'oojs-ui-core',
			'oojs-ui-widgets',
			'oojs-ui-windows',
			'oojs-ui.styles.icons-interactions',
		],
		window: [
			'oojs',
			'oojs-ui-core',
			'oojs-ui-widgets',
			'oojs-ui-windows',
			'oojs-ui.styles.icons-accessibility',
			'oojs-ui.styles.icons-movement',
			'oojs-ui.styles.icons-content',
			'oojs-ui.styles.icons-alerts',
			'oojs-ui.styles.icons-interactions',
			'oojs-ui.styles.icons-moderation',
			'oojs-ui.styles.icons-editing-core',
			'oojs-ui.styles.icons-editing-advanced',
			'oojs-ui.styles.icons-user',
			'oojs-ui.styles.icons-layout',
		],
		content: [
			'jquery.confirmable',
			'mediawiki.DateFormatter',
			'mediawiki.codex.messagebox.styles',
			'mediawiki.interface.helpers.styles',
			'mediawiki.diff',
			'mediawiki.diff.styles',
			'mediawiki.misc-authed-curate',
			'mediawiki.page.watch.ajax',
			'ext.flaggedRevs.basic',
			'ext.visualEditor.diffPage.init',
		],
		page: {
			'*': [
				'ext.thanks.corethank',
				'ext.checkUser.styles',
				'ext.checkUser.userInfoCard',
			],
		},
		revision: {
			6: [                                                        // File:
				'filepage',
				'wikibase.mediainfo.filepage.styles',
				'wikibase.mediainfo.statements',
				'wikibase.mediainfo.statements.styles',
			],
			14: [                                                       // Category:
				'mediawiki.page.gallery.styles',
			],
			102: [                                                      // TimedText:
				'ext.tmh.player',
				'ext.tmh.timedtextpage.styles',
			],
			146: [                                                      // Lexeme:
				'wikibase.lexeme.styles',
			],
			460: [                                                      // Campaign:
				'mediawiki.page.gallery.styles',
			],
			486: [                                                      // Data:
				'ext.jsonConfig',
			],
		},
		skins: {
			minerva: {
				'*': [
					'codex-styles',
					'skins.minerva.categories.styles',
				],
			},
		},
		selectors: [
			{                                                           // [[Extension:UserProfileV2]]
				selector: [ '.profile-masthead' ],
				dependencies: [ 'ext.userProfileV2.styles' ],
			},
		],
		messages: {
			6: [                                                        // File:
				'wikibasemediainfo-filepage-fileinfo-heading',
				'wikibasemediainfo-filepage-structured-data-heading',
			],
		},
	},

	foreignDependencies: {
		revision: {
			styles: {
				6: [                                                    // File:
					'wikibase.mediainfo.filepage.styles',
					'wikibase.mediainfo.statements',
					'wikibase.mediainfo.statements.styles',
				],
				146: [                                                  // Lexeme:
					'wikibase.lexeme.styles',
				],
			},
			links: {
				6: [                                                    // File:
					'MediaWiki:Filepage.css',
				],
			},
			wikibase: {
				styles: {
					all: [
						'jquery.wikibase.toolbar.styles',
						'wikibase.view.ControllerViewFactory',
						'wikibase.alltargets',
					],
					desktop: [
						'wikibase.desktop',
					],
					mobile: [
						'wikibase.mobile',
					],
				},
			},
		},
		messages: {
			'*': [
				'revisionasof',
				'currentrev-asof',
				'word-separator',
				'pipe-separator',
				'parentheses',
				'talkpagelinktext',
				'contribslink',
				'changeslist-nocomment',
				'rev-deleted-no-diff',
				'rev-deleted-user',
				'rev-deleted-comment',
				'editold',
				'viewsourceold',
				'editundo',
				'tooltip-undo',
				'wikibase-restoreold',
				'diff-empty',
				'checkuser-userinfocard-toggle-button-aria-label',
			],
		},
	},

	// Settings options
	settings: {},

	// Settings defaults
	defaults: {
		debug: '__debug__' === 'true',
		GM: false,                                                      // Greasemonkey mode
		standalone: false,                                              // Standalone mode
		storageExpiry: 60 * 60 * 24,                                    // Cache local storage for 1 day
		logTimers: true,
		expEnableWatchlistPopup: false,                                 // New Watchlist Popup
	},

	// Including / excluding rules
	include: {
		pageActions: [ 'view', 'history' ],
	},
	exclude: {
		pages: [],
		linkActions: [ 'edit', 'history' ],
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

	// Breakpoints
	breakpoints: {
		mobileUp: '(min-width: 640px)',
		mobileDown: '(max-width: 639px)',
	},

	// Wikilink format presets
	wikilinkPresets: {
		link: {
			page: '[$href $msg]',
			diff: '[$href $msg]',
			revision: '[$href $msg]',
		},
		special: {
			page: '[[$prefSpecial:Redirect/page/$1|$msg]]',
			diff: '[[$prefSpecial:Diff/$1|$msg]]',
			revision: '[[$prefSpecial:PermanentLink/$1|$msg]]',
		},
	},

	// Path
	commonsAssetsPath: 'https://upload.wikimedia.org/wikipedia/commons',

	// Page lists
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
		'GlobalWatchlist',
	],
	specialPages: [
		'Special:Diff',
		'Special:Permalink',
		'Special:PermanentLink',
		'Special:MobileDiff',
		'Special:Redirect',
		'Special:ComparePages',
		'Special:Undelete',
	],

	nonEditableContentModels: [
		'wikibase-item',
		'wikibase-property',
		'wikibase-lexeme',
	],

	// Skin-specific content classes
	skinBodyClasses: {
		'vector-2022': [ 'mw-body', 'vector-body' ],
		vector: [ 'vector-body' ],
		monobook: [ 'monobook-body' ],
		minerva: [ 'content' ],
		timeless: [ 'mw-body' ],
		fandomdesktop: [ 'page-content' ],
		fandommobile: [ 'page-content' ],
	},

	// Content selectors
	bodyContentSelector: {
		minerva: '#content',
		default: '#bodyContent',
	},
	contentSelector: '#mw-content-text',

	// Link selectors
	specialPagesLinks: [
		'Special:Diff',
		'Special:Permalink',
		'Special:PermanentLink',
		'Special:MobileDiff',
		'Special:Redirect',
	],
	specialPagesLinksRegExp: '^($1)',                                   // $1 - joined specialPages
	specialPagesLinksSelector: 'a[title^="$1"]',                        // $1 - each of the specialPages

	articlePathRegExp: '^($1)',                                         // $1 - article path
	sectionRegExp: /^\/\*\s*(.*?)\s*\*\/.*$/,

	linkSelector: [                                                     // $1 - server
		'[data-instantdiffs-line="all"] a',                             // Manually marked links in link line
		'a[data-instantdiffs-link]',                                    // Manually marked link
		'a.external[href^="$1"]',                                       // External links that lead to the same wiki
		'a.extiw',                                                      // External links that lead to the interwiki
		'a.mw-changeslist-date',                                        // Changelists (revision)
		'a.mw-changeslist-diff',                                        // Changelists (diff)
		'a.mw-changeslist-diff-cur',                                    // Changelists (diff to current)
		'a.mw-changeslist-groupdiff',                                   // Changelists (diffs in a group)
		'.mw-fr-reviewlink a',                                          // Changelists (FlaggedRevs link)
		'.mw-enhanced-rc-time a',                                       // Changelists (revision)
		'.mw-history-histlinks a',                                      // Page history
		'.mw-diff-bytes + a',
		'.mw-contributions-list .comment a',                            // Edit summary in the contributions
		'.mw-fr-pending-changes-table a.cdx-docs-link',                 // [[Special:PendingChanges]]
		'#mw-revision-nav a',                                           // [[Special:PermanentLink]] / Revision
		'table.diff #differences-prevlink',                             // [[Special:Diff]]: Previous edit
		'table.diff #differences-nextlink',                             // [[Special:Diff]]: Next edit
		'.mw-diff-revision-history-links a',                            // [[Special:Diff]]: MobileDiff navigation links
		'.mw-logevent-loglines a',                                      // [[Special:Logs]]
		'[data-afl-log-id] a',                                          // [[Special:AbuseLog]]
		'a.ext-globalwatchlist-diff',                                   // [[Special:GlobalWatchlist]]
		'.wikibase-statementview-references a',                         // Wikibase statements references
		'#mw-fr-revision-messages a',                                   // [[Extension:FlaggedRevs]] mobile warning
		'#mw-fr-revision-details a',                                    // [[Extension:FlaggedRevs]] desktop popup
		//'.mw-undelete-revlist a',                                     // [[Special:Undelete]]
	],

	mwLine: {
		selector: [
			'[data-instantdiffs-line]',                                 // Manually marked list line
			'.mw-changeslist-line',                                     // Changelists
			'.mw-contributions-list li',                                // Contributions
			'.mw-fr-pending-changes-table tr',                          // [[Special:PendingChanges]]
			'.mw-logevent-loglines li',                                 // [[Special:Logs]]
			'.mw-special-AbuseLog [data-afl-log-id]',                   // [[Special:AbuseLog]]
			'.ext-globalwatchlist-site li',                             // [[Special:GlobalWatchlist]]
			//'.mw-undelete-revlist li',                                // [[Special:Undelete]]
		],
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
			'.mw-changeslist-title',                                    // Changelists
			'.mw-contributions-title',                                  // Contributions
			'.mw-newpages-pagename',                                    // [[Special:NewPages]]
			'.mw-fr-pending-changes-page-title',                        // [[Special:PendingChanges]]
		],
	},
	mwLink: {
		id: [
			'differences-prevlink',                                     // [[Special:Diff]]
			'differences-nextlink',                                     // [[Special:Diff]]
		],
		hasClass: [
			'mw-diff-revision-history-link-prev',                       // [[Special:Diff]]: MobileDiff previous edit
			'mw-diff-revision-history-link-next',                       // [[Special:Diff]]: MobileDiff next edit
			'mw-changeslist-date',
			'mw-changeslist-diff',
			'mw-changeslist-diff-cur',
			'mw-changeslist-groupdiff',
			'mw-newpages-time',                                         // [[Special:NewPages]]
		],
		closestTo: [
			'[data-instantdiffs-line]',
			'.mw-changeslist-line',                                     // Changelists
			'.mw-contributions-list',                                   // Contributions
			'.mw-history-histlinks',                                    // Page History
			'.mw-pager-navigation-bar + ul',                            // Legacy lists without specific identifiers
			'.mw-fr-hist-difflink',                                     // [[Extension:FlaggedRevs]] page history
			'#mw-fr-reviewnotice',
			'#mw-fr-revisiontag',
			'#mw-fr-revisiontag-edit',
			'#mw-fr-revision-tag-edit',
			'.mw-specialpage-summary',                                  // Page header on certain Special pages
			'#mw-revision-nav',                                         // [[Special:PermanentLink]] / Revision
			'.mw-fr-pending-changes-table',                             // [[Special:PendingChanges]]
			'.mw-logevent-loglines',                                    // [[Special:Logs]]
			'.mw-special-AbuseLog li[data-afl-log-id]',                 // [[Special:AbuseLog]]
			'.wikibase-statementview-references',                       // Wikibase statement references
			'.ext-globalwatchlist-site',                                // [[Special:GlobalWatchlist]]
			//'.mw-undelete-revlist',                                   // [[Special:Undelete]]
		],
	},
	mwLinkExclude: {
		hasClass: [
			'mw-contributions-title',                                   // [[Special:GlobalWatchlist]]
		],
	},
	mwLinkDiffOnly: {},
	mwLinkRevisionOnly: {},
	mwLinkPrepend: {
		id: [
			'differences-nextlink',                                     // [[Special:Diff]]: Next edit
		],
		hasClass: [
			'mw-diff-revision-history-link-next',                       // [[Special:Diff]]: MobileDiff next edit
		],
		endsWith: [
			'→',
			'←',
		],
	},
	mwLinkAltTitle: {
		closestTo: [
			'.mw-fr-reviewlink',                                        // [[Special:Watchlist]]
			'.mw-history-histlinks',                                    // History page
		],
	},
	mwLinkContent: {
		closestTo: [
			'.mw-parser-output',
		],
	},
	mwLinkContentInside: {
		closestTo: [
			'.comment',                                                 // Edit summary in the changelists
		],
	},
};

/**
 * Local variables.
 * @type {Record<string, any>}
 */
export const local = {
	/**
	 * @type {Object<string, string>}
	 */
	messages: {},

	/**
	 * @type {Object<string, boolean>}
	 */
	settings: {},

	/**
	 * @type {Object<string, *>}
	 */
	defaults: {},

	/**
	 * @type {Function}
	 */
	require: null,

	/**
	 * @type {string|null}
	 */
	language: null,

	/**
	 * @type {string|null}
	 */
	linkSelector: null,

	/**
	 * @type {boolean}
	 */
	mwIsAnon: true,

	/**
	 * @type {string|null}
	 */
	mwEndPoint: null,

	/**
	 * @type {URL}
	 */
	mwEndPointUrl: null,

	/**
	 * @type {string|null}
	 */
	mwAction: null,

	/**
	 * @type {string|null}
	 */
	mwArticlePath: null,

	/**
	 * @type {string|null}
	 */
	mwCanonicalSpecialPageName: null,

	/**
	 * @type {mw.Title}
	 */
	mwTitle: null,

	/**
	 * @type {string|null}
	 */
	mwTitleText: null,

	/**
	 * @type {Array<string>}
	 */
	mwServers: [],

	/**
	 * @type {Array<string>}
	 */
	mwServerNames: [],

	/**
	 * @type {Object<string, string>}
	 */
	specialPagesLocalPrefixed: {},

	/**
	 * @type {Object<string, string>}
	 */
	specialPagesAliases: {},

	/**
	 * @type {Array<string>}
	 */
	specialPagesAliasesFlat: [],

	/**
	 * @type {Object<string, string>}
	 */
	specialPagesAliasesPrefixed: {},

	/**
	 * @type {Object<string, RegExp>}
	 */
	specialPagesAliasesRegExp: {},

	/**
	 * @type {Array<string>}
	 */
	specialPagesAliasesPrefixedFlat: [],

	/**
	 * @type {Object<string, string>}
	 */
	specialPagesLinksAliases: {},

	/**
	 * @type {Array<string>}
	 */
	specialPagesLinksAliasesFlat: [],

	/**
	 * @type {Object<string, string>}
	 */
	specialPagesLinksAliasesPrefixed: {},

	/**
	 * @type {Array<string>}
	 */
	specialPagesLinksAliasesPrefixedFlat: [],

	/**
	 * @type {RegExp}
	 */
	specialPagesLinksFlatRegExp: null,

	/**
	 * @type {RegExp}
	 */
	articlePathRegExp: null,

	/**
	 * @type {MutationObserver}
	 */
	mutationObserver: null,

	/**
	 * @type {IntersectionObserver}
	 */
	interactionObserver: null,
};

/**
 * Script timer loggers.
 * @type {Record<string, Number>}
 */
export const timers = {};