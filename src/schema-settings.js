import * as utils from './utils';
import { getHref } from './utils-article';

import Api from './Api';
import Site from './Site';
import view from './view';
import settings from './settings';
import id from './id';

const { h, ht, hj, kdb } = utils;

/**
 * Settings Shema
 * @type {Record<string, Record>}
 */
export const schema = {
	general: {
		config: {
			labelMsg: 'settings-fieldset-general',
		},
		fields: {
			intro: {
				type: 'html',
				field: false,
				enabled: true,
				default: undefined,
				content: renderIntroField,
			},
			enableMobile: {
				type: 'checkbox',
				enabled: true,
				enabledCondition: async () => await Site.hasSkin( 'minerva' ),
				default: true,
				config: {
					labelMsg: 'settings-enable-mobile',
					helpMsg: 'settings-enable-mobile-help',
				},
			},
			notifyErrors: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-notify-errors',
				},
			},
		},
	},

	links: {
		config: {
			labelMsg: 'settings-fieldset-links',
		},
		fields: {
			showLink: {
				type: 'checkbox',
				enabled: true,
				default: false,
				config: {
					labelMsg: 'settings-show-link',
					help: () => utils.msgDom( 'settings-show-link-help', utils.getLabel( 'diff' ), utils.getLabel( 'revision' ), kdb( utils.msg( 'hint-alt-click' ) ) ),
				},
			},
			showPageLink: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-show-page-link',
					help: () => utils.msgDom( 'settings-show-page-link-help', utils.getLabel( 'page' ), 'mw:Special:MyLanguage/Convenient Discussions' ),
				},
			},
			markWatchedLink: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-mark-watched-link',
				},
			},
			highlightLine: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-highlight-line',
				},
			},
			markWatchedLine: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-mark-watched-line',
				},
			},
		},
	},

	dialog: {
		config: {
			labelMsg: 'settings-fieldset-dialog',
		},
		fields: {
			viewWidth: {
				type: 'buttonSelect',
				enabled: true,
				default: 'standard',
				config: {
					labelMsg: 'settings-view-width',
					helpMsg: 'settings-view-width-help',
				},
				optionsType: 'buttonOption',
				options: {
					compact: {
						labelMsg: 'settings-view-width-compact',
						titleMsg: () => [ 'settings-view-width-option-title', view.constructor.getSize( 'compact' ).width ],
					},
					standard: {
						labelMsg: 'settings-view-width-standard',
						titleMsg: () => [ 'settings-view-width-option-title', view.constructor.getSize( 'standard' ).width ],
					},
					wide: {
						labelMsg: 'settings-view-width-wide',
						titleMsg: () => [ 'settings-view-width-option-title', view.constructor.getSize( 'wide' ).width ],
					},
					full: {
						labelMsg: 'settings-view-width-full',
						titleMsg: 'settings-view-width-full-title',
					},
				},
			},
			closeOutside: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-close-outside',
				},
			},
			enableHotkeys: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-enable-hotkeys',
					helpInline: false,
					help: getHotkeysHelpSnippet,
				},
			},
			showDiffTools: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-show-diff-tools',
				},
				onChange: onShowDiffToolsChange,
			},
			enableReviewForm: {
				type: 'checkbox',
				enabled: true,
				enabledCondition: async () => await Api.userHasRight( 'review' ),
				default: true,
				disabledCondition: () => !settings.get( 'showDiffTools' ),
				config: {
					label: () => utils.msg( 'settings-enable-review-form', utils.msg( 'action-review-title' ) ),
					helpInline: false,
					help: () => utils.msgSnippet( 'settings-enable-review-form-help', 'review', 'mw:Special:MyLanguage/Extension:FlaggedRevs#User_rights' ),
				},
			},
			enableDetailedPages: {
				type: 'checkbox',
				enabled: true,
				enabledCondition: async () => await Site.hasSkin( 'apioutput' ),
				default: true,
				config: {
					labelMsg: 'settings-enable-detailed-pages',
					helpInline: false,
					helpMsg: 'settings-enable-detailed-pages-help',
				},
			},
			showRevisionInfo: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-show-revision-info',
				},
			},
			unHideDiffs: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-unhide-diffs',
					helpInline: false,
					help: () => utils.msgSnippet( 'settings-unhide-diffs-help', 'suppressrevision', 'mw:Special:MyLanguage/Help:RevisionDelete' ),
				},
			},
			openInNewTab: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-open-in-new-tab',
				},
			},
		},
	},

	menu: {
		config: {
			labelMsg: 'settings-fieldset-menu',
		},
		fields: {
			showMenuIcons: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-show-menu-icons',
				},
			},
			showWatchlistPopup: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-show-watchlist-popup',
					helpInline: false,
					helpMsg: 'settings-show-watchlist-popup-help',
				},
			},
			linksHash: {
				type: 'checkbox',
				enabled: true,
				default: false,
				config: {
					labelMsg: 'settings-links-hash',
					helpInline: false,
					helpMsg: 'settings-links-hash-help',
				},
				onChange: onLinksHashChange,
			},
			linksLabel: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					labelMsg: 'settings-links-label',
				},
				onChange: onLinksLabelChange,
			},
			linksFormat: {
				type: 'radioSelect',
				enabled: true,
				default: 'full',
				config: {
					labelMsg: 'settings-links-format',
					helpMsg: 'placeholder',
				},
				optionsType: 'radioOption',
				options: {
					full: {
						labelMsg: 'settings-links-format-full',
					},
					special: {
						labelMsg: 'settings-links-format-special',
					},
					minify: {
						labelMsg: 'settings-links-format-minify',
					},
				},
				onSelect: onLinksFormatSelect,
			},
			wikilinksFormat: {
				type: 'radioSelect',
				enabled: true,
				default: 'special',
				config: {
					labelMsg: 'settings-wikilinks-format',
					helpMsg: 'placeholder',
				},
				optionsType: 'radioOption',
				options: {
					link: {
						labelMsg: 'settings-wikilinks-format-link',
					},
					special: {
						labelMsg: 'settings-wikilinks-format-special',
					},
				},
				onSelect: onWikilinksFormatSelect,
			},
		},
	},

	pinnedActions: {
		config: {
			labelMsg: 'settings-fieldset-pinned-actions',
		},
		fields: {
			pinnedActions: {
				type: 'checkboxMultiselect',
				enabled: true,
				default: [ 'copyLink' ],
				config: {
					labelMsg: 'settings-pinned-actions',
					helpMsg: 'settings-pinned-actions-help',
				},
				optionsType: 'checkboxMultioption',
				options: getPinnedActionsOptions,
			},
		},
	},
};

