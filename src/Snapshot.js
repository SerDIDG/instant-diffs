import id from './id';
import * as utils from './utils';

import Link from './Link';

/**
 * Class meant to collect current links on the page to navigate between them in the View dialog.
 * Should be constructed only when the View dialog opens.
 */
class Snapshot {
    /**
     * @type {import('./Link').default}
     */
    link;

    /**
     * @type {array}
     */
    links = [];

    /**
     * Create a snapshot instance.
     */
    constructor() {
        this.links = Array.from( utils.getLinks() );
    }

    /**
     * Set the link relative to which previous and next links will be determined.
     * @param {import('./Link').default} link a Link instance
     */
    setLink( link ) {
        this.link = link;
    }

    /**
     * Check if the link belongs to the links' snapshot.
     * @param {import('./Link').default} link a Link instance
     * @returns {boolean}
     */
    hasLink( link ) {
        return link instanceof Link && this.links.includes( link.getNode() );
    }

    /**
     * Check if the link is valid and can be navigated to.
     * @param {import('./Link').default} link a Link instance
     * @returns {boolean}
     */
    isLinkValid( link ) {
        return link instanceof Link && ( link.isProcessed || ( !link.isLoaded && link.hasRequest ) );
    }

    /**
     * Get count of the links' snapshot
     * @returns {number}
     */
    getLength() {
        return this.links.length;
    }

    /**
     * Get index of the current link relative to the links' snapshot.
     * @returns {number}
     */
    getIndex() {
        return this.link instanceof Link ? this.links.indexOf( this.link.getNode() ) : -1;
    }

    /**
     * Get the previous link relative to the given index if exists.
     * @param {number} [currentIndex] current relative index
     * @returns {import('./Link').default|undefined} a Link instance
     */
    getPreviousLink( currentIndex ) {
        if ( typeof currentIndex === 'undefined' ) {
            currentIndex = this.getIndex();
        }
        if ( currentIndex <= 0 ) return;

        const index = currentIndex - 1;
        const link = id.local.links.get( this.links[ index ] );
        return this.isLinkValid( link ) ? link : this.getPreviousLink( index );
    }

    /**
     * Get the next link relative to the given index if exists.
     * @param {number} [currentIndex] current relative index
     * @returns {import('./Link').default|undefined} a Link instance
     */
    getNextLink( currentIndex ) {
        if ( typeof currentIndex === 'undefined' ) {
            currentIndex = this.getIndex();
        }
        if ( currentIndex < 0 || currentIndex + 1 >= this.getLength() ) return;

        const index = currentIndex + 1;
        const link = id.local.links.get( this.links[ index ] );
        return this.isLinkValid( link ) ? link : this.getNextLink( index );
    }
}

export default Snapshot;