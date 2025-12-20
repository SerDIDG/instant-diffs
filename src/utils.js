import hyperscript from 'hyperscript';

import id from './id';

import settings from './settings';

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
	return value && typeof value === 'object' && !Array.isArray( value );
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
 * Checks if a value is an HTML element node.
 * @param {*} value
 * @returns {boolean}
 */
export function isElement( value ) {
	return value instanceof Element || value instanceof HTMLElement;
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
 * Adds a server prefix to the href.
 * @param {string} path
 * @returns {string}
 */
export function server( path ) {
	return `${ id.config.server }${ path }`;
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
	return id.local.lastVersion !== id.config.version;
}

/**
 * Checks if a script is allowed to execute on the certain pages.
 * @returns {boolean}
 */
export function isAllowed() {
	return !settings.get( 'standalone' ) &&
		id.config.include.pageActions.includes( mw.config.get( 'wgAction' ) ) &&
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
 * Formats string to the DB format.
 * @param {string} str
 * @return {string}
 */
export function spacesToUnderlines( str ) {
	return str.replace( / /g, '_' );
}

/**
 * Semantic Versioning Comparing.
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

/**
 * Insert separator between array items.
 * @param {Array} arr - Array to process
 * @param {*} separator - Item to insert between elements
 * @returns {Array} New array with separators
 */
export function arrayIntersperse( arr, separator ) {
	if ( !Array.isArray( arr ) || arr.length === 0 ) return arr;

	const isElementSeparator = isElement( separator );

	return arr.flatMap( ( item, i ) => {
		if ( i < arr.length - 1 ) {
			const sep = isElementSeparator ? separator.cloneNode( true ) : separator;
			return [ item, sep ];
		}
		return [ item ];
	} );
}

/**
 * Check whether a value matches an entry.
 * @param {Array<*>|string} arrOrStr - Array to search in, or a string to compare
 * @param {*} entry - Value to look for or compare against
 * @returns {boolean} `true` if the entry matches, otherwise `false`
 */
export function inArray( arrOrStr, entry ) {
	if ( isArray( arrOrStr ) ) {
		return arrOrStr.includes( entry );
	}
	if ( isString( arrOrStr ) && isString( entry ) ) {
		return arrOrStr === entry;
	}
	return false;
}

/**
 * Deep merge configuration objects.
 * Arrays and primitive values are replaced, not merged.
 * @template {Record<string, any>} T
 * @param {...Partial<T>} objects - Configuration objects to merge
 * @returns {T} Merged configuration object
 * @example
 * const defaults = { api: { timeout: 5000, retries: 3 } };
 * const config = { api: { timeout: 10000 } };
 * optionsMerge(defaults, config);
 * // { api: { timeout: 10000, retries: 3 } }
 */
export function optionsMerge( ...objects ) {
	return objects.reduce( ( prev, obj ) => {
		Object.keys( obj ).forEach( key => {
			const pVal = prev[ key ];
			const oVal = obj[ key ];

			// Only deep merge plain objects, replace everything else
			if ( isObject( pVal ) && isObject( oVal ) ) {
				prev[ key ] = optionsMerge( pVal, oVal );
			} else {
				prev[ key ] = oVal;
			}
		} );

		return prev;
	}, {} );
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
		article.oldid || article.curid || article.page1 || article.rev1,
		article.diff || article.page2 || article.rev2,
		article.titleText || article.title,
		error.message || msg( 'error-wasted' ),
	);
	if ( !/\.$/.test( message ) ) {
		message = `${ message }.`;
	}

	return message;
}

export function notifyError( str, error, article, silent ) {
	silent = isBoolean( silent ) ? silent : !settings.get( 'notifyErrors' );

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
	return settings.get( 'openInNewTab' ) && isInWindow ? '_blank' : '_self';
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
	const selector = id.config.bodyContentSelector[ mw.config.get( 'skin' ) ] || id.config.bodyContentSelector.default;
	let $content = $( selector );
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

export function getCanonicalSpecialPage( value ) {
	if ( isEmpty( value ) ) return;

	try {
		const title = new mw.Title( value ).getPrefixedDb();
		for ( const [ name, aliases ] of Object.entries( id.local.specialPagesAliasesPrefixed ) ) {
			if ( aliases.includes( title ) ) {
				return name;
			}
		}
	} catch {}
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

/**
 * Get the target element from a link hash.
 * @param {string} hash - Fragment identifier (without #)
 * @param {HTMLElement|JQuery<HTMLElement>} [container] - Container to search within
 * @returns {HTMLElement|null} Target element or null if not found
 */
export function getTargetFromFragment( hash, container ) {
	if ( isEmpty( hash ) ) return null;

	// Use MediaWiki's method if no container specified
	if ( !container ) {
		return mw.util.getTargetFromFragment( hash );
	}

	// Get HTMLElement from container
	const element = container instanceof jQuery ? container[ 0 ] : container;
	if ( !element ) return null;

	// Search within container using querySelector
	const target = element.querySelector( `#${ CSS.escape( hash ) }` );
	if ( target ) return target;

	// Try with decoded hash
	const decodedHash = mw.util.percentDecodeFragment( hash );
	if ( !decodedHash ) return null;

	return element.querySelector( `#${ CSS.escape( decodedHash ) }` );
}

/**
 * Get cumulative offset of an element relative to container.
 * @param {HTMLElement|JQuery<HTMLElement>} element - Target element
 * @param {HTMLElement|JQuery<HTMLElement>} container - Container to calculate offset from
 * @returns {{top: number, left: number}|null} Cumulative offset or null if invalid
 */
export function getOffsetRelativeToContainer( element, container ) {
	// Convert jQuery to HTMLElement
	if ( element instanceof jQuery ) {
		element = element[ 0 ];
	}
	if ( container instanceof jQuery ) {
		container = container[ 0 ];
	}

	// Validate inputs
	if ( !element || !container ) return null;

	let top = 0;
	let left = 0;
	let current = element;

	// Sum up offsets until we reach the container
	while ( current && current !== container ) {
		top += current.offsetTop;
		left += current.offsetLeft;
		current = current.offsetParent;

		// Stop if we've gone past the container
		if ( current && !container.contains( current ) ) {
			break;
		}
	}

	return { top, left };
}

/**
 * Get element's outer height (equivalent to jQuery's outerHeight)
 * @param {HTMLElement|JQuery<HTMLElement>} element - Target element
 * @param {boolean} [includeMargin=false] - Include margin in height
 * @returns {number} Outer height in pixels
 */
export function outerHeight( element, includeMargin = false ) {
	// Convert jQuery to HTMLElement
	if ( element instanceof jQuery ) {
		element = element[ 0 ];
	}

	if ( !element ) return 0;

	let height = element.offsetHeight;

	if ( includeMargin ) {
		const style = getComputedStyle( element );
		height += parseFloat( style.marginTop ) || 0;
		height += parseFloat( style.marginBottom ) || 0;
	}

	return height;
}

/**
 * Removes all text nodes from the provided node.
 * @param {JQuery<HTMLElement>} $node
 */
export function clearWhitespaces( $node ) {
	if ( !$node || $node.length === 0 ) return;

	$node.contents().each( ( i, node ) => {
		if ( node.nodeType !== 3 ) return;
		node.remove();
	} );
}

export function clipboardWriteLink( text, callback ) {
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

	return callback;
}

export function removeClick( node, callback ) {
	node.removeEventListener( 'click', callback );
	node.removeEventListener( 'keypress', callback );
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
	if ( !$content ) return;

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
	if ( !settings.get( 'openInNewTab' ) ) return;

	const handler = ( i, el ) => {
		// Add a target attribute only to links with non-empty href.
		// Also bypass urls that start with hash.
		const href = el.getAttribute( 'href' );
		if ( isEmpty( href ) || /^#/.test( href ) ) return;

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
	if ( settings.get( 'showLink' ) ) {
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