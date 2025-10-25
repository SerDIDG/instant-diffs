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
        // Validate options
        options = {
            type: 'nav',
            classes: [],
            framed: true,
            invisibleLabel: false,
            icon: false,
            handler: null,
            useAltKey: false,
            link: false,
            ...options,

            linkOptions: {
                behavior: 'event',
                ...options.linkOptions,
            },
        };

        if ( options.type === 'shortcut' ) {
            options.invisibleLabel = true;
        }

        if ( options.type === 'menu' ) {
            options.classes = [ ...options.classes, 'instantDiffs-button--link' ];
            options.framed = false;

            if ( !utils.defaults( 'showMenuIcons' ) ) {
                options.icon = null;
            }
        }

        // Call parent class constructor
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