import hyperscript from 'hyperscript';

import id from './id';

/******* BASIC TYPES *******/

/**
 * Checks if a string or an array is empty.
 * @param {*} value
 * @returns {boolean}
 */
export function isEmpty( value ) {
    return !value || value.length === 0;
}

/**
 * Checks if an object is empty.
 * @param {*} value
 * @returns {boolean}
 */
export function isEmptyObject( value ) {
    return !value || !isObject( value ) || Object.keys( value ).length === 0;
}

/**
 * Checks if a value is a string.
 * @param {*} value
 * @returns {boolean}
 */
export function isString( value ) {
    return typeof value === 'string';
}

/**
 * Checks if a value is a boolean.
 * @param {*} value
 * @returns {boolean}
 */
export function isBoolean( value ) {
    return typeof value === 'boolean';
}

/**
 * Checks if a value is a function.
 * @param {*} value
 * @returns {boolean}
 */
export function isFunction( value ) {
    return typeof value === 'function';
}

/**
 * Checks if a value is an array.
 * @param {*} value
 * @returns {boolean}
 */
export function isArray( value ) {
    return Array.isArray( value );
}

/**
 * Checks if a value is an object.
 * @param {*} value
 * @returns {boolean}
 */
export function isObject( value ) {
    return typeof value === 'object';
}

/**
 * Checks whether the event is a click or a keypress of Enter or Space.
 * Used to make links and buttons accessible via both mouse and keyboard navigation.
 * @param {MouseEvent|KeyboardEvent} event
 * @returns {boolean}
 */
export function isToggleKey( event ) {
    return event.type === 'click' || ( event.type === 'keypress' && [ 'Enter', 'Space' ].includes( event.code ) );
}

/**
 * Checks whether the current action element is typeable.
 * @returns {boolean}
 */
export function isActiveElement() {
    const nonTypeableInputs = [ 'button', 'submit', 'reset', 'file', 'checkbox', 'radio', 'range', 'color', 'image', 'hidden' ];
    /**
     * @type {HTMLElement}
     */
    const element = document.activeElement;
    return !element ||
        element.contentEditable === 'true' ||
        element.tagName === 'TEXTAREA' ||
        ( element.tagName === 'INPUT' && !nonTypeableInputs.includes( element.type ) );
}

/******* COMMON *******/

/**
 * Adds an origin prefix to the href.
 * @param {string} path
 * @returns {string}
 */
export function origin( path ) {
    return `${ id.config.origin }${ path }`;
}

/**
 * Filters list from the unavailable dependencies.
 * @param {Array} data
 * @returns {Array}
 */
export function getDependencies( data ) {
    return data.filter( item => {
        const state = mw.loader.getState( item );
        return state && ![ 'error', 'missing' ].includes( state );
    } );
}

/**
 * Filters list from the available dependencies.
 * @param {Array} data
 * @returns {Array}
 */
export function getMissingDependencies( data ) {
    return data.filter( item => {
        const state = mw.loader.getState( item );
        return ![ 'ready', 'registered' ].includes( state );
    } );
}

/**
 * Calls a module required function loaded via "mw.loader" and stored in the singleton.
 * @param {string} name
 * @return {*}
 */
export function moduleRequire( name ) {
    return id.local.require( name );
}

/**
 * Checks if a current runed version of Instant Diffs is different from a last used.
 * @returns {boolean}
 */
export function isNew() {
    return id.local.lastVesrion !== id.config.version;
}

/**
 * Checks if a script is allowed to execute on the certain pages.
 * @returns {boolean}
 */
export function isAllowed() {
    return !defaults( 'standalone' ) &&
        id.config.include.actions.includes( mw.config.get( 'wgAction' ) ) &&
        !id.config.exclude.pages.includes( mw.config.get( 'wgCanonicalSpecialPageName' ) );
}

/**
 * Checks if a hostname is foreign.
 * @param {string} hostname
 * @return {boolean}
 */
