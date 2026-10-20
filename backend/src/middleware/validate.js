// backend/src/middleware/validate.js
import { z } from "zod";
import ApiError from "../utils/ApiError.js";

export { z };

/**
 * validate(schema) — parses req.body with a zod schema.
 * On failure responds 400 with the FIRST issue's message (messages are shown directly in the UI).
 * On success req.body is replaced with the parsed (trimmed, whitelisted) data.
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    return next(new ApiError(400, result.error.issues[0]?.message || "Invalid request"));
  }
  req.body = result.data;
  next();
};

/* ---------- reusable field builders ---------- */

/** Required, trimmed, non-empty string with a custom message. */
export const reqString = (message) =>
  z.string({ required_error: message, invalid_type_error: message }).trim().min(1, message);

/** Optional string. `null` becomes "" (clears the value); `undefined` means "leave unchanged". */
export const optString = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v === null ? "" : v));

/** Required, lowercased, valid email. */
export const emailField = (message) =>
  z.string({ required_error: message, invalid_type_error: message }).trim().toLowerCase().email(message);

/** Enum with a plain-English error message. */
export const oneOf = (values, message) => z.enum(values, { errorMap: () => ({ message }) });

/** Optional list of non-empty trimmed strings. */
export const stringList = z
  .array(z.string())
  .nullish()
  .transform((list) => (list == null ? undefined : list.map((s) => s.trim()).filter(Boolean)));

/** Optional ISO date string → validated string (converted to Date in the controller). */
export const dateString = (message) =>
  z
    .string({ required_error: message, invalid_type_error: message })
    .refine((v) => !Number.isNaN(Date.parse(v)), message);

/** Optional number that tolerates null (null clears the value). */
export const optNumber = (message, { min = 0 } = {}) =>
  z.number({ invalid_type_error: message }).min(min, message).nullish();

export const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "Color must be a hex value like #3B82F6");
