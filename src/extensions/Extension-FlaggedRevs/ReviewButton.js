import * as utils from '../../utils';
import { tweakUserOoUiClass } from '../../utils-oojs';

/**
 * ReviewButton's configuration options, extends OO.ui.ButtonWidget configuration.
 * @typedef {OO.ui.PopupButtonWidget.ConfigOptions & Object} ReviewButton.Options
 * @property {boolean} [pending=false] - Set pending state
 */

/**
 * Class representing a custom PopupButtonWidget for the review form.
 * @augments OO.ui.PopupButtonWidget
 */
class ReviewButton extends OO.ui.PopupButtonWidget {
	/**
	 * @type {ReviewButton.Options}
	 */
	options = {};

	/**
	 * Creates a ReviewButton instance.
	 * @param {ReviewButton.Options} [options] - A PopupButtonWidget configuration options
	 */
	constructor( options = {} ) {
		// Validate options
		options = utils.optionsMerge( {
			classes: [ 'instantDiffs-button' ],
			icon: 'eyeClosed',
			label: utils.msg( 'action-review' ),
			title: utils.msg( 'action-review-title' ),
			pending: true,
			popup: {
				padded: false,
				align: 'force-right',
			},
		}, options );

		// Call parent class constructor
		super( options );

		// Properties
		this.options = options;

		// Pending element
		this.$pending = $( '<span>' )
			.addClass( 'oo-ui-buttonElement-pending' )
			.prependTo( this.$button );

		// Mixin constructors
		OO.ui.mixin.PendingElement.call( this, { $pending: this.$pending } );

		// Set properties
		if ( options.pending ) {
			this.setPending( options.pending );
		}
	}

	/**
	 * Sets popup content
	 * @param {JQuery<HTMLElement>} $content
	 * @return {ReviewButton}
	 */
	setContent( $content ) {
		this.getPopup().$body.append( $content );
		return this;
	}

	/**
	 * Toggles a buttons pending state.
	 * @param {boolean} value
	 * @returns {ReviewButton}
	 */
	setPending( value ) {
		value ? this.pushPending() : this.popPending();
		this.$element.toggleClass( 'instantDiffs-button--pending', value );
		return this;
	}
}

tweakUserOoUiClass( ReviewButton );
OO.mixinClass( ReviewButton, OO.ui.mixin.PendingElement );

export default ReviewButton;