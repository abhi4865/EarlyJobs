// backend/src/utils/stats.js

/** Growth percentage: pct(current, previous). */
export const pct = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0);

export const DAY_MS = 24 * 60 * 60 * 1000;

export const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
export const startOfMonth = (d = new Date(), offset = 0) => new Date(d.getFullYear(), d.getMonth() + offset, 1);
