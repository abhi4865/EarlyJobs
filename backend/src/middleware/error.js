// backend/src/middleware/error.js
import ApiError from "../utils/ApiError.js";

const FIELD_LABELS = { email: "email", code: "code", name: "name" };

/** 404 for unknown routes (JSON, never HTML). */
export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/** Central error handler — every error leaves the API as `{ message }`. */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err.name === "ValidationError" && err.errors) {
    status = 400;
    message = Object.values(err.errors)[0]?.message || "Validation failed";
  } else if (err.name === "CastError") {
    status = 404;
    message = "Record not found";
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    message = field ? `A record with this ${FIELD_LABELS[field] || field} already exists` : "This record already exists";
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    status = 401;
    message = "Not authorized";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Request body is not valid JSON";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large";
  } else if (!(err instanceof ApiError) && !(status >= 400 && status < 500)) {
    status = 500;
  }

  if (status >= 500) {
    console.error(err);
    message = process.env.NODE_ENV === "production" ? "Something went wrong on our side. Please try again." : err.message || "Server error";
  }

  res.status(status).json({ message });
};
