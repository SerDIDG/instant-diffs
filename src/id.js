/**
 * The main script namespace, globally available.
 *
 * @namespace instantDiffs
 * @property {boolean} isRunning - Script start initializing
 * @property {boolean} isFirstRun - Initial first run started
 * @property {boolean} isRunCompleted - Initial first run finished
 * @property {boolean} isReady - Script initialized
 * @property {boolean} isReplaced
 * @property {boolean} isUnloading
 * @property {boolean} isPageAdjustmentsApplied
 * @property {import('./config').config} config - Configuration
 * @property {import('./config').local} local - Local variables
 * @property {import('./config').timers} timers - Script timer loggers
 * @property {Record<string, any>} settings - User-defined setting options
 * @property {Record<string, any>} defaults - User-defined setting defaults
 * @property {import('./utils')} utils - Utility functions
 * @property {Record<string, any>} modules - Exported modules
 * @global
 */
self.instantDiffs ||= {};

const instantDiffs = self.instantDiffs;

export default instantDiffs;