/**
 * Renders content for the Intro field.
 * @private
 * @returns {OO.ui.Widget}
 */
function renderIntroField() {
	/*!
	 * Logo "Instant_Diffs_logo_with_wordmark.svg"
	 * @author Serhio Magpie
	 * @see {@link https://commons.wikimedia.org/wiki/File:Instant_Diffs_logo_with_wordmark.svg }
	 */

	const image = (/** @type {string} */ require( './images/Instant_Diffs_logo_with_wordmark.svg' ) );
	const contributors = id.config.contributors.join( ', ' );
	const translators = Object
		.entries( id.i18n )
		.map( ( [ key, value ] ) => {
			value = value[ '@metadata' ]?.authors?.join( ', ' ) || null;
			return [ key, value ]
				.filter( entry => !utils.isEmpty( entry ) )
				.join( ': ' );
		} )
		.join( '; ' );

	const content = h( 'div', {
			class: 'instantDiffs-settings-intro',
		},
		h( 'div', {
			class: 'instantDiffs-image--intro',
			role: 'image',
			title: utils.msg( 'script-name' ),
			innerHTML: image,
		} ),
		h( 'ul.instantDiffs-list--intro',
			h( 'li',
				h( 'a', {
					href: utils.originPage( id.config.link ),
					target: '_blank',
					innerText: utils.msg( 'intro-link-about' ),
				} ),
			),
			h( 'li',
				h( 'a', {
					href: utils.originPage( `${ id.config.link }/News` ),
					target: '_blank',
					innerText: utils.msg( 'intro-link-news' ),
				} ),
			),
			h( 'li',
				h( 'a', {
					href: utils.originPage( id.config.discussion ),
					target: '_blank',
					innerText: utils.msg( 'intro-link-talk' ),
				} ),
			),
			h( 'li',
				h( 'a', {
					href: utils.originPage( `${ id.config.link }/API` ),
					target: '_blank',
					innerText: utils.msg( 'intro-link-api' ),
				} ),
			),
		),
		h( 'p',
			h( 'strong', `${ utils.msg( 'intro-version' ) }:` ),
			ht( ` ${ id.config.version }.` ),
		),
		h( 'p',
			h( 'strong', `${ utils.msg( 'intro-contributors' ) }:` ),
			ht( ` ${ contributors }.` ),
		),
		h( 'p',
			h( 'strong', `${ utils.msg( 'intro-translators' ) }:` ),
			ht( ` ${ translators }.` ),
		),
		h( 'hr' ),
	);

	return new OO.ui.Widget( {
		$content: $( content ),
	} );
}