export function isForeign( hostname ) {
    return !isEmpty( hostname ) && !id.local.mwServerNames.includes( hostname );
}

/**
 * Checks if the MobileFrontend extension is enabled.
 * @return {boolean}
 */
export function isMF() {
    return document.readyState === 'complete'
        ? document.body.classList.contains( 'mw-mf' )
        : !isEmpty( mw.config.get( 'wgMFMode' ) );
}

/**
 * Calls a console object method with a script's prefix attached before the message.
 * @param {string} type
 * @param {string} message
 * @param {Array} [data]
 */
export function log( type, message, data = [] ) {
    const logger = console[ type ];
    if ( !logger ) return;
    if ( !/\.$/.test( message ) ) {
        message = `${ message }.`;
    }
    logger( `${ msg( 'script-name' ) }: ${ message }`, ...data );
}

/**
 * Logs a time difference between start and end.
 * @param {string} name
 * @param {number} start
 * @param {number} end
 */
export function logTimer( name, start, end ) {
    let diff = end - start;
    if ( diff < 1000 ) {
        diff = `${ Math.round( diff ) }ms`;
    } else {
        diff = `${ ( diff / 1000 ).toFixed( 2 ) }s`;
    }
    log( 'info', `${ name }: ${ diff }` );
}

/**
 * Checks if a given breakpoint matched in the window.matchMedia.
 * @param {string} breakpoint
 * @returns {boolean}
 */
export function isBreakpoint( breakpoint ) {
    breakpoint = id.config.breakpoints[ breakpoint ];
    return breakpoint ? window.matchMedia( breakpoint ) : false;
}

/**
 * Delays callback execution by two animation frames to ensure DOM updates are complete.
 * @param {Function} callback
 * @description Uses double requestAnimationFrame to guarantee the callback runs after
 * both layout and paint phases are complete, useful for DOM measurements after changes.
 */
export function onSchedule( callback ) {
    requestAnimationFrame( () => {
        requestAnimationFrame( callback );
    } );
}

/**
 * Formats string to the DB format.
 * @param {string} str
 * @return {string}
 */
export function spacesToUnderlines( str ) {
    return str.replace( / /g, '_' );
}

/**
 * Semantic Versioning Comparing
 * @see {@link https://gist.github.com/iwill/a83038623ba4fef6abb9efca87ae9ccb}
 * @see {@link https://semver.org/}
 * @see {@link https://stackoverflow.com/a/65687141/456536}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator#options}
 */
export function semverCompare( a, b ) {
    a = a.split( '-' ).shift();
    b = b.split( '-' ).shift();
    return a.localeCompare( b, undefined, { numeric: true, sensitivity: 'case', caseFirst: 'upper' } );
}

/******* DEFAULTS *******/

/**
 * Gets a setting default stored in the config.
 * @param {string} [key] for specific option, or undefined for the option's object
 * @returns {*|object} a specific option, or the option's object
 */
export function defaults( key ) {
    return key ? id.local.defaults[ key ] : id.local.defaults;
}

/**
 * Applies the setting defaults to the singleton and saves to the Local Storage.
 * If second parameter is true, also saves to the Greasemonkey storage (if available)
 * and to the local MW User Options.
 * @param {Object} settings the setting options data
 * @param {boolean} [saveUserOptions] save the setting options to the local User Options
 */
export function setDefaults( settings, saveUserOptions ) {
    id.local.defaults = { ...id.local.defaults, ...settings };

    // Save options only declarative in the settings
    const userSettings = Object.fromEntries(
        Object.entries( id.local.defaults ).filter( ( [ key ] ) => key in id.config.settings ),
    );

    // Save defaults to the Local Storage
    mw.storage.setObject( `${ id.config.prefix }-settings`, userSettings );

    if ( saveUserOptions ) {
        // Save defaults to the Greasemonkey storage
        if ( isFunction( id.GM?.setValue ) ) {
            id.GM.setValue( 'settings', JSON.stringify( userSettings ) );
        }

        // Save defaults to the local MW User Options
        if ( !id.local.mwIsAnon ) {
            try {
                mw.user.options.set( id.config.settingsPrefix, JSON.stringify( userSettings ) );
            } catch {}
        }
    }
}

