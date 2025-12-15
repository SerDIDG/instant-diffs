import * as utils from './utils';
import { getHref } from './utils-article';

import view from './view';

const { h } = utils;

export const schema = {
	general: {
		config: {
			label: utils.msg( 'settings-fieldset-general' ),
		},
		fields: {
			enableMobile: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-enable-mobile' ),
					help: utils.msg( 'settings-enable-mobile-help' ),
				},
			},
			notifyErrors: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-notify-errors' ),
				},
			},
		},
	},

	links: {
		config: {
			label: utils.msg( 'settings-fieldset-links' ),
		},
		fields: {
			showLink: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-show-link' ),
					help: utils.msg( 'settings-show-link-help' ),
				},
			},
			showPageLink: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-show-page-link' ),
					help: utils.msgDom( 'settings-show-page-link-help' ),
				},
			},
			highlightLine: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-highlight-line' ),
				},
			},
			markWatchedLine: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-mark-watched-line' ),
				},
			},
		},
	},

	dialog: {
		config: {
			label: utils.msg( 'settings-fieldset-dialog' ),
		},
		fields: {
			viewWidth: {
				type: 'buttonSelect',
				config: {
					label: utils.msg( 'settings-view-width' ),
					help: utils.msgDom( 'settings-view-width-help' ),
				},
				optionsType: 'buttonOption',
				options: {
					compact: {
						label: utils.msg( 'settings-view-width-compact' ),
						title: utils.msg( 'settings-view-width-option-title', view.constructor.getSize( 'compact' ).width ),
					},
					standard: {
						label: utils.msg( 'settings-view-width-standard' ),
						title: utils.msg( 'settings-view-width-option-title', view.constructor.getSize( 'standard' ).width ),
					},
					wide: {
						label: utils.msg( 'settings-view-width-wide' ),
						title: utils.msg( 'settings-view-width-option-title', view.constructor.getSize( 'wide' ).width ),
					},
					full: {
						label: utils.msg( 'settings-view-width-full' ),
						title: utils.msg( 'settings-view-width-full-title' ),
					},
				},
			},
			closeOutside: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-close-outside' ),
				},
			},
			enableHotkeys: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-enable-hotkeys' ),
				},
			},
			showDiffTools: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-show-diff-tools' ),
				},
			},
			showRevisionInfo: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-show-revision-info' ),
				},
			},
			unHideDiffs: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-unhide-diffs' ),
					help: utils.msgDom( 'settings-unhide-diffs-help', 'suppressrevision' ),
				},
			},
			openInNewTab: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-open-in-new-tab' ),
				},
			},
		},
	},

	menu: {
		config: {
			label: utils.msg( 'settings-fieldset-menu' ),
		},
		fields: {
			showMenuIcons: {
				type: 'checkbox',
				config: {
					label: utils.msg( 'settings-show-menu-icons' ),
				},
			},
			linksFormat: {
				type: 'radioSelect',
				config: {
					label: utils.msg( 'settings-links-format' ),
					help: 'placeholder',
				},
				optionsType: 'radioOption',
				options: {
					full: {
						label: utils.msg( 'settings-links-format-full' ),
					},
					minify: {
						label: utils.msg( 'settings-links-format-minify' ),
					},
				},
				onSelect: onLinksFormatSelect,
			},
			wikilinksFormat: {
				type: 'radioSelect',
				config: {
					label: utils.msg( 'settings-wikilinks-format' ),
					help: 'placeholder',
				},
				optionsType: 'radioOption',
				options: {
					link: {
						label: utils.msg( 'settings-wikilinks-format-link' ),
					},
					special: {
						label: utils.msg( 'settings-wikilinks-format-special' ),
					},
				},
				onSelect: onWikilinksFormatSelect,
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