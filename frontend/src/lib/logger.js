/**
 * Minimal dev-aware logger.
 * - debug/info: emitted only in development (stripped from production UX)
 * - warn/error: always emitted (real failures must never be silent)
 *
 * Use instead of raw console.* calls across the app.
 */
const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (...args) => {
    if (isDev) console.debug(...args);
  },
  info: (...args) => {
    if (isDev) console.info(...args);
  },
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

export default logger;