/**
 * Merges the settings defaults stored in the different storages:
 * Local Storage, Greasemonkey storage (if available), local MW User Options;
 * then sets them to the singleton without saving.
 */
export async function processDefaults() {
    let settings = {};

    // Get settings stored in the Local Storage
    try {
        settings = { ...settings, ...mw.storage.getObject( `${ id.config.prefix }-settings` ) };
    } catch {}

    // Get settings stored in the Greasemonkey storage
    if ( isFunction( id.GM?.getValue ) ) {
        try {
            settings = { ...settings, ...JSON.parse( await id.GM.getValue( 'settings' ) ) };
        } catch {}
    }

    // Get settings stored in the local MW User Options
    if ( !id.local.mwIsAnon ) {
        try {
            settings = { ...settings, ...JSON.parse( mw.user.options.get( `${ id.config.settingsPrefix }-settings` ) ) };
        } catch {}
    }

    setDefaults( settings, false );
}

/**
 * Parses currentScript src href for the setting defaults.
 * @return {Object}
 */
export function getQueryDefaults() {
    const settings = parseQuery( document.currentScript?.src )?.instantdiffs || {};
    for ( const [ key, value ] of Object.entries( settings ) ) {
        settings[ key ] = value === 'true' ? true : value === 'false' ? false : value;
    }
    return settings;
}

/**
 * Gets a setting option stored in the config.
 * @param {string} [key] for specific option, or undefined for the option's object
 * @returns {*|object} a specific option, or the option's object
 */
export function settings( key ) {
    return key ? id.local.settings[ key ] : id.local.settings;
}

/******* MESSAGES *******/

export function msg() {
    return mw.msg.apply( mw.msg, getMsgParams( arguments ) );
}

export function hint( str ) {
    str = `hint-${ str }`;
    return `[${ msg( str ) }]`;
}

export function msgHint( str, hintStr, showHint = true ) {
    str = msg( str );
    if ( showHint ) {
        str = `${ str } ${ hint( hintStr ) }`;
    }
    return str.trim();
}

export function msgParse() {
    return mw.message.apply( mw.message, getMsgParams( arguments ) ).parse();
}

export function msgDom() {
    return mw.message.apply( mw.message, getMsgParams( arguments ) ).parseDom();
}

export function textDom( text ) {
    mw.messages.set( { [ getMsgKey( 'buffer' ) ]: text } );
    return msgDom( 'buffer' );
}

export function isMessageExists( str ) {
    if ( isEmpty( str ) ) return false;
    return mw.message( getMsgKey( str ) ).exists();
}

export function processMessages() {
    id.local.userLanguage = mw.config.get( 'wgUserLanguage' );

    // Do not set strings when the language is qqx for debagging
    if ( id.local.userLanguage === 'qqx' ) {
        id.local.language = id.local.userLanguage;
        return;
    }

    // Merge current language strings with English for fallback
    id.local.language = id.i18n[ id.local.userLanguage ] ? id.local.userLanguage : 'en';
    id.local.messages = id.i18n[ id.local.language ];
    if ( id.local.language !== 'en' ) {
        id.local.messages = { ...id.i18n.en, ...id.local.messages };
    }

    // Set strings key-value pairs
    const processedMessages = {};
    for ( const [ key, value ] of Object.entries( id.local.messages ) ) {
        processedMessages[ getMsgKey( key ) ] = value;
    }

    mw.messages.set( processedMessages );
}

export function getMsgKey( str ) {
    return `${ id.config.messagePrefix }-${ str }`;
}

export function getMsgParams( params ) {
    if ( !isEmpty( params[ 0 ] ) ) {
        params[ 0 ] = getMsgKey( params[ 0 ] );
    }
    return params;
}

