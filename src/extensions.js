import id from './id';
import * as utils from './utils';

/**
 * Class representing the Extensions manager.
 */
class Extensions {
	/**
	 * @private
	 * @type {Object<string|*>}
	 */
	registry = {};

	/**
	 * Registers an extension.
	 * @param {Record} extension
	 * @return {Promise<Record|undefined>} The registered extension, or undefined if registration failed
	 */
	async register( extension ) {
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

		// Process
		if ( extension.enabled ) {
			this.processDependencies( extension );
			this.processForeignDependencies( extension );
			this.processSelectors( extension );
			this.processHooks( extension );
		}

		// Register
		this.registry[ extension.name ] = extension;
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
}

export default new Extensions();