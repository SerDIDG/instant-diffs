import * as utils from './utils';
import { tweakUserOoUiClass } from './utils-oojs';

/**
 * Class representing a ViewProgressBar.
 * @augments OO.ui.ProgressBarWidget
 */
class ViewProgressBar extends OO.ui.ProgressBarWidget {
    /**
     * @type {Timeout}
     */
    toggleDelay;

    /**
     * @type {number}
     */
    toggleTime;

    /**
     * Create a ViewProgressBar instance.
     */
    constructor( options ) {
        super( {
            classes: [ 'instantDiffs-view-loader', 'is-transparent' ],
            progress: false,
            inline: true,
            ...options,
        } );
    }

    /**
     * Toggle progress bar visibility.
     * @param {boolean} value
     * @param {boolean} [instant]
     */
    toggleVisibility( value, instant ) {
        this.toggleDelay && clearTimeout( this.toggleDelay );

        if ( instant ) {
            this.toggle( value );
            utils.onSchedule( () => this.$element.toggleClass( 'is-transparent', !value ) );
        }

        if ( value === true ) {
            this.toggleTime = Date.now();
            this.toggle( true );
            utils.onSchedule( () => this.$element.removeClass( 'is-transparent' ) );
        }

        if ( value === false ) {
            if ( !this.isVisible() ) return;

            const duration = this.calculateRemainingTime( this.toggleTime, 1000 );
            const fadeDuration = Math.max( duration - 150, 0 );
            this.toggleDelay = setTimeout( () => {
                this.$element.addClass( 'is-transparent' );
                this.toggleDelay = setTimeout( () => this.toggle( false ), 150 );
            }, fadeDuration );
        }
    }

    /**
     * Calculate animation remaining time.
     * @private
     * @param {number} startTime
     * @param {number} [duration]
     * @return {number}
     */
    calculateRemainingTime( startTime, duration = 1000 ) {
        const elapsed = Date.now() - startTime;
        const currentCycleTime = elapsed % duration;
        return duration - currentCycleTime;
    }
}

tweakUserOoUiClass( ViewProgressBar );

export default ViewProgressBar;