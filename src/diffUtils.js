import id from './id';
import * as utils from './utils';

/******* COMMON *******/

function showNotification( message, type ) {
    const params = {
        action: 'parse',
        contentmodel: 'wikitext',
        text: message,
        format: 'json',
        formatversion: 2,
        uselang: id.local.language,
    };

    id.local.mwApi
        .post( params )
        .then( ( data ) => {
            mw.notify( $( data.parse.text ), { type } );
        } );
}

/******* INLINE FORMAT TOGGLE *******/

export function restoreInlineFormatToggle( $container ) {
    let isRendered = false;
    if (
        $container.length === 0 &&
        mw.loader.getState( 'mediawiki.diff' ) !== 'ready'
    ) {
        return isRendered;
    }

    const $inlineToggleSwitchLayout = $container.find( '#mw-diffPage-inline-toggle-switch-layout' );
    const inlineFormatToggle = utils.getModuleExport( 'mediawiki.diff', './inlineFormatToggle.js' );

    try {
        isRendered = true;
        inlineFormatToggle( $inlineToggleSwitchLayout );
    } catch ( e ) {}

    return isRendered;
}

/******* VISUAL EDITOR / DIFFS *******/

export function restoreVisualDiffs( $container ) {
    if (
        $container.length === 0 ||
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
 * @param {jQuery} $container
 */
export function restoreRollbackLink( $container ) {
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
        uselang: id.local.language,
    };

    id.local.mwApi.post( params )
        .then( ( data ) => {
            showNotification( data?.rollback?.summary );

            // Remove link wrapper (including the spinner).
            $( link ).closest( '.mw-rollback-link' ).remove();
        } )
        .catch( ( code, data ) => {
            showNotification( data?.error?.info, 'error' );

            // Restore the link. This allows the user to try again
            // (or open it in a new window, bypassing this ajax handler).
            $spinner.remove();
            $( link ).css( 'display', '' );
        } );
}