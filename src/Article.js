import id from './id';
import * as utils from './utils';
import * as utilsArticle from './utils-article';

import Api from './Api';

/**
 * Class representing an Article object.
 */
class Article {
    /**
     * @type {typeof utilsArticle}
     */
    static utils = utilsArticle;

    /**
     * @type {Object}
     */
    values = {
        type: null,
        typeVariant: null,
        hostname: location.hostname,
    };

    /**
     * @type {Object}
     */
    mw = {
        serverName: mw.config.get( 'wgServerName' ),
        mobileServerName: mw.config.get( 'wgMobileServerName' ),
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
        if ( !utils.isEmptyObject( values ) ) {
            this.set( values );
        }
    }

    set( values ) {
        this.values = { ...this.values, ...this.validateValues( values ) };
        this.isValid = this.validate();
        this.process();
    }

    setValue( name, value ) {
        this.values[ name ] = value;
    }

    get( name ) {
        return this.values[ name ];
    }

    getValues() {
        return this.values;
    }

    getMW( name ) {
        return this.mw[ name ];
    }

    /**
     * @private
     */
    validateValues( values ) {
        // Fix common user mistake with unnecessary pipeline following after the ids.
        if ( !utils.isEmpty( values.diff ) && utils.isString( values.diff ) && values.diff.indexOf( '|' ) > -1 ) {
            values.diff = values.diff.split( '|' ).shift();
        }
        if ( !utils.isEmpty( values.oldid ) && utils.isString( values.oldid ) && values.oldid.indexOf( '|' ) > -1 ) {
            values.oldid = values.oldid.split( '|' ).shift();
        }
        if ( !utils.isEmpty( values.curid ) && utils.isString( values.curid ) && values.curid.indexOf( '|' ) > -1 ) {
            values.curid = values.curid.split( '|' ).shift();
        }

        // Validate components
        if ( [ 0, '0' ].includes( values.oldid ) ) {
            delete values.oldid;
        }
        if ( [ 0, '0', 'current' ].includes( values.diff ) ) {
            values.diff = 'cur';
        }
        if ( !utils.isValidDir( values.direction ) ) {
            values.direction = 'prev';
        }

        // Validate section
        if ( !utils.isEmpty( values.section ) ) {
            values.section = values.section.replace( /^#/, '' );
        }

        return values;
    }

    /**
     * @private
     */
    validate() {
        // Check if a page type is a revision
        if ( utils.isValidID( this.values.oldid ) && utils.isEmpty( this.values.diff ) ) {
            this.values.type = 'revision';
            return true;
        }

        // Check if a page type is a diff
        if ( utils.isValidID( this.values.diff ) || utils.isValidID( this.values.oldid ) ) {
            this.values.type = 'diff';

            // Swap parameters if oldid is a direction and a title is empty
            if ( utils.isEmpty( this.values.title ) && utils.isValidDir( this.values.oldid ) ) {
                const dir = this.values.oldid;
                this.values.oldid = this.values.diff;
                this.values.diff = dir;
            }

            // Swap parameters if oldid is empty: special pages do not have a page title attribute
            if ( utils.isEmpty( this.values.oldid ) ) {
                this.values.oldid = this.values.diff;
                this.values.diff = this.values.direction;
            }

            // Fix a tenet bug
            if (
                utils.isValidID( this.values.oldid ) &&
                utils.isValidID( this.values.diff ) &&
                parseInt( this.values.oldid ) > parseInt( this.values.diff )
            ) {
                const diff = this.values.oldid;
                this.values.oldid = this.values.diff;
                this.values.diff = diff;
            }

            return true;
        }

        // Check if a page type is a diff
        if ( !utils.isEmpty( this.values.title ) && utils.isValidDir( this.values.diff ) ) {
            this.values.type = 'diff';
            return true;
        }

        // Check if a page type is a lastest revision
        if ( utils.isValidID( this.values.curid ) ) {
            this.values.type = 'revision';
            this.values.typeVariant = 'page';
            return true;
        }

        return false;
    }

    /**
     * @private
     */
    process() {
        // Get revision id if possible from the provided diff and oldid
        this.values.revid = utilsArticle.getRevID( this );

        // Set hostname
        if ( !utils.isEmpty( this.values.hostname ) ) {
            this.setHostname();
        }

        // Set title
        if ( !utils.isEmpty( this.values.title ) ) {
            this.setTitle();
        }
    }

    /**
     * @private
     */
    setHostname() {
        // Set server names
        const { general } = Api.siteInfoAliases[ this.values.hostname ] || {};
        if ( !utils.isEmptyObject( general ) ) {
            this.values.hostname = utils.isMF() && !utils.isEmpty( general.mobileservername ) ? general.mobileservername : general.servername;
            this.mw.serverName = general.servername;
            this.mw.mobileServerName = general.mobileservername;
        } else {
            this.mw.serverName = this.values.hostname;
            this.mw.mobileServerName = this.values.hostname;
        }

        // Set index and api endpoints
        this.mw.endPoint = `https://${ this.values.hostname }${ mw.util.wikiScript( 'index' ) }`;
        this.mw.endPointUrl = new URL( this.mw.endPoint );

        // Check if article is from foreign interwiki
        this.isForeign = utils.isForeign( this.values.hostname );
    }

    /**
     * @private
     */
    setTitle() {
        try {
            this.mw.title = new mw.Title( this.values.title );
            this.values.title = this.mw.title.getPrefixedDb();
            this.values.titleText = this.mw.title.getPrefixedText();
        } catch {}

        if ( !utils.isEmpty( this.values.section ) ) {
            this.values.titleSection = [ this.values.title, this.values.section ].join( '#' );
            this.values.titleTextSection = [ this.values.titleText, this.values.section ].join( '#' );
        }

        this.values.href = mw.util.getUrl( this.values.titleSection || this.values.title );
        if ( this.isForeign ) {
            this.values.href = utilsArticle.getHrefAbsolute( this, this.values.href );
        }
    }
}

export default Article;