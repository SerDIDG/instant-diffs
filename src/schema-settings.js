import * as utils from './utils';
import { getHref } from './utils-article';

import view from './view';

const { h } = utils;

export const schema = {
	general: {
		config: {
			label: 'settings-fieldset-general',
		},
		fields: {
			enableMobile: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					label: 'settings-enable-mobile',
					help: 'settings-enable-mobile-help',
				},
			},
			notifyErrors: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					label: 'settings-notify-errors',
				},
			},
		},
	},

	links: {
		config: {
			label: 'settings-fieldset-links',
		},
		fields: {
			showLink: {
				type: 'checkbox',
				enabled: true,
				default: false,
				config: {
					label: 'settings-show-link',
					help: 'settings-show-link-help',
				},
			},
			showPageLink: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					label: 'settings-show-page-link',
					help: 'settings-show-page-link-help',
				},
			},
			highlightLine: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					label: 'settings-highlight-line',
				},
			},
			markWatchedLine: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					label: 'settings-mark-watched-line',
				},
			},
		},
	},

	dialog: {
		config: {
			label: 'settings-fieldset-dialog',
		},
		fields: {
			viewWidth: {
				type: 'buttonSelect',
				enabled: true,
				default: 'standard',
				config: {
					label: 'settings-view-width',
					help: 'settings-view-width-help',
				},
				optionsType: 'buttonOption',
				options: {
					compact: {
						label: 'settings-view-width-compact',
						title: [ 'settings-view-width-option-title', view.constructor.getSize( 'compact' ).width ],
					},
					standard: {
						label: 'settings-view-width-standard',
						title: [ 'settings-view-width-option-title', view.constructor.getSize( 'standard' ).width ],
					},
					wide: {
						label: 'settings-view-width-wide',
						title: [ 'settings-view-width-option-title', view.constructor.getSize( 'wide' ).width ],
					},
					full: {
						label: 'settings-view-width-full',
						title: 'settings-view-width-full-title',
					},
				},
			},
			closeOutside: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					label: 'settings-close-outside',
				},
			},
			enableHotkeys: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					label: 'settings-enable-hotkeys',
				},
			},
			showDiffTools: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					label: 'settings-show-diff-tools',
				},
			},
			showRevisionInfo: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					label: 'settings-show-revision-info',
				},
			},
			unHideDiffs: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					label: 'settings-unhide-diffs',
					help: [ 'settings-unhide-diffs-help', 'suppressrevision' ],
				},
			},
			openInNewTab: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					label: 'settings-open-in-new-tab',
				},
			},
		},
	},

	menu: {
		config: {
			label: 'settings-fieldset-menu',
		},
		fields: {
			showMenuIcons: {
				type: 'checkbox',
				enabled: true,
				default: true,
				config: {
					label: 'settings-show-menu-icons',
				},
			},
			linksFormat: {
				type: 'radioSelect',
				enabled: true,
				default: 'full',
				config: {
					label: 'settings-links-format',
					help: 'placeholder',
				},
				optionsType: 'radioOption',
				options: {
					full: {
						label: 'settings-links-format-full',
					},
					minify: {
						label: 'settings-links-format-minify',
					},
				},
				onSelect: onLinksFormatSelect,
			},
			wikilinksFormat: {
				type: 'radioSelect',
				enabled: true,
				default: 'special',
				config: {
					label: 'settings-wikilinks-format',
					help: 'placeholder',
				},
				optionsType: 'radioOption',
				options: {
					link: {
						label: 'settings-wikilinks-format-link',
					},
					special: {
						label: 'settings-wikilinks-format-special',
					},
				},
				onSelect: onWikilinksFormatSelect,
			},
			pinnedActions: {
				type: 'checkboxMultiSelect',
				enabled: true,
				default: ['copyLink', 'copyWikilink'],
				config: {
					label: 'settings-pinned-actions',
					help: 'settings-pinned-actions-help',
				},
			},
		},
	},
};

function onLinksFormatSelect() {
	const linkFormat = this.getFieldValue( 'linksFormat' );

	const options = {
		relative: false,
		minify: linkFormat === 'minify',
	};
	const $help = getLinksFormatExample( options );
	this.setFieldHelp( 'linksFormat', $help );

	// Update the Wikilink field help text
	onWikilinksFormatSelect.call( this, this.getField( 'wikilinksFormat' ) );
}

function onWikilinksFormatSelect() {
	const linkFormat = this.getFieldValue( 'linksFormat' );
	const wikilinkFormat = this.getFieldValue( 'wikilinksFormat' );

	const options = {
		relative: false,
		minify: linkFormat === 'minify',
		wikilink: true,
		wikilinkPreset: wikilinkFormat,
	};
	const $help = getLinksFormatExample( options );
	this.setFieldHelp( 'wikilinksFormat', $help );
}

function getLinksFormatExample( options ) {
	const title = utils.msg( 'copy-wikilink-example-title' );
	const diff = getHref( { title, diff: '12345', type: 'diff' }, {}, options );
	const revision = getHref( { title, oldid: '12345', type: 'revision' }, {}, options );
	const page = getHref( { title, curid: '12345', type: 'revision', typeVariant: 'page' }, {}, options );

	return h( 'ul.instantDiffs-list--settings',
		h( 'li', h( 'i', diff ) ),
		h( 'li', h( 'i', revision ) ),
		h( 'li', h( 'i', page ) ),
	);
}