export function getErrorStatusText( status ) {
    if ( !Number.isInteger( status ) ) return;

    if ( status === 0 ) {
        return msg( 'error-offline' );
    }
    if ( status >= 400 && status < 500 ) {
        return msg( 'error-revision-missing' );
    }
    if ( status > 500 ) {
        return msg( 'error-server' );
    }
}

export function getErrorMessage( str, error, article ) {
    str = isMessageExists( str ) ? str : 'error-generic';
    error = { ...error };
    article = { ...article?.values };

    let message = msg(
        str,
        article.oldid || article.curid,
        article.diff,
        article.titleText || article.title,
        error.message || msg( 'error-wasted' ),
    );
    if ( !/\.$/.test( message ) ) {
        message = `${ message }.`;
    }

    return message;
}

export function notifyError( str, error, article, silent ) {
    silent = isBoolean( silent ) ? silent : !defaults( 'notifyErrors' );

    // Silent all errors if a document is hidden or in the process of unloading
    if ( id.isUnloading ) return;
    if ( document.visibilityState === 'hidden' ) {
        silent = true;
    }

    const message = getErrorMessage( str, error, article );
    if ( silent ) {
        log( 'warn', message, [ article, error ] );
        return;
    }

    if ( typeof mw !== 'undefined' && mw.notify ) {
        const content = h( 'div.instantDiffs-notification',
            h( 'div.instantDiffs-notification-label',
                h( 'a', { href: origin( `/wiki/${ id.config.link }` ), target: '_blank' }, msg( 'script-name' ) ),
            ),
            ht( message ),
        );
        mw.notify( content, { type: 'error', tag: `${ id.config.prefix }-${ error.type }` } );
    }

    log( 'error', message, [ article, error ] );
}

/******* LINKS *******/

export function getLabel( type ) {
    const label = id.config.labels[ type ];
    if ( !label ) return;
    return typeof label === 'object' ? label[ document.dir ] : label;
}

export function getTarget( isInWindow ) {
    return defaults( 'openInNewTab' ) && isInWindow ? '_blank' : '_self';
}

export function getHref( href ) {
    if ( /^\/\//.test( href ) ) {
        href = `https:${ href }`;
    }
    return href;
}

export function getURL( href ) {
    try {
        return new URL( getHref( href ) );
    } catch {
        return null;
    }
}

export function getParamFromUrl( param, href ) {
    const url = getURL( href );
    if ( !url ) return;
    return url.searchParams.get( param );
}

export function getComponentFromUrl( param, href ) {
    const url = getURL( href );
    if ( !url ) return;
    return url[ param ];
}

export function parseQuery( href ) {
    const url = getURL( href );
    if ( !url ) return;

    const result = {};

    for ( const [ key, value ] of url.searchParams ) {
        const match = key.match( /^([^[]+)\[([^\]]+)\]$/ );
        if ( match ) {
            const [ , parent, child ] = match;
            result[ parent ] = result[ parent ] || {};
            result[ parent ][ child ] = value;
        } else {
            result[ key ] = value;
        }
    }

    return result;
}

/******* DIFF \ REVISION *******/

export function isValidID( value ) {
    return !isEmpty( value ) && !isNaN( value );
}

export function isValidDir( value ) {
    return !isEmpty( value ) && [ 'next', 'prev', 'cur' ].includes( value );
}

export function isCompareHidden( data ) {
    return data && ( data.fromtexthidden || data.totexthidden );
}

export function isRevisionHidden( data ) {
    return data && data.slots?.main?.texthidden;
}

export function getCompareTitle( compare ) {
    if ( compare.torevid ) {
        return compare.totitle;
    }
    if ( compare.fromrevid ) {
        return compare.fromtitle;
    }
    return null;
}

