import id from './id';
import * as utils from './utils';

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
     * @param {Object} params
     * @param {mw.Api|mw.ForeignApi} [api]
     * @returns {mw.Api.Promise}
     */
    get( params, api ) {
        api = api || id.local.mwApi;
        const request = api.get( params );
        this.add( request );
        return request;
    }

    /**
     * $.ajax wrapper.
     * @param {Object} params
     * @returns {JQuery.jqXHR|JQuery.Promise}
     */
    ajax( params ) {
        const request = $.ajax( params );
        this.add( request );
        return request;
    }

    /**
     * $.when wrapper.
     * @returns {JQuery.Promise}
     */
    when( ...args ) {
        return $.when( ...args );
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