/**
 * Gets tooltip help message for the Hotkeys field.
 * @private
 * @returns {OO.ui.HtmlSnippet}
 */
function getHotkeysHelpSnippet() {
	const items = [ 'close', 'prev', 'next', 'snapshot-prev', 'snapshot-next', 'switch', 'actions', 'unpatrolled', 'back' ];
	const elements = items.map( item => {
		const $message = utils.msgDom( `hint-${ item }-description`, kdb( utils.msg( `hint-${ item }` ) ) );
		return h( 'li', hj( $message ) );
	} );
	const list = h( 'ul.instantDiffs-list--hotkeys', ...elements );
	return utils.htmlSnippet( list );
}

function onShowDiffToolsChange() {
	const value = this.getFieldValue( 'showDiffTools' );
	this.setFieldDisabled( 'enableReviewForm', !value, true );
}

/**
 * Event that emits after a links revision hash setting was changed.
 * @private
 */
function onLinksHashChange() {
	// Update the Links Format field help text
	onLinksFormatSelect.call( this, this.getField( 'linksFormat' ) );
}

/**
 * Event that emits after a links label hash setting was changed.
 * @private
 */
function onLinksLabelChange() {
	// Update the Links Format field help text
	onLinksFormatSelect.call( this, this.getField( 'linksFormat' ) );
}

/**
 * Event that emits after a links format setting was changed.
 * @private
 */
function onLinksFormatSelect() {
	const linksHash = this.getFieldValue( 'linksHash' );
	const linkFormat = this.getFieldValue( 'linksFormat' );
	const linksLabel = this.getFieldValue( 'linksLabel' );

	const options = {
		relative: false,
		hash: linksHash,
		label: linksLabel,
		minify: linkFormat === 'minify',
		special: linkFormat === 'special',
	};
	const help = getLinksFormatExample( options );
	this.setFieldHelp( 'linksFormat', help );

	// Update the Wikilink field help text
	onWikilinksFormatSelect.call( this, this.getField( 'wikilinksFormat' ) );
}

/**
 * Event that emits after a wikilinks format setting was changed.
 * @private
 */
function onWikilinksFormatSelect() {
	const linksHash = this.getFieldValue( 'linksHash' );
	const linkFormat = this.getFieldValue( 'linksFormat' );
	const linksLabel = this.getFieldValue( 'linksLabel' );
	const wikilinkFormat = this.getFieldValue( 'wikilinksFormat' );

	const options = {
		relative: false,
		hash: linksHash,
		label: linksLabel,
		minify: linkFormat === 'minify',
		special: linkFormat === 'special',
		wikilink: true,
		wikilinkPreset: wikilinkFormat,
	};
	const help = getLinksFormatExample( options );
	this.setFieldHelp( 'wikilinksFormat', help );
}

/**
 * Renders link href examples.
 * @private
 * @param {Record<string, *>} options - Href options
 * @returns {HTMLElement}
 */
function getLinksFormatExample( options ) {
	const title = utils.msg( 'copy-wikilink-example-title' );
	const diff = getHref( { title, diff: '12345', section: 'Section' }, {}, options );
	const revision = getHref( { title, oldid: '12345', section: 'Section' }, {}, options );
	const page = getHref( { title, curid: '12345', section: 'Section' }, {}, options );

	return h( 'ul.instantDiffs-list--examples',
		h( 'li', h( 'i', diff ) ),
		h( 'li', h( 'i', revision ) ),
		h( 'li', h( 'i', page ) ),
	);
}

/**
 * Gets navigation pinnable actions as an object of options.
 * Includes both currently available actions and previously pinned actions.
 * @returns {Record<string, Record>} Map of action names to their options
 * @example
 * // Returns: { 'prev': { label: 'Previous' }, 'next': { label: 'Next' } }
 */
function getPinnedActionsOptions() {
	const actions = view.getPage()?.getNavigation()?.getPinnableActions();
	if ( !actions ) return {};

	// Build entries from available actions
	const addedActionNames = new Set();
	const entries = actions.map( action => {
		addedActionNames.add( action.name );

		return [
			action.name,
			{
				label: action.label,
				disabled: utils.isBoolean( action.pin ),
			},
		];
	} );

	// Add previously pinned actions that are not currently available
	const pinnedActions = settings.get( 'pinnedActions' ) || [];
	pinnedActions.forEach( name => {
		if ( addedActionNames.has( name ) ) return;

		entries.push( [
			name,
			{
				label: name,
				show: false,  // Mark as hidden since not currently available
			},
		] );
	} );

	return Object.fromEntries( entries );
}