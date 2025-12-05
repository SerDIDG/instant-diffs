import id from './id';
import * as utils from './utils';

import Link from './Link';

/******* EXTENSION: TRANSLATE *******/

mw.hook( 'mw.translate.editor.showTranslationHelpers' ).add(
	/**
	 * @param {Object} helpers
	 * @param {JQuery<HTMLElement>} $context
	 */
	( helpers, $context ) => {
		if ( !$context || !utils.isAllowed() ) return;

		mw.hook( `${ id.config.prefix }.process` ).fire( $context );
	},
);

/******* GADGET: CONVENIENT DISCUSSIONS *******/

/**
 * @see {@link https://commons.wikimedia.org/wiki/User:Jack_who_built_the_house/Convenient_Discussions}
 */

mw.hook( 'convenientDiscussions.preprocessed' ).add( ( cd ) => {
	if ( !cd ) return;

	/**
	 * @param {import('./Link').default} link
	 */
	const renderLink = ( link ) => {
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

/******* GADGET: WIKI ED DIFF *******/

/**
 * @see {@link https://en.wikipedia.org/wiki/User:Cacycle/wikEdDiff}
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

/******* GADGET: TWINKLE *******/

/**
 * @see {@link https://en.wikipedia.org/wiki/Wikipedia:Twinkle}
 * @see {@link https://meta.wikimedia.org/wiki/User:Xiplus/TwinkleGlobal}
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

/******* SKIN: CITIZEN *******/

/**
 * @see {@link https://www.mediawiki.org/wiki/Skin:Citizen}
 */

mw.hook( 'wikipage.content' ).add( () => {
	if ( !utils.isAllowed() || mw.config.get( 'skin' ) !== 'citizen' ) return;

	/**
	 * Adds support for the "Last modified" link in the sidebar.
	 * @param {HTMLAnchorElement} link
	 * @param {HTMLElement} container
	 */
	const renderLastMod = ( link, container ) => {
		try {
			const url = new URL( link.href );
			if ( utils.isEmpty( url.searchParams.get( 'diff' ) ) ) {
				url.searchParams.set( 'diff', 'cur' );
				link.href = url.href;
			}

			link.dataset.instantdiffsLink = 'basic';
			link.dataset.instantdiffsOptions = JSON.stringify( {
				showLink: false,
				showPageLink: false,
				showAltTitle: true,
			} );

			mw.hook( `${ id.config.prefix }.process` ).fire( $( container ) );
		} catch {}
	};

	const lastModLink = document.querySelector( '#citizen-lastmod-relative' );
	const lastModSidebar = document.querySelector( '#citizen-sidebar-lastmod' );
	if ( lastModLink && lastModSidebar ) {
		renderLastMod( lastModLink, lastModSidebar );
	}
} );