export function getCompareSection( compare ) {
    let sectionMatch;
    if ( compare.torevid ) {
        if ( !isEmpty( compare.tocomment ) ) {
            sectionMatch = compare.tocomment.match( id.config.sectionRegExp );
        }
        return sectionMatch && sectionMatch[ 1 ] || null;
    }
    if ( compare.fromrevid ) {
        if ( !isEmpty( compare.fromcomment ) ) {
            sectionMatch = compare.fromcomment.match( id.config.sectionRegExp );
        }
        return sectionMatch && sectionMatch[ 1 ] || null;
    }
    return null;
}

export function getRevisionSection( revision ) {
    let sectionMatch;
    if ( revision && !isEmpty( revision.comment ) ) {
        sectionMatch = revision.comment.match( id.config.sectionRegExp );
    }
    return sectionMatch && sectionMatch[ 1 ] || null;
}

/******* MW *******/

/**
 * Gets predicted mobile server.
 * @return {string|undefined}
 */
export function getMobileServer() {
    const server = mw.config.get( 'wgServer' ).replace( /^https?:/, '' );
    const prefix = new RegExp( `^//www\\.` ).test( server ) ? 'www.' : '';

    const language = mw.config.get( 'wgContentLanguage' );
    if ( !isEmpty( language ) ) {
        const regExp = new RegExp( `^//${ language }\\.` );
        if ( regExp.test( server ) ) {
            return server.replace( regExp, `//${ language }.m.` );
        }
    }

    const project = mw.config.get( 'wgNoticeProject' );
    if ( !isEmpty( project ) ) {
        const regExp = new RegExp( `^//${ prefix }${ project }\\.` );
        if ( regExp.test( server ) ) {
            return server.replace( regExp, !isEmpty( prefix ) ? `//m.${ project }.` : `//${ project }.m.` );
        }
    }
}

export function getBodyContentNode() {
    let $content = $( id.config.bodyContentSelector );
    if ( !$content || $content.length === 0 ) {
        $content = $( document.body );
    }
    return $content;
}

export function getSpecialPageAliases( data, name ) {
    const namespace = 'Special';
    const localNamespace = mw.config.get( 'wgFormattedNamespaces' )[ '-1' ];
    const nameParts = name.split( ':' );
    const localName = data[ name ];
    const localNameParts = localName.split( ':' );

    // Collect aliases variants
    nameParts[ 0 ] = localNamespace;
    localNameParts[ 0 ] = namespace;

    const values = [ name, localName, nameParts.join( ':' ), localNameParts.join( ':' ) ];
    return [ ...new Set( values ) ];
}

/******* ELEMENTS *******/

export function h( tag, props = {}, ...children ) {
    Object.keys( props ).forEach( ( key ) => {
        let value = props[ key ];
        if ( isEmpty( value ) ) return;

        switch ( key ) {
            case 'id':
                tag = `${ tag }#${ value.trim() }`;
                delete props[ key ];
                break;

            case 'class':
                value = Array.isArray( value )
                    ? value.map( entry => entry.trim() ).join( '.' )
                    : value.trim().replace( /\s+/g, '.' );
                tag = `${ tag }.${ value }`;
                delete props[ key ];
                break;
        }
    } );
    return hyperscript( tag, props, ...children );
}

export function ht( text ) {
    return document.createTextNode( text );
}

export function hs( ...children ) {
    return children.reduce( ( accumulator, node ) => accumulator + node.outerHTML, '' );
}

export function hf( ...children ) {
    const fragment = new DocumentFragment();
    for ( const child of children ) {
        fragment.append( child );
    }
    return fragment;
}

export function hj( $node ) {
    return hf( ...$node.toArray() );
}

