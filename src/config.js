/**
 * Configuration.
 */
export const config = {
    version: '__version__',
    link: 'Instant_Diffs',
    discussion: 'Talk:Instant_Diffs',
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
            'oojs-ui.styles.icons-editing-core',
            'oojs-ui.styles.icons-editing-advanced',
            'oojs-ui.styles.icons-user',
            'oojs-ui.styles.icons-layout',
        ],
        content: [
            'jquery.confirmable',
            'mediawiki.codex.messagebox.styles',
            'mediawiki.interface.helpers.styles',
            'mediawiki.diff',
            'mediawiki.diff.styles',
            'mediawiki.misc-authed-curate',
            'mediawiki.DateFormatter',
            'ext.flaggedRevs.basic',
            'ext.visualEditor.diffPage.init',
        ],

        // Lazy-loaded dependencies
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
            ],
            14: [                                                       // Category:
                'mediawiki.page.gallery.styles',
            ],
            146: [                                                      // Lexeme:
                'wikibase.lexeme.styles',
            ],
        },

        // Foreign lazy-loaded dependencies
        foreign: {
            revision: {
                styles: {
                    6: [                                                // File:
                        'MediaWiki:Filepage.css',
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
        storageExpiry: 60 * 60 * 24,                                    // 1 day
        logTimers: true,
        showLink: false,
        showPageLink: true,
        highlightLine: true,
        markWatchedLine: true,
        showDiffTools: false,
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
        actions: [ 'view', 'history' ],
    },
    exclude: {
        pages: [],
    },
    linkExclude: {
        actions: [ 'history' ],
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
    specialPages: [
        'Special:Diff',
        'Special:PermanentLink',
        'Special:MobileDiff',
        'Special:Redirect',
    ],
    specialPagesSearchRegExp: '^($1)',                                  // $1 - joined specialPages
    specialPagesPathRegExp: '$1($2)',                                   // $1 - article path, $2 - joined specialPages
    specialPagesSelector: 'a[title^="$1"]',                             // $1 - each of the specialPages

    articlePathRegExp: '^($1)',                                         // $1 - article path
    sectionRegExp: /^\/\*\s*(.*?)\s*\*\/.*$/,

    linkSelector: [                                                     // $1 - server
        'a[data-instantdiffs-link]',
        'a.external[href*="$1"]',
        'a.mw-changeslist-date',                                        // (revision)
        'a.mw-changeslist-diff',
        'a.mw-changeslist-diff-cur',
        'a.mw-changeslist-groupdiff',
        '.mw-changeslist-line a.extiw',                                 // [[Special:Watchlist]] (foreign wiki link)
        '.mw-fr-reviewlink a',                                          // [[Special:Watchlist]] (FlaggedRevs link)
        '.mw-enhanced-rc-time a',                                       // [[Special:Watchlist]] (revision)
        '.mw-history-histlinks a',
        '.mw-diff-bytes + a',
        '.mw-fr-pending-changes-table a.cdx-docs-link',
        '#mw-revision-nav a',                                           // [[Special:PermanentLink]]
        '.diff-type-table #differences-prevlink',                       // [[Special:Diff]]
        '.diff-type-table #differences-nextlink',                       // [[Special:Diff]]
        'a.ext-globalwatchlist-diff',                                   // [[Special:GlobalWatchlist]]
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
        'GlobalWatchlist',
    ],

    mwLine: {
        selector: [
            '.mw-changeslist-line',                                     // Changelists
            '.mw-contributions-list li',                                // User contribution
            '.cdx-table tr',                                            // [[Special:PendingChanges]]
            '.ext-globalwatchlist-site li',                             // [[Special:GlobalWatchlist]]
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
            '.mw-contributions-title',                                  // User contribution
            '.mw-newpages-pagename',                                    // [[Special:Newpages]]
            '.mw-fr-pending-changes-page-title',                        // [[Special:PendingChanges]]
        ],
    },
    mwLink: {
        id: [
            'differences-prevlink',                                     // [[Special:Diff]]
            'differences-nextlink',                                     // [[Special:Diff]]
        ],
        hasClass: [
            'mw-changeslist-date',
            'mw-changeslist-diff',
            'mw-changeslist-diff-cur',
            'mw-changeslist-groupdiff',
            'mw-newpages-time',                                         // [[Special:Newpages]]
        ],
        closestTo: [
            '.mw-changeslist-line',                                     // [[Special:Watchlist]]
            '.ext-globalwatchlist-site',                                // [[Special:GlobalWatchlist]]
            '.mw-pager-navigation-bar + ul',
            '.mw-history-histlinks',
            '.mw-fr-hist-difflink',
            '.mw-fr-reviewlink',                                        // [[Special:Watchlist]]
            '#mw-fr-reviewnotice',
            '#mw-fr-revisiontag',
            '#mw-fr-revisiontag-edit',
            '#mw-fr-revision-tag-edit',
            '.mw-fr-pending-changes-table',
            '#mw-revision-nav',                                         // [[Special:PermanentLink]]
            '.mw-pt-translate-header',                                  // Page header added by the Translate extension
        ],
    },
    mwLinkDiffOnly: {
        id: [
            'differences-prevlink',                                     // [[Special:Diff]]
            'differences-nextlink',                                     // [[Special:Diff]]
        ],
        closestTo: [
            '#mw-revision-nav',                                         // [[Special:PermanentLink]]
        ],
    },
    mwLinkPrepend: {
        id: [
            'differences-nextlink',                                     // [[Special:Diff]]
        ],
    },
    mwLinkExclude: {
        closestTo: [
            '.comment',                                                 // Edit summary in the changelists
        ],
    },
    mwLinkAltTitle: {
        closestTo: [
            '.mw-fr-reviewlink',                                        // [[Special:Watchlist]]
            '.mw-history-histlinks',                                    // History page
        ],
    },
};

/**
 * Local variables.
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

    language: null,
    linkSelector: null,

    mwIsAnon: null,
    mwEndPoint: null,
    mwEndPointUrl: null,
    mwArticlePath: null,
    mwTitleText: null,
    mwServers: [],
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
     * @type {Object<string, string>}
     */
    specialPagesAliasesPrefixed: {},

    /**
     * @type {RegExp}
     */
    specialPagesPathRegExp: null,

    /**
     * @type {RegExp}
     */
    specialPagesSearchRegExp: null,

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
 */
export const timers = {};