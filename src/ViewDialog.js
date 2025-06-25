import * as utils from './utils';
import { tweakUserOoUiClass } from './utils-oojs';

import DivLabelWidget from './DivLabelWidget';
import view from './View';

/**
 * Class representing a ViewDialog.
 * @augments OO.ui.MessageDialog
 */
class ViewDialog extends OO.ui.MessageDialog {
    static name = 'Instant Diffs Window';
    static size = 'instantDiffs';
    static actions = [
        {
            action: 'close',
            label: utils.msg( 'action-close' ),
        },
    ];

    /**
     * @type {number}
     */
    progressBarDelay;

    /**
     * @type {number}
     */
    progressBarTime;

    /**
     * Create a ViewDialog instance.
     */
    constructor() {
        super( {
            classes: [ 'instantDiffs-view' ],
        } );
    }

    initialize( ...args ) {
        super.initialize( ...args );

        // By default, the whole message is wrapped in a <label> element.
        // We don't want that behavior and revert it.
        this.message.$element.remove();
        this.message = new DivLabelWidget();
        this.text.$element.append( this.message.$element );

        // Close the dialog when clicking outside of it
        this.$clickOverlay = $( '<div>' )
            .on( 'click', () => this.close() )
            .addClass( 'instantDiffs-view-overlay' )
            .appendTo( this.$element );

        // Render progress bar loader
        this.progressBar = new OO.ui.ProgressBarWidget( {
            classes: [ 'instantDiffs-view-loader', 'is-transparent' ],
            progress: false,
            inline: true,
        } );
        this.$content.prepend( this.progressBar.$element );

        // Set a content scroll event
        this.container.$element.on( 'scroll', this.onScroll.bind( this ) );
    }

    /******* SETUP PROCESS *******/

    getSetupProcess( data ) {
        return super.getSetupProcess( data )
            .next( () => {
                // Toggle content visibility
                this.toggleVisibility( false );

                // Set a vertical scroll position to the top of the content
                this.container.$element.scrollTop( 0 );
            } );
    }

    getBodyHeight() {
        return 'auto';
    }

    /******* UPDATE PROCESS *******/

    update( data ) {
        return this.getUpdateProcess( data ).execute();
    }

    getUpdateProcess( data ) {
        return new OO.ui.Process()
            .next( () => {
                // Hide progress bar
                this.toggleProgressBar( false );

                // Set content
                this.title.setLabel(
                    data.title !== undefined ? data.title : this.constructor.static.title,
                );
                this.message.setLabel(
                    data.message !== undefined ? data.message : this.constructor.static.message,
                );

                // Restore focus trap inside the dialog
                this.focus();

                // Set a vertical scroll position to the top of the content
                this.container.$element.scrollTop( 0 );

                // Toggle content visibility
                this.toggleVisibility( true );
            } );
    }

    /******* TEARDOWN PROCESS *******/

    getTeardownProcess( data ) {
        return super.getTeardownProcess( data )
            .next( () => {
                // Hide progress bar
                this.toggleProgressBar( false );
            } );
    }

    /******* ACTIONS *******/

    focus( ...args ) {
        super.focus?.( ...args );

        this.$content.trigger( 'focus' );
    }

    toggleVisibility( value ) {
        this.message.$element.toggleClass( 'is-transparent', !value );
    }

    toggleProgressBar( value, instant ) {
        this.progressBarDelay && clearTimeout( this.progressBarDelay );

        if ( instant ) {
            this.progressBar.toggle( value );
            utils.onSchedule( () => this.progressBar.$element.toggleClass( 'is-transparent', !value ) );
        }

        if ( value === true ) {
            this.progressBarTime = Date.now();
            this.progressBar.toggle( true );
            utils.onSchedule( () => this.progressBar.$element.removeClass( 'is-transparent' ) );
        }

        if ( value === false ) {
            if ( !this.progressBar.isVisible() ) return;

            const duration = this.calculateRemainingTime( this.progressBarTime, 1000 );
            const fadeDuration = Math.max( duration - 150, 0 );
            this.progressBarDelay = setTimeout( () => {
                this.progressBar.$element.addClass( 'is-transparent' );
                this.progressBarDelay = setTimeout( () => this.progressBar.toggle( false ), 150 );
            }, fadeDuration );
        }
    }

    calculateRemainingTime( startTime, duration = 1000 ) {
        const elapsed = Date.now() - startTime;
        const currentCycleTime = elapsed % duration;
        return duration - currentCycleTime;
    }

    onScroll( event ) {
        view.onScroll( event );
    }

    getContainerScrollTop() {
        return this.container.$element.scrollTop;
    }
}

tweakUserOoUiClass( ViewDialog );

export default ViewDialog;