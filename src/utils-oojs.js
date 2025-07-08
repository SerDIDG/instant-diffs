import * as utils from './utils';

/**
 * Add some properties to the inheritor class that the (ES5)
 * {@link https://www.mediawiki.org/wiki/OOjs/Inheritance OOUI inheritance mechanism} uses.
 * It partly replicates the operations made in
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

    // "getTeleportTarget" method was added in the MediaWiki 1.41 / wmf.25 (?)
    if ( !utils.isFunction( OO.ui.getTeleportTarget ) ) {
        OO.ui.getTeleportTarget = function () {
            return document.body;
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
    $( OO.ui.getTeleportTarget() ).append( manager.$element );
    return manager;
}

/**
 * Get exported context of the module's package files. Partial recreation of the original function.
 * {@link https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/core/+/refs/heads/master/resources/src/startup/mediawiki.loader.js#613}
 * @param {string} moduleName Module name from the registry
 * @param {string} relativePath Path of the file this is scoped to. Used for relative paths.
 * @return {Function}
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