export function clipboardWrite( text, callback ) {
    const success = () => {
        mw.notify( msg( 'copy-link-copied' ), { tag: `${ id.config.prefix }-copyLink` } );
        isFunction( callback ) && callback( true );
    };

    const error = () => {
        mw.notify( msg( 'copy-link-error' ), { tag: `${ id.config.prefix }-copyLink`, type: 'error' } );
        isFunction( callback ) && callback( false );
    };

    if ( isEmpty( text ) || !isString( text ) ) {
        return error();
    }

    if ( navigator.clipboard?.writeText ) {
        navigator.clipboard.writeText( text )
            .then( success )
            .catch( error );
    } else {
        const textarea = h( 'textarea', { value: text } );
        document.body.append( textarea );
        textarea.select();

        const successful = document.execCommand( 'copy' );
        textarea.remove();

        successful ? success() : error();
    }
}

export function addClick( node, handler, useAltKey = true ) {
    const callback = ( event ) => {
        if ( event ) {
            // Prevent default behavior for Space\Enter buttons
            if ( !isToggleKey( event ) || event.button || event.ctrlKey ) return;

            event.preventDefault();

            // Simulate link default behavior if the alt key is pressed
            if ( useAltKey && event.altKey && !isEmpty( node.href ) ) {
                if ( node.target === '_blank' ) {
                    window.open( node.href, '_blank' ).focus();
                } else {
                    window.location.href = node.href;
                }
                return;
            }
        }
        handler( event );
    };

    // Add a title that indicates about alternative click action
    if ( useAltKey && !isEmpty( node.href ) ) {
        if ( isEmpty( node.dataset.altTitle ) ) {
            node.dataset.altTitle = node.title;
        }
        node.dataset.altTitle = `${ node.dataset.altTitle } ${ hint( 'alt-click' ) }`.trim();
        node.dataset.origTitle = node.title;

        // Set alt title temporary to increase compatibility with the other scripts
        node.addEventListener( 'mouseenter', () => ( node.title = node.dataset.altTitle ) );
        node.addEventListener( 'mouseleave', () => ( node.title = node.dataset.origTitle ) );
    }

    node.addEventListener( 'click', callback );
    node.addEventListener( 'keypress', callback );
}

/**
 * Appends an element to the provided context.
 * @param {HTMLElement|DocumentFragment|JQuery<HTMLElement>} node
 * @param {HTMLElement|JQuery<HTMLElement>} container
 * @param {('insertBefore'|'insertAfter'|'prependTo'|'appendTo')} [insertMethod]
 */
export function embed( node, container, insertMethod = 'appendTo' ) {
    if ( !container ) return;

    if ( container instanceof jQuery ) {
        const $element = node instanceof jQuery ? node : $( node );
        $element[ insertMethod ]( container );
        return;
    }

    const element = node instanceof jQuery ? node.get( 0 ) : node;
    switch ( insertMethod ) {
        case 'insertBefore' :
            container.before( element );
            break;

        case 'insertAfter' :
            container.after( element );
            break;

        case 'prependTo' :
            container.prepend( element );
            break;

        case 'appendTo' :
        default:
            container.append( element );
            break;
    }
}

export function setHTML( container, value ) {
    if ( !container ) return;

    if ( container instanceof jQuery ) {
        container.html( value );
        return;
    }

    if ( !( Element.prototype.setHTML instanceof Function ) ) {
        Element.prototype.setHTML = function ( html ) {
            this.innerHTML = html;
        };
    }

    container.setHTML( value );
}

/**
 * Add a hostname to the link hrefs.
 * @author {@link https://github.com/jwbth Jack who built the house}
 * @param {JQuery} $content
 * @param {string} url
 * @param {boolean} [hashOnly]
 */
