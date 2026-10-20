// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/** JWT guard — attaches the logged-in user as req.user. */
export const protect = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) throw ApiError.unauthorized("Not authorized");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw ApiError.unauthorized("Not authorized");
  }

  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized("Not authorized");

  req.user = user;
  next();
});
