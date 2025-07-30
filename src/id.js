/**
 * The main script namespace, globally available.
 *
 * @namespace instantDiffs
 * @property {import('./config').config} config - Configuration
 * @property {import('./config').local} local - Local variables
 * @property {import('./config').timers} timers - Script timer loggers
 * @property {Object} settings - User-defined setting options
 * @property {Object} defaults - User-defined setting defaults
 * @property {import('./utils')} utils - Utility functions
 * @property {Object} modules - Exported modules
 * @global
 */
self.instantDiffs ||= {};

const instantDiffs = self.instantDiffs;

export default instantDiffs;