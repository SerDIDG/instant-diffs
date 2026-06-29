/**
 * GADGET: CONVENIENT DISCUSSIONS
 *
 * Replaces the "Go to page" link with a "Go to message" link after the diff or revision link
 * within user-written content, such as on project or talk pages".
 * @see {@link https://commons.wikimedia.org/wiki/User:Jack_who_built_the_house/Convenient_Discussions}
 */

import id from '../id';
import * as utils from '../utils';

import Link from '../Link';

/**
 * @param {import('../Link').default} link
 */
function renderLink( link ) {
	if ( !link || !link.isValid || !link.isProcessed || link.isForeign || !link.options.showPageLink || link.actions.cd ) return;

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
}

/**
 * @param {import('../Link').default} link
 */
function getHref( link ) {
	if ( !link.compare && !link.revision ) return;

	const cd = window.convenientDiscussions;
	if ( !cd ) return;

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
		} catch ( error ) {
			utils.logException( 'Gadget-ConvenientDiscussions', 'Unable to generate comment anchor.', error );
		}
	}

	if ( !link.extensions.cd.anchor ) return;

	let href = `#${ link.extensions.cd.anchor }`;
	if ( title !== id.local.mwTitleText ) {
		href = mw.util.getUrl( `${ title }${ href }` );
	}
	return href;
}

mw.hook( 'convenientDiscussions.preprocessed' ).add( ( cd ) => {
	if ( !cd ) return;

	// Process already rendered links
	if ( id.isRunCompleted ) {
		for ( const link of Link.getLinks() ) {
			renderLink( link );
		}
	}

	// Add hook listener to process newly added links
	mw.hook( `${ id.config.prefix }.link.renderSuccess` ).add( renderLink );
} );