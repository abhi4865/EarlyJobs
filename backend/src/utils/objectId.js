// backend/src/utils/objectId.js
import mongoose from "mongoose";
import ApiError from "./ApiError.js";

/** True only for a real 24-char hex ObjectId string. */
export const isObjectId = (value) => typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

export const toObjectId = (value) => new mongoose.Types.ObjectId(value);

/** router.param handler: invalid ids become a clean 404 ("Candidate not found"). */
export const checkId = (label) => (req, res, next, value) => {
  if (!isObjectId(value)) return next(new ApiError(404, `${label} not found`));
  next();
};

/** Reads a query param as a trimmed string ("" if missing or not a string). */
export const queryString = (value) => (typeof value === "string" ? value.trim() : "");
