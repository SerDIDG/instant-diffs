import * as utils from './utils';

/**
 * Class representing a button.
 * @mixes OO.EventEmitter
 */
class Button {
	/**
	 * @type {Object}
	 */
	options = {};

	/**
	 * @type {HTMLElement}
	 */
	node;

	/**
	 * Create a button instance.
	 * @param {Object} [options] configuration options
	 */
	constructor( options ) {
		this.options = {
			node: null,
			tag: 'button',
			classes: [],
			label: null,
			title: null,
			href: null,
			target: '_self',
			handler: null,
			container: null,
			insertMethod: 'appendTo',
			ariaHaspopup: false,
			altTitle: null,
			useAltKey: false,
			...options,
		};

		// Validate
		if ( !utils.isEmpty( this.options.href ) ) {
			this.options.tag = 'a';
		}

		// Mixin constructor
		OO.EventEmitter.call( this );

		// If a node was provided, process it, otherwise render a new node
		if ( this.options.node?.nodeType === 1 ) {
			this.node = this.options.node;
			this.process();
		} else {
			this.render();
		}
	}

	/**
	 * Render a button structure.
	 */
	render() {
		this.node = document.createElement( this.options.tag );
		this.node.innerText = this.options.label;
		this.node.classList.add( ...this.options.classes );

		if ( !utils.isEmpty( this.options.title ) ) {
			this.node.title = this.options.title;
		}
		if ( !utils.isEmpty( this.options.href ) ) {
			this.node.href = this.options.href;
			this.node.target = this.options.target;
		} else {
			this.node.setAttribute( 'tabindex', '0' );
			this.node.setAttribute( 'role', 'button' );
		}

		this.process();
		this.embed( this.options.container, this.options.insertMethod );
	}

	/**
	 * Setup button events and related attributes.
	 */
	process() {
		if ( !utils.isFunction( this.options.handler ) ) return;

		if ( this.options.ariaHaspopup ) {
			this.node.setAttribute( 'aria-haspopup', 'dialog' );
		}
		if ( !utils.isEmpty( this.options.altTitle ) ) {
			this.node.dataset.altTitle = this.options.altTitle;
		}

		utils.addClick( this.node, this.options.handler.bind( this ), this.options.useAltKey );
	}

	/******* ACTIONS *******/

	/**
	 * Append a button to the specified node.
	 * @param {HTMLElement|JQuery<HTMLElement>} container
	 * @param {string} [insertMethod]
	 */
	embed( container, insertMethod ) {
		utils.embed( this.node, container, insertMethod );
	}

	/**
	 * Remove a button from the DOM.
	 */
	remove() {
		this.node.remove();
	}

	/**
	 * Toggle a buttons pending state that shows a loading cursor.
	 * @param {boolean} value
	 */
	pending( value ) {
		this.node.classList.toggle( 'instantDiffs-link--pending', value );
	}

	/**
	 * Get a button node.
	 * @returns {HTMLElement}
	 */
	getContainer() {
		return this.node;
	}
}

export default Button;