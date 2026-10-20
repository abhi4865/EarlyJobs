// backend/src/controllers/notifications.controller.js
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";

/* GET /api/notifications — latest 20 (newest first) + unread count */
export const listNotifications = asyncHandler(async (req, res) => {
  const [data, unread] = await Promise.all([
    Notification.find().sort({ createdAt: -1, _id: -1 }).limit(20).lean(),
    Notification.countDocuments({ read: false }),
  ]);
  res.json({ data: data.map(({ __v, ...n }) => n), unread });
});

/* POST /api/notifications/read — mark everything as read */
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ read: false }, { $set: { read: true } });
  res.json({ message: "ok" });
});