export function addBaseToLinks( $content, url, hashOnly = false ) {
    let baseUrl;
    try {
        baseUrl = new URL( url, `https://${ location.hostname }` );
    } catch {
        return;
    }

    const hashOnlyHandler = ( i, el ) => {
        $( el )
            .attr( 'href', 'https://' + baseUrl.hostname + baseUrl.pathname + $( el ).attr( 'href' ) );
    };

    const handler = ( i, el ) => {
        $( el )
            .attr( 'href', 'https://' + baseUrl.hostname + $( el ).attr( 'href' ).replace( /special:mylanguage\//i, '' ) )
            .attr( 'title', ( $( el ).attr( 'title' ) || '' ).replace( /special:mylanguage\//i, '' ) );
    };

    $content
        .filter( 'a[href^="#"]' )
        .each( hashOnlyHandler );

    $content
        .find( 'a[href^="#"]' )
        .each( hashOnlyHandler );

    if ( !hashOnly ) {
        $content
            .filter( 'a[href^="/"]:not([href^="//"])' )
            .each( handler );

        $content
            .find( 'a[href^="/"]:not([href^="//"])' )
            .each( handler );
    }
}

export function addTargetToLinks( $content ) {
    if ( !defaults( 'openInNewTab' ) ) return;

    const handler = ( i, el ) => {
        // Add target attribute only to links with non-empty href.
        // Some scripts add links with href="#" - bypass those as well.
        const href = el.getAttribute( 'href' );
        if ( isEmpty( href ) || href === '#' ) return;

        el.setAttribute( 'target', '_blank' );
    };

    $content
        .filter( 'a:not(.mw-thanks-thank-link, .jquery-confirmable-element)' )
        .each( handler );

    $content
        .find( 'a:not(.mw-thanks-thank-link, .jquery-confirmable-element)' )
        .each( handler );
}

export function getPlaceholderClasses( modifiers = [] ) {
    const classes = [ 'instantDiffs-panel-placeholder' ];
    modifiers.forEach( modifier => classes.push( `instantDiffs-panel-placeholder--${ modifier }` ) );
    if ( defaults( 'showLink' ) ) {
        classes.push( 'has-link' );
    }
    return classes;
}

export function renderPlaceholder() {
    return $( '<span>' ).addClass( getPlaceholderClasses() );
}

export function renderLabel( params ) {
    params = {
        short: null,
        long: null,
        iconBefore: null,
        iconAfter: null,
        ...params,
    };

    if ( !isEmpty( params.short ) ) {
        params.short = h( 'span', params.short );
    }
    if ( !isEmpty( params.long ) ) {
        params.long = h( 'span', params.long );
    }
    if ( !isEmpty( params.iconBefore ) ) {
        params.iconBefore = h( 'i', params.iconBefore );
    }
    if ( !isEmpty( params.iconAfter ) ) {
        params.iconAfter = h( 'i', params.iconAfter );
    }

    const short = [ params.iconBefore, params.short, params.iconAfter ]
        .filter( entry => !isEmpty( entry ) )
        .map( entry => entry.cloneNode( true ) );

    const long = [ params.iconBefore, params.long, params.iconAfter ]
        .filter( entry => !isEmpty( entry ) )
        .map( entry => entry.cloneNode( true ) );

    return hf(
        h( 'div.instantDiffs-label.instantDiffs-label--long', ...long ),
        h( 'div.instantDiffs-label.instantDiffs-label--short', ...short ),
    );
}

/**
 * Renders a message box in the Codex styles.
 * @param {Object} [params]
 * @param {JQuery<HTMLElement>} [params.$content] a content element
 * @param {string} [params.type] a notice type
 * @returns {HTMLElement}
 *
 * ToDo: migrate to the mw.util.messageBox.
 */
export function renderMessageBox( params ) {
    params = {
        $content: null,
        type: 'notice',
        ...params,
    };

    const nodes = params.$content.toArray();

    return h( 'div', {
            class: [
                'cdx-message',
                'cdx-message--block',
                `cdx-message--${ params.type }`,
                'plainlinks',
            ],
        },
        h( 'span.cdx-message__icon' ),
        h( 'div.cdx-message__content', ...nodes ),
    );
}

export function renderSuccessBox( params ) {
    params = {
        content: null,
        image: null,
        alt: null,
        ...params,
    };

    return h( 'div.instantDiffs-success-box',
        h( 'img', {
            src: `${ id.config.commonsAssetsPath }${ params.image }`,
            alt: params.alt,
        } ),
        h( 'h5', params.content ),
    );
}