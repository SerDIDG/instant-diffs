/**
 * Configuration.
 * @type {Object<string, *>}
 */
export const config = {
    version: '__version__',
    link: 'Instant_Diffs',
    discussion: 'Talk:Instant_Diffs',
    outname: '__outname__',
    outdir: '__outdir__',
    origin: '__origin__',
    prefix: 'instantDiffs',
    messagePrefix: 'instant-diffs',
    settingsPrefix: 'userjs-instantDiffs',

    dependencies: {
        styles: '__styles__',
        messages: '__messages__',
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
                'ext.checkUser.userInfoCard',
                'ext.checkUser.styles',
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
            146: [                                                      // Lexeme:
                'wikibase.lexeme.styles',
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
    },

    // Settings list
    settings: {
        showLink: true,
        showPageLink: true,
        highlightLine: true,
        markWatchedLine: true,
        viewWidth: true,
        showDiffTools: true,
        showRevisionInfo: true,
        unHideDiffs: true,
        openInNewTab: true,
        linksFormat: true,
        wikilinksFormat: true,
        enableMobile: true,
        enableHotkeys: true,
        showMenuIcons: true,
        notifyErrors: true,
    },

    // Settings defaults
    defaults: {
        debug: '__debug__' === 'true',
        GM: false,                                                      // Greasemonkey mode
        standalone: false,                                              // Standalone mode
        storageExpiry: 60 * 60 * 24,                                    // Cache local storage for 1 day
        logTimers: true,
        showLink: false,
        showPageLink: true,
        highlightLine: true,
        markWatchedLine: true,
        viewWidth: 'standard',
        showDiffTools: true,
        showRevisionInfo: true,
        unHideDiffs: true,
        openInNewTab: true,
        linksFormat: 'full',
        wikilinksFormat: 'special',
        enableMobile: true,
        enableHotkeys: true,
        showMenuIcons: true,
        notifyErrors: true,
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
        'Special:PermanentLink',
        'Special:MobileDiff',
        'Special:Redirect',
        'Special:ComparePages',
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
    },

    // Content selectors
    bodyContentSelector: '#bodyContent',
    contentSelector: '#mw-content-text',

    // Link selectors
    specialPagesLinks: [
        'Special:Diff',
        'Special:PermanentLink',
        'Special:MobileDiff',
        'Special:Redirect',
    ],
    specialPagesLinksSearchRegExp: '^($1)',                             // $1 - joined specialPages
    specialPagesLinksPathRegExp: '$1($2)',                              // $1 - article path, $2 - joined specialPages
    specialPagesLinksSelector: 'a[title^="$1"]',                        // $1 - each of the specialPages

    articlePathRegExp: '^($1)',                                         // $1 - article path
    sectionRegExp: /^\/\*\s*(.*?)\s*\*\/.*$/,

    linkSelector: [                                                     // $1 - server
        'a[data-instantdiffs-link]',                                    // Manually marked links
        'a.external[href^="$1"]',
        'a.mw-changeslist-date',                                        // Changelists (revision)
        'a.mw-changeslist-diff',                                        // Changelists (diff)
        'a.mw-changeslist-diff-cur',                                    // Changelists (diff to current)
        'a.mw-changeslist-groupdiff',                                   // Changelists (diffs in group)
        '.mw-changeslist-line a.extiw',                                 // Changelists (foreign wiki link)
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
        'li[data-afl-log-id] a',                                        // [[Special:AbuseLog]]
        'li[class^="mw-tag"] a',                                        // [[Special:EditTags]]
        'li.mw-logline-tag a',                                          // [[Special:EditTags]]
        'a.ext-globalwatchlist-diff',                                   // [[Special:GlobalWatchlist]]
        '.wikibase-statementview-references a',                         // Wikibase statements references
        'a.edit-summary-time',                                          // [[Extension:Translate]]
        //'.mw-undelete-revlist a',                                     // [[Special:Undelete]]
    ],

    mwLine: {
        selector: [
            '.mw-changeslist-line',                                     // Changelists
            '.mw-contributions-list li',                                // Contributions
            '.mw-fr-pending-changes-table tr',                          // [[Special:PendingChanges]]
            '.mw-special-AbuseLog li[data-afl-log-id]',                 // [[Special:AbuseLog]]
            '.mw-special-EditTags li[class^="mw-tag"]',                 // [[Special:EditTags]]
            '.mw-special-EditTags li.mw-logline-tag',                   // [[Special:EditTags]]
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
            '.mw-changeslist-line',                                     // Changelists
            '.mw-contributions-list',                                   // Contributions
            '.mw-history-histlinks',                                    // Page History
            '.mw-pager-navigation-bar + ul',
            '.mw-fr-hist-difflink',
            '#mw-fr-reviewnotice',
            '#mw-fr-revisiontag',
            '#mw-fr-revisiontag-edit',
            '#mw-fr-revision-tag-edit',
            '#mw-fr-revision-messages',                                 // Warning about pending changes at the top of the page
            '.mw-specialpage-summary',                                  // Page header on certain Special pages
            '#mw-revision-nav',                                         // [[Special:PermanentLink]] / Revision
            '.mw-fr-pending-changes-table',                             // [[Special:PendingChanges]]
            '.mw-special-AbuseLog li[data-afl-log-id]',                 // [[Special:AbuseLog]]
            '.mw-special-EditTags li[class^="mw-tag"]',                 // [[Special:EditTags]]
            '.mw-special-EditTags li.mw-logline-tag',                   // [[Special:EditTags]]
            '.wikibase-statementview-references',                       // Wikibase statement references
            '.ext-globalwatchlist-site',                                // [[Special:GlobalWatchlist]]
            '.tux-message-editor',                                      // [[Extension:Translate]]
            '.mw-pt-translate-header',                                  // Page header added by [[Extension:Translate]]
            //'.mw-undelete-revlist',                                   // [[Special:Undelete]]
        ],
    },
    mwLinkDiffOnly: {
        id: [
            'differences-prevlink',                                     // [[Special:Diff]]: Previous edit
            'differences-nextlink',                                     // [[Special:Diff]]: Next edit
        ],
        closestTo: [
            '#mw-revision-nav',                                         // [[Special:PermanentLink]] / Revision
        ],
    },
    mwLinkPrepend: {
        id: [
            'differences-nextlink',                                     // [[Special:Diff]]: Next edit
        ],
        hasClass: [
            'mw-diff-revision-history-link-next',                       // [[Special:Diff]]: MobileDiff next edit
        ]
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
            '.comment',                                                 // Edit summary in the changelists
        ],
    },
};

/**
 * Local variables.
 * @type {Object<string, *>}
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
    specialPagesLinksPathRegExp: null,

    /**
     * @type {RegExp}
     */
    specialPagesLinksSearchRegExp: null,

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
 * @type {Object<string, Number>}
 */
export const timers = {};