import { tweakUserOoUiClass } from './utils-oojs';

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

tweakUserOoUiClass( DivLabelWidget );

export default DivLabelWidget;