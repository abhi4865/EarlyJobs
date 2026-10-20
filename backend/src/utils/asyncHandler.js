// backend/src/utils/asyncHandler.js
// Forwards rejected promises to the central error middleware (no try/catch needed in controllers).
export default (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
