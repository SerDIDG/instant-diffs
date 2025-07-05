/**
 * Class representing a Request Manager.
 */
class RequestManager {
    /**
     * @type {Set}
     */
    items = new Set();

    /**
     * Add promise requests and call Promise.all.
     * @param {Array.<JQuery.Promise>} promises
     * @returns {Promise}
     */
    all( promises ) {
        promises.forEach( promise => this.add( promise ) );
        return Promise.all( Array.from( this.items ) );
    }

    /**
     * Add promise requests and call Promise.allSettled.
     * @param {Array.<JQuery.Promise>} promises
     * @returns {Promise}
     */
    allSettled( promises ) {
        promises.forEach( promise => this.add( promise ) );
        return Promise.allSettled( Array.from( this.items ) );
    }

    /**
     * Abort all requests in the set.
     */
    abort() {
        for ( const promise of this.items ) {
            promise.abort();
        }
    }

    /**
     * Add promise to the set.
     * @param {JQuery.Promise} promise
     */
    add( promise ) {
        promise.always( () => this.delete( promise ) );
        this.items.add( promise );
    }

    /**
     * Delete promise from the set.
     * @param {JQuery.Promise} promise
     */
    delete( promise ) {
        this.items.delete( promise );
    }
}

export default RequestManager;