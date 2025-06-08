import mw from 'mediawiki';

import id from './id';
import * as utils from './utils';

/******* [[commons:User:JWBTH/CD]] *******/

mw.hook( 'convenientDiscussions.preprocessed' ).add( ( cd ) => {
    if ( !cd || !id ) return;

    const renderLink = ( link ) => {
        if ( !link.isProcessed || !link.config.showPageLink || link.cd ) return;

        link.cd = {};
        link.cd.href = getHref( link );
        if ( utils.isEmpty( link.cd.href ) ) return;

        if ( link.page.button ) {
            link.page.button.remove();
        }

        link.cd.button = link.renderAction( {
            label: utils.getLabel( 'page' ),
            title: utils.msg( 'goto-cd' ),
            href: link.cd.href,
            modifiers: [ 'page', 'message' ],
        } );
    };

    const getHref = ( link ) => {
        if ( !link.compare && !link.revision ) return;

        const page = cd.api.pageRegistry.get( link.page.titleText );
        if ( !page || !page.isProbablyTalkPage() ) return;

        if ( link.revision ) {
            if ( link.revision.revid ) {
                link.cd.date = new Date( link.revision.timestamp );
                link.cd.user = link.revision.user;
            }
        } else if ( link.compare ) {
            if ( link.compare.torevid ) {
                link.cd.date = new Date( link.compare.totimestamp );
                link.cd.user = link.compare.touser;
            } else if ( link.compare.fromrevid ) {
                link.cd.date = new Date( link.compare.fromtimestamp );
                link.cd.user = link.compare.fromuser;
            }
        }

        if ( link.cd.date && link.cd.user ) {
            try {
                link.cd.anchor = cd.api.generateCommentId( link.cd.date, link.cd.user );
            } catch ( e ) {}
        }

        if ( !link.cd.anchor ) return;

        let href = `#${ link.cd.anchor }`;
        if ( link.page.titleText !== id.local.titleText ) {
            href = mw.util.getUrl( `${ link.page.titleText }${ href }` );
        }
        return href;
    };

    // Process already rendered links
    if ( id.isRunCompleted ) {
        for ( const link of id.local.links.values() ) {
            renderLink( link );
        }
    }

    // Add hook listener to process newly added links
    mw.hook( `${  id.config.prefix }.link.renderSuccess` ).add( ( link ) => {
        if ( !link ) return;
        renderLink( link );
    } );
} );

/******* [[:en:User:Cacycle/wikEdDiff]] *******/

mw.hook( `${  id.config.prefix }.diff.beforeDetach` ).add( ( diff ) => {
    if ( !diff ) return;

    // Reset diff table linking
    // FixMe: Suggest a better solution
    const $diffTable = diff.getDiffTable();
    if (
        typeof wikEd !== 'undefined' &&
        wikEd.diffTableLinkified &&
        ( $diffTable?.length > 0 && wikEd.diffTable === $diffTable.get( 0 ) )
    ) {
        wikEd.diffTableLinkified = false;
    }
} );
