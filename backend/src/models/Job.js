// backend/src/models/Job.js
import mongoose from "mongoose";
import { JOB_STATUSES, JOB_TYPES } from "../config/defaults.js";

const jobSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: [true, "Title, department and location are required"], trim: true },
    department: { type: String, required: [true, "Title, department and location are required"], trim: true },
    location: { type: String, required: [true, "Title, department and location are required"], trim: true },
    type: { type: String, enum: JOB_TYPES, default: "Full-time" },
    status: { type: String, enum: JOB_STATUSES, default: "Active", index: true },
    experienceMin: { type: Number, min: 0 },
    experienceMax: { type: Number, min: 0 },
    salaryMin: { type: Number, min: 0 }, // LPA
    salaryMax: { type: Number, min: 0 }, // LPA
    openings: { type: Number, min: [1, "Openings must be at least 1"], default: 1 },
    description: { type: String, default: "" },
    skills: { type: [String], default: [] },
    interviewers: { type: [String], default: [] },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

jobSchema.index({ createdAt: -1 });

export default mongoose.model("Job", jobSchema);
