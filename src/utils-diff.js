import id from './id';
import * as utils from './utils';
import { getModuleExport } from './utils-oojs';

const { h } = utils;

/******* COMMON *******/

/**
 * Get the required <table> structure for displaying diffs.
 * @returns {Element}
 */
export function renderDiffTable() {
    const nodes = {};

    nodes.container = h( 'table', {
            class: [
                'diff',
                'diff-type-table',
                `diff-editfont-${ mw.user.options.get( 'editfont' ) }`,
            ],
        },
        h( 'colgroup',
            h( 'col', { class: 'diff-marker' } ),
            h( 'col', { class: 'diff-content' } ),
            h( 'col', { class: 'diff-marker' } ),
            h( 'col', { class: 'diff-content' } ),
        ),
        nodes.head = h( 'thead',
            h( 'tr', { class: 'diff-title', lang: id.local.userLanguage },
                nodes.deleted = h( 'td', { class: [ 'diff-otitle', 'diff-side-deleted' ], colSpan: 2 } ),
                nodes.added = h( 'td', { class: [ 'diff-ntitle', 'diff-side-added' ], colSpan: 2 } ),
            ),
        ),
        nodes.body = h( 'tbody' ),
    );

    return nodes;
}

/**
 * Get a date in the user format.
 * Uses "mediawiki.DateFormatter" module for formatting if exists, otherwise uses "date.toLocaleString".
 * @param {string|Date} date a date string, or a Date instance
 * @returns {string|undefined}
 */
export function getUserDate( date ) {
    if ( utils.isString( date ) ) {
        date = new Date( date );
    }
    if ( !( date instanceof Date ) ) return;

    const formatTimeAndDate = utils.moduleRequire( 'mediawiki.DateFormatter' );
    return formatTimeAndDate
        ? formatTimeAndDate.forUser().formatTimeAndDate( date )
        : date.toLocaleString();
}

/******* INLINE FORMAT TOGGLE *******/

/**
 * Restore the Inline toggle switch button.
 * @param {JQuery} $container
 */
export function restoreInlineFormatToggle( $container ) {
    let isRendered = false;
    if (
        !$container || $container.length === 0 &&
        mw.loader.getState( 'mediawiki.diff' ) !== 'ready'
    ) {
        return isRendered;
    }

    const $inlineToggleSwitchLayout = $container.find( '#mw-diffPage-inline-toggle-switch-layout' );
    const inlineFormatToggle = getModuleExport( 'mediawiki.diff', './inlineFormatToggle.js' );

    try {
        isRendered = true;
        inlineFormatToggle( $inlineToggleSwitchLayout );
    } catch {}

    return isRendered;
}

/******* VISUAL EDITOR / DIFFS *******/

/**
 * Restore the Visual Diffs buttons.
 * @param {JQuery} $container
 */
export function restoreVisualDiffs( $container ) {
    if (
        !$container || $container.length === 0 ||
        !utils.isValidID( mw.config.get( 'wgDiffOldId' ) ) ||
        !utils.isValidID( mw.config.get( 'wgDiffNewId' ) ) ||
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

/******* ROLLBACK *******/

/**
 * Restore and implement a rollback link behavior. Partially copied from the MediaWiki Core:
 * {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/core/+/refs/heads/master/resources/src/mediawiki.misc-authed-curate/rollback.js}
 * @param {JQuery} $container
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

    id.local.mwApi.post( params )
        .then( ( data ) => {
            mw.notify( $( utils.textDom( data?.rollback?.summary ) ) );

            // Remove link wrapper (including the spinner).
            $( link ).closest( '.mw-rollback-link' ).remove();
        } )
        .catch( ( code, data ) => {
            mw.notify( $( utils.textDom( data?.error?.info ) ), { type: 'error' } );

            // Restore the link. This allows the user to try again
            // (or open it in a new window, bypassing this ajax handler).
            $spinner.remove();
            $( link ).css( 'display', '' );
        } );
}

/******* WIKILAMBDA *******/

/**
 * Restore the WikiLambda app. Partially copied from the WikiLambda extension code:
 * {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/extensions/WikiLambda/+/refs/heads/master/resources/ext.wikilambda.app/index.js}
 * @param {JQuery} $container
 */
export function restoreWikiLambda( $container ) {
    if ( !$container || $container.length === 0 ) return;

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
}

/******* FILE MEDIA INFO *******/

/**
 * Partially restore file media info.
 * @param {JQuery} $content
 * @returns {Element|undefined}
 */
export async function restoreFileMediaInfo( $content ) {
    if ( !$content || $content.length === 0 ) return;

    const messages = [
        'wikibasemediainfo-filepage-fileinfo-heading',
        'wikibasemediainfo-filepage-structured-data-heading',
    ];
    await utils.loadMessage( messages, { promise: false } );

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
    return h( 'div', { class: 'instantDiffs-view-mediaInfo' },
        panel.$element.get( 0 ),
    );
}