import id from './id';
import * as utils from './utils';

import './styles/extensions.less';

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
	 * @return {Promise<void>}
	 */
	async register( extension ) {
		if ( utils.isEmptyObject( extension ) ) {
			utils.logException( 'Extensions:register', 'Extension schema is empty.', extension );
			return;
		}
		if ( utils.isEmpty( extension.name ) ) {
			utils.logException( 'Extensions:register', 'Extension name is not provided.', extension );
			return;
		}

		// Validate
		extension.enabled = await this.checkEnabledCondition( extension );

		// Process
		if ( extension.enabled ) {
			this.processDependencies( extension );
			this.processSelectors( extension );
			this.processHooks( extension );
		}

		// Register
		this.registry[ extension.name ] = extension;
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
	processSelectors( extension ) {
		if ( utils.isEmptyObject( extension.selectors ) ) return;
		for ( const [ name, config ] of Object.entries( extension.selectors ) ) {
			if ( !id.config[ name ] ) continue;
			id.config[ name ] = utils.deepMergeWith( [ id.config[ name ], config ], {
				mergeArrays: true,
			} );
		}
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