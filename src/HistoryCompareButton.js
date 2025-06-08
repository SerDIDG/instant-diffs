import $ from 'jquery';

import id from './id';
import * as utils from './utils';

import DialogButton from './DialogButton';

class HistoryCompareButton extends DialogButton {
    constructor( options ) {
        super( options );

        this.type = 'diff';
        this.typeVariant = 'compare';
    }

    onDialogOpen() {
        if ( !utils.defaults( 'highlightLine' ) ) return;
        this.page.$oldidLine.addClass( 'instantDiffs-line--highlight' );
        this.page.$diffLine.addClass( 'instantDiffs-line--highlight' );
    }

    onDialogClose() {
        if ( !utils.defaults( 'highlightLine' ) ) return;
        this.page.$oldidLine.removeClass( 'instantDiffs-line--highlight' );
        this.page.$diffLine.removeClass( 'instantDiffs-line--highlight' );
    }

    getPage() {
        this.page.title = id.local.titleText;

        this.page.$oldid = $( '#mw-history-compare input[name="oldid"]:checked' );
        this.page.$oldidLine = this.page.$oldid.closest( 'li' );
        this.page.oldid = this.page.$oldid.val();

        this.page.$diff = $( '#mw-history-compare input[name="diff"]:checked' );
        this.page.$diffLine = this.page.$diff.closest( 'li' );
        this.page.diff = this.page.$diff.val();

        return super.getPage();
    }
}

export default HistoryCompareButton;