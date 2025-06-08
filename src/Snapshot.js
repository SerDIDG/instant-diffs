import id from './id';
import * as utils from './utils';

class Snapshot {
    #links = [];
    #link;

    constructor() {
        this.#links = Array.from( utils.getLinks() );
    }

    setLink( link ) {
        this.#link = link;
    }

    hasLink( link ) {
        return this.#links.includes( link.getNode() );
    }

    getLength() {
        return this.#links.length;
    }

    getIndex() {
        return this.#link ? this.#links.indexOf( this.#link.getNode() ) : -1;
    }

    getPreviousLink( currentIndex ) {
        if ( typeof currentIndex === 'undefined' ) {
            currentIndex = this.getIndex();
        }

        if ( currentIndex !== -1 && currentIndex > 0 ) {
            const previousIndex = currentIndex - 1;
            const previousLinkNode = this.#links[ previousIndex ];
            const previousLink = id.local.links.get( previousLinkNode );
            return this.isLinkValid( previousLink ) ? previousLink : this.getPreviousLink( previousIndex );
        }
    }

    getNextLink( currentIndex ) {
        if ( typeof currentIndex === 'undefined' ) {
            currentIndex = this.getIndex();
        }

        if ( currentIndex !== -1 && ( currentIndex + 1 ) < this.getLength() ) {
            const nextIndex = currentIndex + 1;
            const nextLinkNode = this.#links[ nextIndex ];
            const nextLink = id.local.links.get( nextLinkNode );
            return this.isLinkValid( nextLink ) ? nextLink : this.getNextLink( nextIndex );
        }
    }

    isLinkValid( link ) {
        return link && ( link.isProcessed || ( !link.isLoaded && link.hasRequest ) );
    }
}

export default Snapshot;