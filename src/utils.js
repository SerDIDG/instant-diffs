import id from './id';

import Button from './Button';

/******* BASIC TYPES *******/

/**
 * Checks if a string is empty.
 * @param {*} str
 * @returns {boolean}
 */
export function isEmpty( str ) {
    return !str || str.length === 0;
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
 * Checks whether the event is a click or a keypress of Enter or Space.
 * Used to make links and buttons accessible via both mouse and keyboard navigation.
 * @param {MouseEvent|KeyboardEvent} event
 * @returns {boolean}
 */
export function isToggleKey( event ) {
    return event.type === 'click' || ( event.type === 'keypress' && [ 'Enter', 'Space' ].includes( event.code ) );
}

/******* COMMON *******/

/**
 * Adds an origin prefix to the href.
 * @param {string} path
 * @returns {string}
 */
export function getOrigin( path ) {
    return `${ id.config.origin }${ path }`;
}

/**
 * Filters list from the unavailable dependencies.
 * @param {array} data
 * @returns {array}
 */
export function getDependencies( data ) {
    return data.filter( item => {
        const state = mw.loader.getState( item );
        return state && ![ 'error', 'missing' ].includes( state );
    } );
}

/**
 * Checks if a script is allowed to execute on the certain pages.
 * @returns {boolean}
 */
export function isAllowed() {
    return id.config.include.actions.includes( mw.config.get( 'wgAction' ) ) &&
        !id.config.exclude.pages.includes( mw.config.get( 'wgCanonicalSpecialPageName' ) );
}

/**
 * Calls a console object method with a script's prefix attached before the message.
 * @param {string} type
 * @param {string} message
 * @param {array} [data]
 */
export function log( type, message, data = [] ) {
    const logger = console[ type ];
    if ( !logger ) return;
    logger( `${ msg( 'name' ) }: ${ message }.`, ...data );
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
        diff = `${ diff }ms`;
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

/******* DEFAULTS *******/

/**
 * Gets a setting option stored in the config.
 * @param {string|undefined} key for specific option, or undefined for the option's object
 * @returns {*|object} a specific option, or the option's object
 */
export function defaults( key ) {
    return key ? id.defaults[ key ] : id.defaults;
}

export function setDefaults( data, save ) {
    id.defaults = $.extend( {}, id.defaults, data );

    // Temporary save defaults to the local User Options
    if ( save && !id.local.mwIsAnon ) {
        try {
            mw.user.options.set( id.config.settingsPrefix, JSON.stringify( id.defaults ) );
        } catch ( e ) {}
    }
}

export function processDefaults() {
    // Set settings stored in the Local Storage
    try {
        const settings = mw.storage.getObject( `${ id.config.prefix }-settings` );
        setDefaults( settings, false );
    } catch ( e ) {}

    // Set settings stored in the User Options
    if ( !id.local.mwIsAnon ) {
        try {
            const settings = JSON.parse( mw.user.options.get( `${ id.config.settingsPrefix }-settings` ) );
            setDefaults( settings, false );
        } catch ( e ) {}
    }
}

/******* MESSAGES *******/

export function msg() {
    const params = Array.from( arguments );
    if ( !isEmpty( params[ 0 ] ) ) {
        params[ 0 ] = getMsgKey( params[ 0 ] );
    }
    return mw.msg.apply( mw.msg, params );
}

export function isMessageExists( str ) {
    if ( isEmpty( str ) ) return false;
    return mw.message( getMsgKey( str ) ).exists();
}

export function processMessages() {
    const language = mw.config.get( 'wgUserLanguage' );

    // Do not set strings when the language is qqx for debagging
    if ( language === 'qqx' ) {
        id.local.language = language;
        return;
    }

    // Merge current language strings with English for fallback
    id.local.language = id.i18n[ language ] ? language : 'en';
    id.local.messages = id.i18n[ id.local.language ];
    if ( id.local.language !== 'en' ) {
        id.local.messages = $.extend( {}, id.i18n.en, id.local.messages );
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

export function getErrorMessage( str, page, error ) {
    str = isMessageExists( str ) ? str : 'error-generic';
    page = $.extend( {}, page );
    error = $.extend( {}, error );
    return msg(
        str,
        page.oldid || page.curid,
        page.diff,
        page.titleText || page.title,
        error.message || msg( 'error-wasted' ),
    );
}

export function notifyError( str, page, error, silent ) {
    silent = !isBoolean( silent ) ? defaults( 'notifyErrors' ) : silent;

    // Silent all errors if a document is hidden or in the process of unloading
    if ( id.isUnloading ) return;
    if ( document.visibilityState === 'hidden' ) {
        silent = true;
    }

    const message = getErrorMessage( str, page, error );
    if ( silent ) {
        log( 'warn', message, [ page, error ] );
        return;
    }

    if ( typeof mw !== 'undefined' && mw.notify ) {
        const $container = $( '<div>' )
            .addClass( 'instantDiffs-notification' );
        const $label = $( '<div>' )
            .addClass( 'instantDiffs-notification-label' )
            .appendTo( $container );
        const $link = new Button( {
            label: msg( 'name' ),
            href: getOrigin( `/wiki/${ id.config.link }` ),
            target: '_blank',
            container: $label,
        } );
        const $message = $( '<div>' )
            .text( message )
            .appendTo( $container );

        mw.notify( $container, { type: 'error', tag: `${ id.config.prefix }-${ error.type }` } );
    }

    log( 'error', message, [ page, error ] );
}

/******* LINKS *******/

export function getLinks( $container ) {
    if ( typeof $container === 'undefined' ) {
        $container = getBodyContentNode();
    }
    return $container.find( id.local.linkSelector );
}

export function getLabel( type ) {
    const label = id.config.labels[ type ];
    if ( !label ) return;
    return typeof label === 'object' ? label[ document.dir ] : label;
}

export function getTarget( isInDialog ) {
    return defaults( 'openInNewTab' ) && isInDialog ? '_blank' : '_self';
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

export function getWikilink( page, pageParams, options ) {
    pageParams = { ...pageParams };
    options = {
        href: null,
        type: 'diff',
        minify: false,
        relative: true,
        wikilink: true,
        wikilinkPreset: 'special',
        ...options,
    };

    // Get diff \ oldid params
    let attr = null;
    if ( !isEmpty( pageParams.oldid ) && !isEmpty( pageParams.diff ) ) {
        attr = `${ pageParams.oldid }/${ pageParams.diff }`;
    } else if ( !isEmpty( pageParams.oldid ) ) {
        attr = pageParams.oldid;
    } else if ( !isEmpty( pageParams.diff ) ) {
        attr = pageParams.diff;
    } else if ( !isEmpty( pageParams.curid ) ) {
        attr = pageParams.curid;
    }

    // Get preset
    const preset = id.config.wikilinkPresets[ options.wikilinkPreset ] || id.config.wikilinkPresets.special;

    // Format wikilink
    const wikilink = preset[ options.type ];
    return wikilink
        .replace( '$1', attr )
        .replace( '$href', options.href )
        .replace( '$msg', msg( `wikilink-${ options.type }` ) );
}

export function getHref( page, pageParams, options ) {
    pageParams = { ...pageParams };
    options = {
        type: 'diff',
        relative: true,
        minify: false,
        wikilink: false,
        wikilinkPreset: null,
        ...options,
    };

    // Get url with the current origin
    let url;
    if ( !isEmpty( page.title ) ) {
        url = new URL( mw.util.getUrl( page.title, pageParams ), id.local.mwEndPointUrl.origin );
    } else {
        url = new URL( id.local.mwEndPointUrl );
        url.search = new URLSearchParams( pageParams ).toString();
    }

    // Minify href
    if ( options.minify ) {
        url.pathname = '';
        url.searchParams.delete( 'title' );
    }

    // Get relative or absolute href
    options.href = decodeURIComponent( options.relative ? ( url.pathname + url.search + url.hash ) : url.toString() );

    // Get wikilink
    if ( options.wikilink ) {
        return getWikilink( page, pageParams, options );
    }

    return options.href;
}

export function getTypeHref( page, pageParams, options ) {
    pageParams = { ...pageParams };
    options = {
        type: 'diff',
        typeVariant: null,
        ...options,
    };

    // Validate options
    if ( options.typeVariant === 'page' ) {
        options.type = 'page';
    }

    // Validate page params for diffs
    if ( options.type === 'diff' ) {
        if ( isEmpty( page.diff ) && isValidDir( page.direction ) ) {
            page.diff = page.direction;
        }

        if ( isValidID( page.oldid ) && isValidID( page.diff ) ) {
            pageParams.oldid = page.oldid;
            pageParams.diff = page.diff;
        } else if ( isValidID( page.oldid ) ) {
            if ( isValidDir( page.diff ) && page.diff !== 'prev' ) {
                pageParams.oldid = page.oldid;
                pageParams.diff = page.diff;
            } else {
                pageParams.diff = page.oldid;
            }
        } else if ( isValidID( page.diff ) ) {
            if ( isValidDir( page.oldid ) && page.oldid !== 'prev' ) {
                pageParams.oldid = page.diff;
                pageParams.diff = page.oldid;
            } else {
                pageParams.diff = page.diff;
            }
        }
    }

    // Validate page params for revisions
    if ( options.type === 'revision' ) {
        if ( isEmpty( page.direction ) && isValidDir( page.diff ) ) {
            page.direction = page.diff;
        }

        if ( isValidID( page.revid ) ) {
            pageParams.oldid = page.revid;
        } else if ( isValidID( page.oldid ) ) {
            pageParams.oldid = page.oldid;
            if ( isValidDir( page.direction ) && page.direction === 'next' ) {
                pageParams.direction = page.direction;
            }
        }
    }

    // Validate page params for pages
    if ( options.type === 'page' ) {
        pageParams.curid = page.curid;
    }

    return getHref( page, pageParams, options );
}

export function getSplitSpecialUrl( title ) {
    const titleParts = title.split( '/' );
    const page = {};

    // Check for the 'Special:PermanentLink'
    const permanentLink = id.local.specialPagesAliasesPrefixed[ 'Special:PermanentLink' ];
    if ( permanentLink.includes( titleParts[ 0 ] ) ) {
        page.oldid = titleParts[ 1 ];
        return page;
    }

    // Check for the 'Special:Redirect'
    const redirect = id.local.specialPagesAliasesPrefixed[ 'Special:Redirect' ];
    if ( redirect.includes( titleParts[ 0 ] ) ) {
        if ( titleParts[ 1 ] === 'revision' ) {
            page.oldid = titleParts[ 2 ];
            return page;
        }
        if ( titleParts[ 1 ] === 'page' ) {
            page.curid = titleParts[ 2 ];
            return page;
        }
        return page;
    }

    // Other special pages
    if ( titleParts.length > 1 ) {
        page.diff = titleParts.pop();
    }
    if ( titleParts.length > 1 ) {
        page.oldid = titleParts.pop();
    }
    return page;
}

export function getTitleFromUrl( href ) {
    try {
        const url = new URL( href );
        return url.searchParams.get( 'title' );
    } catch ( e ) {
        return null;
    }
}

export function getOldidFromUrl( href ) {
    try {
        const url = new URL( href );
        return url.searchParams.get( 'oldid' );
    } catch ( e ) {
        return null;
    }
}

export function getHashFromUrl( href ) {
    try {
        const url = new URL( href );
        return url.hash;
    } catch ( e ) {
        return null;
    }
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

export function extendPage( page, params = {} ) {
    if ( isValidID( params.oldid ) ) {
        page.oldid = params.oldid;
    }
    if ( !isEmpty( params.title ) ) {
        page.title = params.title;
    }
    if ( !isEmpty( params.section ) ) {
        page.section = params.section.replace( /^#/, '' );
    }

    if ( !isEmpty( page.title ) ) {
        page.mwTitle = new mw.Title( page.title );
        page.titleText = page.mwTitle.getPrefixedText();

        if ( !isEmpty( page.section ) ) {
            page.titleSection = [ page.title, page.section ].join( '#' );
            page.titleTextSection = [ page.titleText, page.section ].join( '#' );
        }

        page.href = mw.util.getUrl( page.titleSection || page.title );
    }

    return page;
}

/******* MW *******/

export function getMobileServer() {
    /**
     * @type {string}
     */
    const server = mw.config.get( 'wgServer' );

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

export function backupMWConfig() {
    const data = {};
    id.config.mwConfigBackup.forEach( key => {
        data[ key ] = mw.config.get( key );
    } );
    return data;
}

export function restoreMWConfig( data ) {
    id.config.mwConfigBackup.forEach( key => {
        if ( typeof data[ key ] !== 'undefined' ) {
            mw.config.set( key, data[ key ] );
        }
    } );
}

/**
 * Checks if a link matches a given selectors preset.
 * @param {HTMLElement} node
 * @param {object} [preset]
 * @param {array} [preset.id]
 * @param {array} [preset.hasClass]
 * @param {array} [preset.hasChild]
 * @param {array} [preset.closestTo]
 * @returns {boolean}
 */
export function isMWLink( node, preset ) {
    let isConfirmed = false;

    // Validate preset
    preset = preset || id.config.mwLink;

    // Check if a node id matches
    if ( preset.id ) {
        isConfirmed = preset.id.some( entry => ( node.id === entry ) );
        if ( isConfirmed ) return isConfirmed;
    }

    // Check if a node contains a className
    if ( preset.hasClass ) {
        isConfirmed = preset.hasClass.some( entry => node.classList.contains( entry ) );
        if ( isConfirmed ) return isConfirmed;
    }

    // Check if a node contains children by a selector
    if ( preset.hasChild ) {
        isConfirmed = preset.hasChild.some( entry => node.querySelector( entry ) );
        if ( isConfirmed ) return isConfirmed;
    }

    // Check if a node is a child of a parent by a selector
    if ( preset.closestTo ) {
        isConfirmed = preset.closestTo.some( entry => node.closest( entry ) );
    }
    return isConfirmed;
}

export function getMWDiffLine( item ) {
    // ChangeLists
    if ( id.config.changeLists.includes( mw.config.get( 'wgCanonicalSpecialPageName' ) ) ) {
        return item.link.closest( '.mw-changeslist-line' );
    }

    // E.g. Contributions page, etc
    return item.link.closest( 'li, tr' );
}

export function getMWDiffLineTitle( item ) {
    const selector = id.config.mwLineTitle.selector.join( ',' );
    item.$title = item.$line.find( selector );
    if ( item.$title?.length === 0 ) return;

    const title = item.$title.attr( 'title' );
    return !isEmpty( title ) ? title : item.$title.text();
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

/******* OOUI *******/

export function applyOoUiPolyfill() {
    // "findFirstSelectedItem" method was added in the MediaWiki 1.39 / wmf.23
    if ( !isFunction( OO.ui.RadioSelectWidget.prototype.findFirstSelectedItem ) ) {
        OO.ui.RadioSelectWidget.prototype.findFirstSelectedItem = function () {
            const selected = this.findSelectedItems();
            return Array.isArray( selected ) ? selected[ 0 ] || null : selected;
        };
    }
}

export function renderOoUiElement( $element ) {
    return new OO.ui.Element( { $element } );
}

export function getWindowManager() {
    // Define custom dialog sizes
    OO.ui.WindowManager.static.sizes.instantDiffs = {
        width: 1200,
    };

    const manager = new OO.ui.WindowManager();
    $( document.body ).append( manager.$element );
    return manager;
}

/**
 * Add some properties to the inheritor class that the (ES5)
 * {@link https://www.mediawiki.org/wiki/OOjs/Inheritance OOUI inheritance mechanism} uses. It
 * partly replicates the operations made in
 * {@link https://doc.wikimedia.org/oojs/master/OO.html#.inheritClass OO.inheritClass}.
 * @author {@link https://github.com/jwbth Jack who built the house}
 *
 * @param {Function} targetClass Inheritor class.
 * @returns {Function}
 */
export function tweakUserOoUiClass( targetClass ) {
    const originClass = Object.getPrototypeOf( targetClass );
    OO.initClass( originClass );
    targetClass.static = Object.create( originClass.static );
    Object.keys( targetClass )
        .filter( ( key ) => key !== 'static' )
        .forEach( ( key ) => {
            targetClass.static[ key ] = targetClass[ key ];
        } );
    targetClass.parent = targetClass.super = originClass;
    return targetClass;
}

/******* ELEMENTS *******/

export function clipboardWrite( text, callback ) {
    if ( isEmpty( text ) ) return;

    const success = () => {
        mw.notify( msg( 'copy-link-copied' ), { tag: `${ id.config.prefix }-copyLink` } );
        isFunction( callback ) && callback( true );
    };

    const error = () => {
        mw.notify( msg( 'copy-link-error' ), { tag: `${ id.config.prefix }-copyLink`, type: 'error' } );
        isFunction( callback ) && callback( false );
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
}

export function addClick( node, handler, useAltKey = true ) {
    const callback = ( event ) => {
        if ( event ) {
            // Prevent default behavior for Space\Enter buttons
            if ( !isToggleKey( event ) || event.button || event.ctrlKey ) return;

            event.preventDefault();

            // Open a link in the current tab if the alt key is pressed
            if ( useAltKey && event.altKey && !isEmpty( node.href ) ) {
                window.location.href = node.href;
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
        node.dataset.altTitle = `${ node.dataset.altTitle } ${ msg( 'alt-click' ) }`.trim();
        node.dataset.origTitle = node.title;

        // Set alt title temporary to increase compatibility with the other scripts
        node.addEventListener( 'mouseenter', () => ( node.title = node.dataset.altTitle ) );
        node.addEventListener( 'mouseleave', () => ( node.title = node.dataset.origTitle ) );
    }

    node.addEventListener( 'click', callback );
    node.addEventListener( 'keypress', callback );
}

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
    params = $.extend( {
        short: null,
        long: null,
        iconBefore: null,
        iconAfter: null,
    }, params );

    if ( !isEmpty( params.short ) ) {
        params.short = `<span>${ params.short }</span>`;
    }
    if ( !isEmpty( params.long ) ) {
        params.long = `<span>${ params.long }</span>`;
    }
    if ( !isEmpty( params.iconBefore ) ) {
        params.iconBefore = `<i>${ params.iconBefore }</i>`;
    }
    if ( !isEmpty( params.iconAfter ) ) {
        params.iconAfter = `<i>${ params.iconAfter }</i>`;
    }

    const short = [ params.iconBefore, params.short, params.iconAfter ]
        .filter( item => !isEmpty( item ) )
        .join( '' );

    const long = [ params.iconBefore, params.long, params.iconAfter ]
        .filter( item => !isEmpty( item ) )
        .join( '' );

    return $( `
        <span class="instantDiffs-label instantDiffs-label--long">${ long }</span>
        <span class="instantDiffs-label instantDiffs-label--short">${ short }</span>
    ` );
}

export function renderBox( params ) {
    params = $.extend( {
        $content: null,
        type: 'notice',
    }, params );

    const $icon = $( '<span>' )
        .addClass( 'cdx-message__icon' );

    const $content = $( '<div>' )
        .addClass( 'cdx-message__content' )
        .append( params.$content );

    return $( '<div>' )
        .addClass( [ 'cdx-message', 'cdx-message--block', `cdx-message--${ params.type }`, 'plainlinks' ] )
        .append( [ $icon, $content ] );
}