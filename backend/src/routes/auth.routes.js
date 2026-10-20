// backend/src/routes/auth.routes.js
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { changePassword, login, me } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";
import { validate, z } from "../middleware/validate.js";

const router = Router();

// 10 failed attempts per 15 minutes per IP (successful logins don't count)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email and password are required", invalid_type_error: "Email and password are required" })
    .trim()
    .toLowerCase()
    .min(1, "Email and password are required"),
  password: z
    .string({ required_error: "Email and password are required", invalid_type_error: "Email and password are required" })
    .min(1, "Email and password are required"),
});

const passwordSchema = z.object({
  currentPassword: z
    .string({ required_error: "Current password is required", invalid_type_error: "Current password is required" })
    .min(1, "Current password is required"),
  newPassword: z
    .string({ required_error: "New password must be at least 8 characters", invalid_type_error: "New password must be at least 8 characters" })
    .min(8, "New password must be at least 8 characters")
    .max(128, "New password must be at most 128 characters"),
});

router.post("/login", loginLimiter, validate(loginSchema), login);
router.get("/me", protect, me);
router.post("/change-password", protect, validate(passwordSchema), changePassword);

export default router;
