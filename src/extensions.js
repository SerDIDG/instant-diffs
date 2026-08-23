import id from './id';
import * as utils from './utils';

/**
 * Extension configuration options.
 * @typedef {Object} Extensions.ExtenstionOptions
 * @property {string} name - An extension name
 * @property {boolean} [enabled=true] - Whether the extension is enabled
 * @property {(extenstion: import('./Extensions').ExtenstionOptions) => void} [enabledCondition] - Callback fired to check if an extension can be enabled
 * @property {Object<string, *>} [dependencies] - An object of dependencies
 * @property {Object<string, *>} [foreignDependencies] - An object of foreign dependencies
 * @property {Object<string, *>} [selectors] - An object of links selectors
 * @property {Object<string, (any) => void>} [hooks] - An object of Instant Diffs hooks to bind
 * @property {(extenstion: import('./Extensions').ExtenstionOptions) => void} [onReady] - Callback fired when the extension is ready
 */

/**
 * Class representing the Extensions manager.
 */
class Extensions {
	/**
	 * @private
	 * @type {Object<string|Extensions.ExtenstionOptions>}
	 */
	registry = {};

	/**
	 * Registers an extension.
	 * @param {Extensions.ExtenstionOptions} extension - The extension configuration
	 * @return {Promise<Record|undefined>} The registered extension, or undefined if registration failed
	 */
	async register( extension ) {
		extension = {
			name: null,
			enabled: true,
			enabledCondition: null,
			dependencies: {},
			foreignDependencies: {},
			selectors: {},
			hooks: {},
			onReady: () => {},
			...extension,
		};

		if ( utils.isEmptyObject( extension ) ) {
			utils.logError( 'Extensions.register', 'Extension schema is empty.', extension );
			return;
		}
		if ( utils.isEmpty( extension.name ) ) {
			utils.logError( 'Extensions.register', 'Extension name is not provided.', extension );
			return;
		}
		if ( this.registry[ extension.name ] ) {
			utils.logError( 'Extensions.register', `Extension with name "${ extension.name }" is already registered.`, extension );
			return;
		}

		// Validate
		extension.enabled = await this.checkEnabledCondition( extension );

		// Register
		this.registry[ extension.name ] = extension;

		// Process
		if ( extension.enabled ) {
			this.processDependencies( extension );
			this.processForeignDependencies( extension );
			this.processSelectors( extension );
			this.processHooks( extension );
			this.processCallbacks( extension );
		}

		return extension;
	}

	/**
	 * @private
	 */
	async checkEnabledCondition( extension ) {
		if ( !extension.enabled ) return false;
		if ( !utils.isFunction( extension.enabledCondition ) ) return extension.enabled;
		return await extension.enabledCondition.call( this, extension );
	}

	/**
	 * @private
	 */
	processDependencies( extension ) {
		if ( utils.isEmptyObject( extension.dependencies ) ) return;
		id.config.dependencies = utils.deepMergeWith( [ id.config.dependencies, extension.dependencies ], {
			mergeArrays: true,
		} );
	}

	/**
	 * @private
	 */
	processForeignDependencies( extension ) {
		if ( utils.isEmptyObject( extension.foreignDependencies ) ) return;
		id.config.foreignDependencies = utils.deepMergeWith( [ id.config.foreignDependencies, extension.foreignDependencies ], {
			mergeArrays: true,
		} );
	}

	/**
	 * @private
	 */
	processSelectors( extension ) {
		if ( utils.isEmptyObject( extension.selectors ) ) return;
		id.config.selectors = utils.deepMergeWith( [ id.config.selectors, extension.selectors ], {
			mergeArrays: true,
		} );
	}

	/**
	 * @private
	 */
	processHooks( extension ) {
		if ( utils.isEmptyObject( extension.hooks ) ) return;
		for ( const [ hook, handler ] of Object.entries( extension.hooks ) ) {
			mw.hook( `${ id.config.prefix }.${ hook }` ).add( handler );
		}
	}

	/**
	 * @private
	 */
	processCallbacks( extension ) {
		if ( utils.isFunction( extension.onReady ) ) {
			extension.onReady( extension );
		}
	}
}

export default new Extensions();