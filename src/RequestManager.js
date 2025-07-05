import id from './id';

/**
 * Class representing a Request Manager.
 */
class RequestManager {
    /**
     * @type {Map<JQuery.jqXHR | mw.Api.Promise, JQuery.Promise>}
     */
    items = new Map();

    /**
     * mw.Api.get wrapper.
     * @param {object} params
     * @returns {mw.Api.Promise}
     */
    get( params ) {
        const request = id.local.mwApi.get( params );
        this.add( request );
        return request;
    }

    /**
     * $.ajax wrapper.
     * @param {object} params
     * @returns {JQuery.jqXHR}
     */
    ajax( params ) {
        const request = $.ajax( params );
        this.add( request );
        return request;
    }

    /**
     * Abort all requests in the set.
     */
    abort() {
        this.items.forEach( ( promise, request ) => request.abort() );
    }

    /**
     * Add promise to the set.
     * @param {JQuery.jqXHR|mw.Api.Promise} request
     * @returns {JQuery.Promise}
     */
    add( request ) {
        const promise = request.always( () => this.delete( request ) );
        this.items.set( request, promise );
        return promise;
    }

    /**
     * Delete promise from the set.
     * @param {JQuery.jqXHR|mw.Api.Promise} request
     */
    delete( request ) {
        this.items.delete( request );
    }
}

export default RequestManager;