/**
 * Class representing a Config Manager.
 */
class ConfigManager {
    /**
     * @private
     * @type {import('types-mediawiki/mw/Map').ExtensibleMap}
     */
    config = mw.config;

    /**
     * @private
     * @type {Object<string|*>}
     */
    values = {};

    /**
     * @private
     * @type {Object<string|*>}
     */
    backup = {};

    /**
     * Create a Config Manager instance.
     * @param {Object<string|*>} values key-value pairs
     * @param {import('types-mediawiki/mw/Map').ExtensibleMap} [config] a config object to process
     */
    constructor( values, config ) {
        if ( config ) {
            this.config = config;
        }
        this.setValues( values );
    }

    /**
     * Adds value to the local object and backups original values from the mw.config.
     * @param {string} key
     * @param {*} value
     */
    set( key, value ) {
        if ( !Object.hasOwn( this.backup, key ) ) {
            this.backup[ key ] = this.config.get( key );
        }
        this.values[ key ] = value;
    }

    /**
     * Adds key-value pairs to the local object and backups original values from the mw.config.
     * @param {Object<string|*>} values
     */
    setValues( values ) {
        for ( const [ key, value ] of Object.entries( values ) ) {
            this.set( key, value );
        }
    }

    /**
     * Gets a local value.
     * @param {string} key
     * @return {*}
     */
    get( key ) {
        return this.values[ key ];
    }

    /**
     * Gets a local object.
     * @return {Object<string|*>}
     */
    getValues() {
        return this.values;
    }

    /**
     * Applies local values to mw.config.
     */
    apply() {
        for ( const [ key, value ] of Object.entries( this.values ) ) {
            if ( value !== undefined ) {
                this.config.set( key, value );
            }
        }
    }

    /**
     * Restores backup of original values in the mw.config.
     */
    restore() {
        for ( const [ key, value ] of Object.entries( this.backup ) ) {
            if ( value !== undefined ) {
                this.config.set( key, value );
            }
        }
    }
}

export default ConfigManager;