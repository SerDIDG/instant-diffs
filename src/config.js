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
            'mediawiki.diff',
            'mediawiki.diff.styles',
            'mediawiki.interface.helpers.styles',
            'mediawiki.misc-authed-curate',
            'mediawiki.DateFormatter',
            'ext.flaggedRevs.basic',
            'ext.thanks.corethank',
            'ext.visualEditor.diffPage.init',
        ],
        settings: [
            'oojs',
            'oojs-ui-core',
            'oojs-ui-widgets',
            'oojs-ui-windows',
            'oojs-ui.styles.icons-interactions',
        ],

        // Lazy-loaded dependencies
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
            page: '[[Special:Redirect/page/$1|$msg]]',
            diff: '[[Special:Diff/$1|$msg]]',
            revision: '[[Special:PermanentLink/$1|$msg]]',
        },
    },

    // Path
    commonsAssetsPath: 'https://upload.wikimedia.org/wikipedia/commons',

    // MediaWiki config
    mwConfigBackup: [
        'wgTitle',
        'wgPageName',
        'wgRelevantPageName',
        'wgPageContentModel',
        'wgNamespaceNumber',
        'wgArticleId',
        'wgRelevantArticleId',                                          // Article ID on the special pages
        'wgCurRevisionId',
        'wgRevisionId',
        'wgDiffOldId',
        'wgDiffNewId',
        'wgCanonicalSpecialPageName',
        'wgIsProbablyEditable',
        'thanks-confirmation-required',
    ],
    mwUserOptionsBackup: [
        'visualeditor-diffmode-historical',
    ],
    skinBodyClasses: {
        'vector-2022': [ 'mw-body', 'vector-body' ],
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
        'a.mw-changeslist-diff',
        'a.mw-changeslist-diff-cur',
        'a.mw-changeslist-groupdiff',
        '.mw-fr-reviewlink a',                                          // [[Special:Watchlist]]
        '.mw-history-histlinks a',
        'a.mw-changeslist-date.mw-newpages-time',                       // [[Special:Newpages]]
        '.mw-diff-bytes + a',
        '.mw-fr-pending-changes-table a.cdx-docs-link',
        '#mw-revision-nav a',                                           // [[Special:PermanentLink]]
        '.diff-type-table #differences-prevlink',                       // [[Special:Diff]]
        '.diff-type-table #differences-nextlink',                       // [[Special:Diff]]
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
        selector: [
            '.mw-changeslist-line',                                     // Changelists
            '.mw-contributions-list li',                                // User contribution
            '.cdx-table tr',                                            // [[Special:PendingChanges]]
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
            '.comment',                                                 // Edit summary in the edit lists
        ],
    },
    mwLinkAltTitle: {
        closestTo: [
            '.mw-fr-reviewlink',                                        // [[Special:Watchlist]]
        ],
    },
};

/**
 * Local variables.
 */
export const local = {
    mwIsAnon: null,
    mwEndPoint: null,
    mwEndPointUrl: null,
    mwApi: null,
    mwArticlePath: null,
    mwServers: [],
    titleText: null,
    language: null,
    messages: {},

    snapshot: null,

    links: new Map(),
    linkSelector: null,

    specialPages: {},
    specialPagesLocal: {},
    specialPagesLocalPrefixed: {},
    specialPagesAliases: {},
    specialPagesAliasesPrefixed: {},

    specialPagesPathRegExp: null,
    specialPagesSearchRegExp: null,
    articlePathRegExp: null,
};

/**
 * Script timer loggers.
 */
export const timers = {};