import * as utils from './utils';
import { tweakUserOoUiClass } from './utils-oojs';

import Link from './Link';

/**
 * Class representing a custom ButtonWidget for the navigation menu.
 * @augments OO.ui.ButtonWidget
 */
class MenuButton extends OO.ui.ButtonWidget {
    /**
     * Create a MenuButton instance.
     * @param {Object} [options] configuration options
     */
    constructor( options ) {
        options = {
            handler: null,
            useAltKey: false,
            link: false,
            ...options,

            linkOptions: {
                behavior: 'event',
                ...options.linkOptions,
            },
        };

        super( options );

        if ( utils.isFunction( options.handler ) ) {
            utils.addClick( this.$button.get( 0 ), options.handler.bind( this ), options.useAltKey );
        }

        if ( options.link ) {
            this.link = new Link( this.$button.get( 0 ), options.linkOptions );
        }
    }

    /**
     * Toggle a buttons pending state that shows a loading cursor.
     * @param {boolean} value
     */
    pending( value ) {
        this.$button.toggleClass( 'instantDiffs-link--pending', value );
    }
}

tweakUserOoUiClass( MenuButton );

export default MenuButton;