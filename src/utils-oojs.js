import * as utils from './utils';

import view from './view';
import settings from './settings';

/**
 * Make a class conform to the structure used by OOjs' ES5-based classes, with its
 * {@link https://www.mediawiki.org/wiki/OOjs/Inheritance inheritance mechanism} and peculiar way to
 * store static properties. It partly replicates the operations made in
 * {@link https://doc.wikimedia.org/oojs/master/OO.html#.inheritClass OO.inheritClass}.
 * @author {@link https://github.com/jwbth Jack who built the house}
 *
 * @param {Function} TargetClass - Inheritor class.
 * @returns {Function}
 */
export function es6ClassToOoJsClass( TargetClass ) {
	const OriginClass = Object.getPrototypeOf( TargetClass );
	if ( OriginClass?.prototype ) {
		TargetClass.parent = TargetClass.super = OriginClass;
		OO.initClass( OriginClass );

		// Move prototype properties
		Object.getOwnPropertyNames( OriginClass.prototype )
			.filter( ( name ) => name !== 'constructor' && !( name in TargetClass.prototype ) )
			.forEach( ( name ) => {
				Object.defineProperty(
					TargetClass.prototype,
					name,
					/** @type {PropertyDescriptor} */ (
						Object.getOwnPropertyDescriptor( OriginClass.prototype, name )
					),
				);
			} );
	}

	// Move static properties
	TargetClass.static = Object.create( OriginClass?.static || null );
	Object.keys( TargetClass )
		.filter( ( key ) => ![ 'parent', 'super', 'static' ].includes( key ) )
		.forEach( ( key ) => {
			const targetClassStatic = TargetClass.static;
			targetClassStatic[ key ] = TargetClass[ key ];
		} );

	return TargetClass;
}

/**
 * Mix a class into another class creating a new one. The base class remains unchanged.
 * @author {@link https://github.com/jwbth Jack who built the house}
 *
 * @param {ConstructorLike|Constructor} Base
 * @param {ConstructorLike|Constructor} Mixin
 * @returns {Function}
 */
export function mixIntoClass( Base, Mixin ) {
	class Class extends Base {
		/**
		 * @param {any} args
		 */
		constructor( ...args ) {
			super( ...args );

			if ( 'construct' in Mixin.prototype ) {
				Mixin.prototype.construct.call( this, ...args );
			}
		}
	}

	// getMixinBaseClassPrototype() will use this name. Also makes the mixin name appear nicely in
	// developer tools.
	Object.defineProperty( Class, 'name', { value: Mixin.name } );

	OO.mixinClass( Class, Mixin );
	es6ClassToOoJsClass( Class );

	// for...in in OO.mixinClass doesn't catch prototype properties declared with the `class` syntax
	// (because they are not enumerable), so we set them manually. Alternatively, we could make them
	// enumerable in es6ClassToOoJsClass().
	Object.getOwnPropertyNames( Mixin.prototype )
		.filter( ( name ) => name !== 'constructor' )
		.forEach( ( name ) => {
			Object.defineProperty(
				Class.prototype,
				name,
				/** @type {PropertyDescriptor} */ ( Object.getOwnPropertyDescriptor( Mixin.prototype, name ) ),
			);
		} );

	return Class;
}

/**
 * Add {@link external:OO.EventEmitter OO.EventEmitter}'s methods to an arbitrary object itself, not its prototype.
 * Can be used for singletons or classes. In the latter case, the methods will be added as static.
 * @author {@link https://github.com/jwbth Jack who built the house}
 *
 * @param {Object} obj
 */
export function mixEventEmitterInObject( obj ) {
	const dummy = { prototype: {} };
	OO.mixinClass( dummy, OO.EventEmitter );
	Object.assign( obj, dummy.prototype );
	OO.EventEmitter.call( obj );
}

/**
 * Patch missing OOUI methods on older MediaWiki versions so the rest of the codebase can rely on
 * a consistent OOUI API regardless of the wiki's MediaWiki version.
 */
