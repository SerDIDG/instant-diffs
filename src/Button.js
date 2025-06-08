import * as utils from './utils';

class Button {
    options = {};

    constructor(options) {
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

        // If a not was provided, process it, otherwise render a new node
        if ( this.options.node?.nodeType === 1 ) {
            this.node = this.options.node;
            this.process();
        } else {
            this.render();
        }
    }

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

    embed( container, insertMethod ) {
        utils.embed( this.node, container, insertMethod );
    }

    remove() {
        this.node.remove();
    }

    pending( value ) {
        this.node.classList.toggle( 'instantDiffs-link--pending', value );
    }

    getContainer() {
        return this.node;
    }
}

export default Button;