import id from './id';
import * as utils from './utils';

import Link from './Link';

/******* CONVENIENT DISCUSSIONS *******/

/**
 * {@link [[commons:User:JWBTH/CD]]}
 */

mw.hook( 'convenientDiscussions.preprocessed' ).add( ( cd ) => {
    if ( !cd ) return;

    /**
     * @param {import('./Link').default} link
     */
    const renderLink = ( link ) => {
        if ( !link.isProcessed || !link.config.showPageLink || link.getArticle().isForeign || link.actions.cd ) return;

        link.extensions.cd = {};
        link.extensions.cd.href = getHref( link );
        if ( utils.isEmpty( link.extensions.cd.href ) ) return;

        if ( link.actions.page ) {
            link.actions.page.remove();
        }

        link.actions.cd = link.renderAction( {
            label: utils.getLabel( 'page' ),
            title: utils.msg( 'comment-title' ),
            href: link.extensions.cd.href,
            modifiers: [ 'page', 'comment' ],
        } );
    };

    /**
     * @param {import('./Link').default} link
     */
    const getHref = ( link ) => {
        if ( !link.compare && !link.revision ) return;

        const title = link.getArticle().get( 'titleText' );
        const page = cd.api.pageRegistry.get( title );
        if ( !page || !page.isProbablyTalkPage() ) return;

        if ( link.revision ) {
            if ( link.revision.revid ) {
                link.extensions.cd.date = new Date( link.revision.timestamp );
                link.extensions.cd.user = link.revision.user;
            }
        } else if ( link.compare ) {
            if ( link.compare.torevid ) {
                link.extensions.cd.date = new Date( link.compare.totimestamp );
                link.extensions.cd.user = link.compare.touser;
            } else if ( link.compare.fromrevid ) {
                link.extensions.cd.date = new Date( link.compare.fromtimestamp );
                link.extensions.cd.user = link.compare.fromuser;
            }
        }

        if ( link.extensions.cd.date && link.extensions.cd.user ) {
            try {
                link.extensions.cd.anchor = cd.api.generateCommentId( link.extensions.cd.date, link.extensions.cd.user );
            } catch {}
        }

        if ( !link.extensions.cd.anchor ) return;

        let href = `#${ link.extensions.cd.anchor }`;
        if ( title !== id.local.mwTitleText ) {
            href = mw.util.getUrl( `${ title }${ href }` );
        }
        return href;
    };

    // Process already rendered links
    if ( id.isRunCompleted ) {
        for ( const link of Link.getLinks() ) {
            renderLink( link );
        }
    }

    // Add hook listener to process newly added links
    mw.hook( `${ id.config.prefix }.link.renderSuccess` ).add(
        /**
         * @param {import('./Link').default} link
         */
        ( link ) => {
            if ( !link ) return;
            renderLink( link );
        },
    );
} );

/******* WIKI ED DIFF *******/

/**
 * {@link [[:en:User:Cacycle/wikEdDiff]]}
 */

mw.hook( `${ id.config.prefix }.page.beforeDetach` ).add(
    /**
     * @param {import('./Page').default} page
     */
    ( page ) => {
        if ( !page ) return;

        // Reset diff table linking
        // FixMe: Suggest a better solution
        const $diffTable = page.getDiffTable();
        if (
            typeof wikEd !== 'undefined' &&
            wikEd.diffTableLinkified &&
            ( $diffTable?.length > 0 && wikEd.diffTable === $diffTable.get( 0 ) )
        ) {
            wikEd.diffTableLinkified = false;
        }
    },
);

/******* TWINKLE *******/

/**
 * {@link [[w:Wikipedia:Twinkle|Twinkle]]}
 * {@link [[meta:User:Xiplus/TwinkleGlobal|TwinkleGlobal]]}
 */

mw.hook( `${ id.config.prefix }.page.complete` ).add(
    /**
     * @param {import('./Page').default} page
     */
    ( page ) => {
        if ( !page ) return;

        const $links = page.getContainer()?.find( '[id^="tw-revert"] a' );
        $links.each( ( i, node ) => {
            node.addEventListener( 'click', () => page.close() );
        } );
    },
);