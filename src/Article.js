import id from './id';
import { isEmpty, isString, isValidDir, isValidID } from './utils';
import { getRevID } from './utils-article';

class Article {
    /**
     * @type {Object}
     */
    values = {
        type: null,
        typeVariant: null,
    };

    /**
     * @type {Object}
     */
    mw = {
        api: id.local.mwApi,
    };

    /**
     * @type {boolean}
     */
    isValid = false;

    /**
     * @type {boolean}
     */
    isForeign = false;

    /**
     * @type {boolean}
     */
    isHidden = false;

    constructor( values ) {
        if ( values ) {
            this.set( values );
        }
    }

    set( values ) {
        this.values = { ...this.values, ...this.validateValues( values ) };
        this.isValid = this.validate();
    }

    setValue( name, value ) {
        this.values[ name ] = value;
    }

    get( name ) {
        return this.values[ name ];
    }

    getMW( name ) {
        return this.mw[ name ];
    }

    /**
     * @private
     */
    validate() {
        // Get revision id if possible from the provided diff and oldid
        this.values.revid = getRevID( this );

        // Validate title
        if ( !isEmpty( this.values.title ) || !isEmpty( this.values.section ) ) {
            this.setTitle();
        }

        // Validate origin
        if ( !isEmpty( this.values.origin ) ) {
            this.setOrigin();
        }

        // Check if a page type is a revision
        if ( isValidID( this.values.oldid ) && isEmpty( this.values.diff ) ) {
            this.values.type = 'revision';
            return true;
        }

        // Check if a page type is a diff
        if ( isValidID( this.values.diff ) || isValidID( this.values.oldid ) ) {
            this.values.type = 'diff';

            // Swap parameters if oldid is a direction and a title is empty
            if ( isEmpty( this.values.title ) && isValidDir( this.values.oldid ) ) {
                const dir = this.values.oldid;
                this.values.oldid = this.values.diff;
                this.values.diff = dir;
            }

            // Swap parameters if oldid is empty: special pages do not have a page title attribute
            if ( isEmpty( this.values.oldid ) ) {
                this.values.oldid = this.values.diff;
                this.values.diff = this.values.direction;
            }

            // Fix a tenet bug
            if (
                isValidID( this.values.oldid ) &&
                isValidID( this.values.diff ) &&
                parseInt( this.values.oldid ) > parseInt( this.values.diff )
            ) {
                const diff = this.values.oldid;
                this.values.oldid = this.values.diff;
                this.values.diff = diff;
            }

            return true;
        }

        // Check if a page type is a diff
        if ( !isEmpty( this.values.title ) && isValidDir( this.values.diff ) ) {
            this.values.type = 'diff';
            return true;
        }

        // Check if a page type is a lastest revision
        if ( isValidID( this.values.curid ) ) {
            this.values.type = 'revision';
            this.values.typeVariant = 'page';
            return true;
        }

        return false;
    }

    /**
     * @private
     */
    validateValues( values ) {
        // Fix common user mistake with unnecessary pipeline following after the ids.
        if ( !isEmpty( values.diff ) && isString( values.diff ) && values.diff.indexOf( '|' ) > -1 ) {
            values.diff = values.diff.split( '|' ).shift();
        }
        if ( !isEmpty( values.oldid ) && isString( values.oldid ) && values.oldid.indexOf( '|' ) > -1 ) {
            values.oldid = values.oldid.split( '|' ).shift();
        }
        if ( !isEmpty( values.curid ) && isString( values.curid ) && values.curid.indexOf( '|' ) > -1 ) {
            values.curid = values.curid.split( '|' ).shift();
        }

        // Validate components
        if ( [ 0, '0' ].includes( values.oldid ) ) {
            delete values.oldid;
        }
        if ( [ 0, '0', 'current' ].includes( values.diff ) ) {
            values.diff = 'cur';
        }
        if ( !isValidDir( values.direction ) ) {
            values.direction = 'prev';
        }

        // Validate section
        if ( !isEmpty( values.section ) ) {
            values.section = values.section.replace( /^#/, '' );
        }

        return values;
    }

    /**
     * @private
     */
    setOrigin() {
        // Set index and api endpoints
        this.isForeign = window.location.origin !== this.values.origin;

        this.mw.endPoint = `${ this.values.origin }${ mw.util.wikiScript( 'index' ) }`;
        this.mw.endPointUrl = new URL( this.mw.endPoint );

        this.mw.apiEndPoint = `${ this.values.origin }${ mw.util.wikiScript( 'api' ) }`;
        this.mw.api = !this.isForeign ? id.local.mwApi : new mw.ForeignApi( this.mw.apiEndPoint );
    }

    /**
     * @private
     */
    setTitle() {
        this.mw.title = new mw.Title( this.values.title );
        this.values.titleText = this.mw.title.getPrefixedText();

        if ( !isEmpty( this.values.section ) ) {
            this.values.titleSection = [ this.values.title, this.values.section ].join( '#' );
            this.values.titleTextSection = [ this.values.titleText, this.values.section ].join( '#' );
        }

        this.values.href = mw.util.getUrl( this.values.titleSection || this.values.title );
    }
}

export default Article;