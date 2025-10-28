import id from './id';
import * as utils from './utils';
import { getModuleExport } from './utils-oojs';
import { getHref, getHrefAbsolute } from './utils-article';

import Api from './Api';
import Article from './Article';
import view from './View';

const { h, hf, ht, hj } = utils;

/******* DIFF TABLE *******/

/**
 * Renders the <table> structure for displaying diff table.
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
                !data.texthidden
                    ? h( 'a', { href: getHref( article ) }, mw.msg( title, getUserDate( data.timestamp ) ) )
                    : h( 'span', { class: 'history-deleted' }, mw.msg( title, getUserDate( data.timestamp ) ) ),
            ),
        ),
        h( 'div', { id: `${ prefix }2` },
            !data.userhidden
                ? renderUserLink( article, data.user )
                : h( 'span', { class: [ 'mw-userlink', 'history-deleted' ] }, mw.msg( 'rev-deleted-user' ) ),
        ),
        h( 'div', { id: `${ prefix }3` },
            !data.commenthidden
                ? !utils.isEmpty( data.comment )
                    ? h( 'span', { class: [ 'comment', 'comment--without-parentheses' ], innerHTML: data.comment } )
                    : h( 'span', { class: [ 'comment', 'mw-comment-none' ] }, mw.msg( 'changeslist-nocomment' ) )
                : h( 'span', { class: [ 'comment', 'history-deleted' ] }, mw.msg( 'rev-deleted-comment' ) ),
        ),
    );
}

/**
 * Process the diff table for the revision view.
 * Dependent on 'showRevisionInfo' settings, shows right side of the table, or hides table completely.
 * @param {JQuery} $table
 */
export function processRevisionDiffTable( $table ) {
    if ( utils.defaults( 'showRevisionInfo' ) ) {
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
 * Renders the diff table user link.
 * @param {import('./Article').default} article
 * @param {string} user
 * @returns {DocumentFragment}
 */
export function renderUserLink( article, user ) {
    const title = new mw.Title( user, 2 ).getPrefixedText();
    const talkTitle = new mw.Title( user, 3 ).getPrefixedText();
    const contribsTitle = new mw.Title( `Contributions/${ user }`, -1 ).getPrefixedText();

    const links = hf(
        h( 'a', {
                class: [ 'mw-redirect', 'mw-usertoollinks-talk' ],
                title: talkTitle,
                href: getHrefAbsolute( article, mw.util.getUrl( talkTitle ) ),
            },
            mw.msg( 'talkpagelinktext' ),
        ),
        ht( mw.msg( 'pipe-separator' ) ),
        h( 'a', {
                class: [ 'mw-redirect', 'mw-usertoollinks-talk' ],
                title: contribsTitle,
                href: getHrefAbsolute( article, mw.util.getUrl( contribsTitle ) ),
            },
            mw.msg( 'contribslink' ),
        ),
    );

    return hf(
        h( 'a', {
                class: 'mw-userlink',
                title: title,
                href: getHrefAbsolute( article, mw.util.getUrl( title ) ),
            },
            h( 'bdi', user ),
        ),
        ht( mw.msg( 'word-separator' ) ),
        h( 'span', { class: 'mw-usertoollinks' },
            hj( mw.message( 'parentheses', links ).parseDom() ),
        ),
    );
}

/**
 * Gets a date in the user format.
 * Uses "mediawiki.DateFormatter" module for formatting if exists, otherwise uses "date.toLocaleString".
 * @param {string|Date} date a date string, or a Date instance
 * @returns {string|undefined}
 */
export function getUserDate( date ) {
    if ( utils.isString( date ) ) {
        date = new Date( date );
    }
    if ( !( date instanceof Date ) ) return;

    const DateFormatter = utils.moduleRequire( 'mediawiki.DateFormatter' );
    return DateFormatter
        ? DateFormatter.forUser().formatTimeAndDate( date )
        : date.toLocaleString();
}

/**
 * Renders mobile diff footer.
 * @returns {DocumentFragment}
 */
export function renderMobileDiffFooter( data ) {
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

    return h( 'div', { class: [ 'mw-diff-mobile-footer' ] } ,
        !data.userhidden
            ? renderUserLink( article, data.user )
            : h( 'span', { class: [ 'mw-userlink', 'history-deleted' ] }, mw.msg( 'rev-deleted-user' ) ),
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

    // Make rollback link confirmable
    $container.confirmable( {
        i18n: {
            confirm: mw.msg( 'rollback-confirmation-confirm' ),
            yes: mw.msg( 'rollback-confirmation-yes' ),
            no: mw.msg( 'rollback-confirmation-no' ),
        },
        delegate: '.mw-rollback-link a[data-mw="interface"]',
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
        title: mw.util.getParamValue( 'title', link.href ),
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

            // Remove link wrapper (including the spinner).
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

/******* WIKILAMBDA *******/

/**
 * Restores the WikiLambda app. Partially copied from the WikiLambda extension code:
 * @see {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/extensions/WikiLambda/+/refs/heads/master/resources/ext.wikilambda.app/index.js}
 * @param {JQuery} $container
 * @returns {boolean} a render status
 */
export function restoreWikiLambda( $container ) {
    if ( !$container || $container.length === 0 ) return false;

    mw.loader.using( [ '@wikimedia/codex', 'ext.wikilambda.app' ] ).then( require => {
        const { createMwApp } = require( 'vue' );
        const { createPinia } = require( 'pinia' );
        const { useMainStore, App } = require( 'ext.wikilambda.app' );

        // Conditionally mount App.vue:
        // If wgWikilambda config variable is available, we want to mount WikiLambda App.
        if ( mw.config.get( 'wgWikiLambda' ) ) {
            const pinia = createPinia();
            const store = useMainStore( pinia );
            window.vueInstance = createMwApp( Object.assign( {
                provide: () => ( {
                    viewmode: store.getViewMode,
                } ),
            }, App ) )
                .use( pinia )
                .mount( $container.get( 0 ) );
        }
    } );

    return true;
}

/******* FILE MEDIA INFO *******/

/**
 * Partially restores file media info.
 * @param {JQuery<HTMLElement>} $content
 * @returns {Element|undefined}
 */
export async function restoreFileMediaInfo( $content ) {
    if ( !$content || $content.length === 0 ) return;

    const messages = [
        'wikibasemediainfo-filepage-fileinfo-heading',
        'wikibasemediainfo-filepage-structured-data-heading',
    ];
    await Api.loadMessage( messages );

    return renderFileMediaInfo( $content );
}

function renderFileMediaInfo( $content ) {
    const captionsTab = new OO.ui.TabPanelLayout( 'captions', {
        expanded: false,
        label: mw.msg( 'wikibasemediainfo-filepage-fileinfo-heading' ),
        $content: $content.find( 'mediainfoviewcaptions' ),
    } );

    const statementsTab = new OO.ui.TabPanelLayout( 'statements', {
        expanded: false,
        label: mw.msg( 'wikibasemediainfo-filepage-structured-data-heading' ),
        $content: $content.find( 'mediainfoviewstatements' ),
    } );

    const index = new OO.ui.IndexLayout( {
        expanded: false,
        framed: false,
    } );
    index.addTabPanels( [ captionsTab, statementsTab ], 0 );

    const panel = new OO.ui.PanelLayout( {
        expanded: false,
        framed: false,
        content: [ index ],
    } );

    // Render structure
    return h( 'div', { class: 'instantDiffs-page-mediaInfo' },
        panel.$element.get( 0 ),
    );
}