// backend/src/models/Settings.js
// Singleton document holding company info, stages, sources, notification prefs and integrations.
import mongoose from "mongoose";
import {
  DEFAULT_COMPANY,
  DEFAULT_INTEGRATIONS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_SOURCES,
  DEFAULT_STAGES,
} from "../config/defaults.js";

const { Schema } = mongoose;

const stageSchema = new Schema({
  name: { type: String, required: true, trim: true },
  color: { type: String, default: "#64748B" },
  locked: { type: Boolean, default: false },
});

const sourceSchema = new Schema({
  name: { type: String, required: true, trim: true },
  color: { type: String, default: "#64748B" },
});

const integrationSchema = new Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    connected: { type: Boolean, default: false },
  },
  { _id: false }
);

const settingsSchema = new Schema(
  {
    company: {
      name: { type: String, default: DEFAULT_COMPANY.name },
      website: { type: String, default: DEFAULT_COMPANY.website },
      industry: { type: String, default: DEFAULT_COMPANY.industry },
      location: { type: String, default: DEFAULT_COMPANY.location },
    },
    stages: { type: [stageSchema], default: () => DEFAULT_STAGES.map((s) => ({ ...s })) },
    sources: { type: [sourceSchema], default: () => DEFAULT_SOURCES.map((s) => ({ ...s })) },
    notifications: {
      newCandidate: { type: Boolean, default: DEFAULT_NOTIFICATIONS.newCandidate },
      interviewReminder: { type: Boolean, default: DEFAULT_NOTIFICATIONS.interviewReminder },
      stageChange: { type: Boolean, default: DEFAULT_NOTIFICATIONS.stageChange },
      weeklyDigest: { type: Boolean, default: DEFAULT_NOTIFICATIONS.weeklyDigest },
    },
    integrations: { type: [integrationSchema], default: () => DEFAULT_INTEGRATIONS.map((i) => ({ ...i })) },
  },
  { timestamps: true }
);

/** Returns the single settings document, creating it with defaults on first use. */
settingsSchema.statics.get = async function get() {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

export default mongoose.model("Settings", settingsSchema);
