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
 * @param {Function} TargetClass Inheritor class.
 * @returns {Function}
 */
export function tweakUserOoUiClass( TargetClass ) {
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
			const targetClassStatic = /** @type {AnyByKey} */ ( TargetClass.static );
			targetClassStatic[ key ] = TargetClass[ key ];
		} );

	return TargetClass;
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

export function getWindowManager() {
	// Define custom dialog size
	setViewDialogSize();

	const manager = new OO.ui.WindowManager();
	$( OO.ui.getTeleportTarget() ).append( manager.$element );
	return manager;
}

export function setViewDialogSize( size ) {
	size = size || settings.get( 'viewWidth' ) || 'standard';

	if ( size !== 'full' ) {
		OO.ui.WindowManager.static.sizes.instantDiffs = view.constructor.sizes[ size ] || view.constructor.sizes.standard;
	}

	if ( view.isOpen ) {
		view.dialog.setSize( getViewDialogSizeName( size ) );
	}
}

export function getViewDialogSizeName( size ) {
	size = size || settings.get( 'viewWidth' ) || 'standard';
	return size === 'full' ? 'full' : 'instantDiffs';
}

/**
 * Get exported context of the module's package files. Partial recreation of the original function.
 * {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/core/+/refs/heads/master/resources/src/startup/mediawiki.loader.js#613}
 * @param {string} moduleName Module name from the registry
 * @param {string} relativePath Path of the file this is scoped to. Used for relative paths.
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

export function executeModuleScript( moduleName ) {
	const moduleObj = mw.loader.moduleRegistry[ moduleName ];
	return moduleObj?.script( $, jQuery, null, null );
}