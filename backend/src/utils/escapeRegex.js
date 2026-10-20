// backend/src/utils/escapeRegex.js
// Never put raw user input into `new RegExp` — always escape it first.
export const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Case-insensitive "contains" regex built from user input. */
export const containsRegex = (value = "") => new RegExp(escapeRegex(String(value).trim()), "i");

export default escapeRegex;
