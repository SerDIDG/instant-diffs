self.instantDiffs ||= {};

/**
 * @namespace instantDiffs
 * @typedef {object} InstantDiffsNamespace
 * @property {boolean} isRunning - Script has started initializing
 * @property {boolean} isFirstRun - Initial first run started
 * @property {boolean} isRunCompleted - Initial first run finished
 * @property {boolean} isReady - Script initialized
 * @property {boolean} isReplaced - Script instance was replaced
 * @property {boolean} isUnloading - Script activity paused; tab is inactive
 * @property {boolean} isPageAdjustmentsApplied - Page-specific adjustments were applied
 * @property {Record<string, Record<string, Record|string>>} i18n - Localized strings map
 * @property {Record<string, any>} [defaults] - Temporary user-defined setting defaults, removed after initialization
 * @property {Record<string, Record<string, any>>} user - User-defined settings and defaults
 * @property {import('./config').config} config - Configuration
 * @property {import('./config').local} local - Local variables
 * @property {import('./config').timers} timers - Script timer loggers
 * @property {import('./utils')} utils - Utility functions
 * @property {InstanceType<typeof import('./view').default>} view - View instance
 * @property {InstanceType<typeof import('./settings').default>} settings - Settings instance
 * @property {{
 *   Api: typeof import('./Api').default,
 *   Article: typeof import('./Article').default,
 *   Link: typeof import('./Link').default,
 *   Button: typeof import('./Button').default,
 *   ViewButton: typeof import('./ViewButton').default,
 *   HistoryCompareButton: typeof import('./HistoryCompareButton').default,
 *   Page: typeof import('./Page').default,
 *   LocalPage: typeof import('./LocalPage').default,
 *   GlobalPage: typeof import('./GlobalPage').default,
 *   Watch: typeof import('./Watch').default,
 *   view: InstanceType<typeof import('./view').default>,
 *   settings: InstanceType<typeof import('./settings').default>,
 * }} modules - Exported modules
 */

/** @type {InstantDiffsNamespace} */
const instantDiffs = self.instantDiffs;

export default instantDiffs;