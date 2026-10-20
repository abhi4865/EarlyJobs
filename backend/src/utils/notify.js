// backend/src/utils/notify.js
import Notification from "../models/Notification.js";

/** Creates a workspace notification. Never lets a notification failure break the request. */
export default async function notify(text) {
  try {
    await Notification.create({ text });
  } catch (err) {
    console.error("Could not create notification:", err.message);
  }
}
