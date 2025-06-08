/**
 * The main script object, globally available.
 *
 * @namespace instantDiffs
 * @global
 */
self.instantDiffs ||= {};

const instantDiffs = self.instantDiffs;

/**
 * Configuration
 */
instantDiffs.config = {
    name: 'Instant Diffs',
    version: '__version__',
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
            'oojs-ui.styles.icons-content',
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
        revision: {
            6: [
                'filepage',
            ],
            14: [
                'mediawiki.page.gallery.styles',
            ],
        },
    },

    // Settings list
    settings: {
        showLink: true,
        showPageLink: true,
        highlightLine: true,
        markWatchedLine: true,
        unHideDiffs: true,
        openInNewTab: true,
        showRevisionInfo: true,
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
        showRevisionInfo: true,
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
        '.mw-fr-reviewlink a',                                          // [[Special:Watchlist]]
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
            '.mw-fr-reviewlink',                                        // [[Special:Watchlist]]
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
    mwLinkAltTitle: {
        closestTo: [
            '.mw-fr-reviewlink',										// [[Special:Watchlist]]
        ],
    },
};

/**
 * Local variables
 */
instantDiffs.local = {
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
 * Script timer loggers
 */
instantDiffs.timers = {};

export default instantDiffs;