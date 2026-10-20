// backend/src/routes/index.js — everything here is mounted under /api
import { Router } from "express";
import { protect } from "../middleware/auth.js";
import authRoutes from "./auth.routes.js";
import candidateRoutes from "./candidates.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import interviewRoutes from "./interviews.routes.js";
import jobRoutes from "./jobs.routes.js";
import notificationRoutes from "./notifications.routes.js";
import settingsRoutes from "./settings.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok" }));

router.use("/auth", authRoutes); // login is public; /me and /change-password protect themselves
router.use("/dashboard", protect, dashboardRoutes);
router.use("/candidates", protect, candidateRoutes);
router.use("/jobs", protect, jobRoutes);
router.use("/interviews", protect, interviewRoutes);
router.use("/notifications", protect, notificationRoutes);
router.use("/settings", protect, settingsRoutes);

export default router;
