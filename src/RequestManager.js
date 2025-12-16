import Api from './Api';

/**
 * Class representing a Request Manager.
 */
class RequestManager {
	/**
	 * @type {Map<JQuery.jqXHR|mw.Api.AbortablePromise, JQuery.Promise|mw.Api.AbortablePromise>}
	 */
	items = new Map();

	/**
	 * mw.Api.get wrapper.
	 * @param {Object} params
	 * @param {string} [hostname]
	 * @returns {mw.Api.AbortablePromise}
	 */
	get( params, hostname ) {
		const request = Api.get( params, hostname );
		this.add( request );
		return request;
	}

	/**
	 * $.ajax wrapper.
	 * @param {Object} params
	 * @returns {JQuery.jqXHR}
	 */
	ajax( params ) {
		const request = $.ajax( params );
		this.add( request );
		return request;
	}

	/**
	 * $.when wrapper.
	 * @param {...*} args - Arguments to pass to $.when
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
	 * @param {JQuery.jqXHR|mw.Api.AbortablePromise} request
	 * @returns {JQuery.Promise|mw.Api.AbortablePromise}
	 */
	add( request ) {
		const promise = request.always( () => this.delete( request ) );
		this.items.set( request, promise );
		return promise;
	}

	/**
	 * Delete promise from the set.
	 * @param {JQuery.jqXHR|mw.Api.AbortablePromise} request
	 */
	delete( request ) {
		this.items.delete( request );
	}
}

export default RequestManager;