export function applyOoUiPolyfill() {
	// "findFirstSelectedItem" method was added in the MediaWiki 1.39 / wmf.23
	if ( !utils.isFunction( OO.ui.RadioSelectWidget.prototype.findFirstSelectedItem ) ) {
		OO.ui.RadioSelectWidget.prototype.findFirstSelectedItem = function () {
			const selected = this.findSelectedItems();
			return Array.isArray( selected ) ? selected[ 0 ] || null : selected;
		};
	}

	// "findFirstSelectedItem" method was added in the MediaWiki 1.39 / wmf.23
	if ( !utils.isFunction( OO.ui.ButtonSelectWidget.prototype.findFirstSelectedItem ) ) {
		OO.ui.ButtonSelectWidget.prototype.findFirstSelectedItem = function () {
			const selected = this.findSelectedItems();
			return Array.isArray( selected ) ? selected[ 0 ] || null : selected;
		};
	}

	// "getTeleportTarget" method was added in the MediaWiki 1.41 / wmf.25 (?)
	if ( !utils.isFunction( OO.ui.getTeleportTarget ) ) {
		OO.ui.getTeleportTarget = function () {
			return document.body;
		};
	}
}

/**
 * Un-inert floated overlay elements (notifications, popovers, etc.) that can appear in front of
 * the View dialog, by removing the `aria-hidden` and `inert` attributes the browser or
 * some extensions/gadgets apply to them when the dialog opens.
 */
export function fixFloatedElementsIsolation() {
	$( [
		'#mw-notification-area',
		'.mw-notification-area-overlay',
		'.ext-checkuser-userinfocard-popover',
		'.translatorBuddy-popup',
	] )
		.each( ( i, node ) => {
			$( node )
				.removeAttr( 'aria-hidden' )
				.removeAttr( 'inert' );
		} );
}

/**
 * Create a new {@link OO.ui.WindowManager}, append it to the OOUI
 * teleport target, and apply the current View dialog size to it.
 * @returns {OO.ui.WindowManager}
 */
export function getWindowManager() {
	// Define custom dialog size
	setViewDialogSize();

	const manager = new OO.ui.WindowManager();
	$( OO.ui.getTeleportTarget() ).append( manager.$element );
	return manager;
}

/**
 * Apply the View dialog's width, registering it under the `instantDiffs` window size and, if the
 * dialog is currently open, resizing it immediately.
 * @param {string} [size]
 */
export function setViewDialogSize( size ) {
	size = size || settings.get( 'viewWidth' ) || 'standard';

	if ( size !== 'full' ) {
		OO.ui.WindowManager.static.sizes.instantDiffs = view.constructor.sizes[ size ] || view.constructor.sizes.standard;
	}

	if ( view.isOpen ) {
		view.dialog.setSize( getViewDialogSizeName( size ) );
	}
}

/**
 * Get the {@link OO.ui.WindowManager} size name that corresponds to a View dialog width setting.
 * @param {string} [size]
 * @returns {string}
 */
export function getViewDialogSizeName( size ) {
	size = size || settings.get( 'viewWidth' ) || 'standard';
	return size === 'full' ? 'full' : 'instantDiffs';
}

/**
 * Get exported context of the module's package files. Partial recreation of the original function.
 * {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/core/+/refs/heads/master/resources/src/startup/mediawiki.loader.js#613}
 * @param {string} moduleName - Module name from the registry
 * @param {string} relativePath - Path of the file this is scoped to. Used for relative paths.
 * @returns {Function}
 */
export function getModuleExport( moduleName, relativePath ) {
	const moduleObj = mw.loader.moduleRegistry[ moduleName ];
	const relativeParts = relativePath.match( /^((?:\.\.?\/)+)(.*)$/ );
	if ( relativeParts ) {
		relativePath = `resources/src/${ moduleName }/${ relativeParts[ 2 ] }`;
	}
	return moduleObj?.packageExports[ relativePath ];
}

/**
 * Execute a registered ResourceLoader module's script, or one of its package files, if it hasn't
 * been executed yet. Used to force-load dependencies that are registered but not implicitly run.
 * @param {string} moduleName - Module name from the registry.
 * @param {string} [fileName] - Package file name to execute instead of the module's main script.
 * @returns {*}
 */
export function executeModuleScript( moduleName, fileName ) {
	const moduleObj = mw.loader.moduleRegistry[ moduleName ];
	if ( !moduleObj ) return;

	if ( fileName ) {
		const moduleHandler = moduleObj.script.files?.[ fileName ];
		return utils.isFunction( moduleHandler ) ? moduleHandler() : undefined;
	}

	const moduleHandler = moduleObj.script;
	return utils.isFunction( moduleHandler ) ? moduleHandler( $, jQuery, null, null ) : undefined;
}