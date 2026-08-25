import * as utils from '../../utils';
import { es6ClassToOoJsClass, mixIntoClass } from '../../utils-oojs';

import ButtonWidgetMixin from '../../ButtonWidgetMixin';

/**
 * ReviewButton's own configuration options.
 * @typedef {Object} ReviewButtonOwnOptions
 * @property {JQuery<HTMLElement>} [$content] - Content to embed into popup
 * @property {(button: ReviewButton, event: (MouseEvent|KeyboardEvent)) => void} [handler] - A click handler
 */

/**
 * ReviewButton's configuration options, extends OO.ui.ButtonWidget configuration.
 * @typedef {OO.ui.PopupButtonWidget.ConfigOptions & import('../../ButtonWidgetMixin').ButtonWidgetMixin.Options & ReviewButtonOwnOptions} ReviewButton.Options
 */

/**
 * Class representing a custom PopupButtonWidget for the review form.
 * Augments OO.ui.PopupButtonWidget with ButtonWidgetMixin.
 * @augments OO.ui.PopupButtonWidget
 * @augments ButtonWidgetMixin
 */
class ReviewButton extends mixIntoClass( OO.ui.PopupButtonWidget, ButtonWidgetMixin ) {
	/**
	 * Creates a ReviewButton instance.
	 * @param {ReviewButton.Options} [options] - A PopupButtonWidget configuration options
	 */
	constructor( options = {} ) {
		// Validate options
		options = utils.deepMerge( {
			icon: 'eyeClosed',
			label: utils.msg( 'action-review' ),
			title: utils.msgHint( 'action-review-title', [ 'review-description', utils.msg( 'hint-review' ) ] ),
			pending: true,
			framed: true,
			popup: {
				padded: false,
				align: 'force-right',
			},
		}, options );

		// Call parent class constructor
		super( options );

		// Set properties
		if ( options.$content ) {
			this.setContent( options.$content );
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
}

es6ClassToOoJsClass( ReviewButton );

export default ReviewButton;