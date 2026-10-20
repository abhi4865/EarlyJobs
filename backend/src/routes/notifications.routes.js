// backend/src/routes/notifications.routes.js
import { Router } from "express";
import { listNotifications, markAllRead } from "../controllers/notifications.controller.js";

const router = Router();
router.get("/", listNotifications);
router.post("/read", markAllRead);

export default router;
