import * as utils from './utils';

/**
 * Class representing a custom LabelWidget with a div tag name.
 * @augments OO.ui.LabelWidget
 */
class DivLabelWidget extends OO.ui.LabelWidget {
    static tagName = 'div';

    constructor() {
        super( {
            classes: [ 'oo-ui-messageDialog-message' ],
        } );
    }
}

utils.tweakUserOoUiClass( DivLabelWidget  );

export default DivLabelWidget;