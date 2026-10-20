// backend/src/models/Interview.js
import mongoose from "mongoose";
import { INTERVIEW_STATUSES, INTERVIEW_TYPES } from "../config/defaults.js";

const { Schema } = mongoose;

const interviewerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "Interviewer", trim: true },
  },
  { _id: false }
);

const feedbackSchema = new Schema(
  {
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, default: "" },
  },
  { _id: false }
);

const interviewSchema = new Schema(
  {
    candidate: { type: Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
    job: { type: Schema.Types.ObjectId, ref: "Job", index: true },
    start: { type: Date, required: true, index: true },
    end: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return !this.start || value > this.start;
        },
        message: "End time must be after start time",
      },
    },
    type: { type: String, enum: INTERVIEW_TYPES, default: "Video Call" },
    status: { type: String, enum: INTERVIEW_STATUSES, default: "Scheduled", index: true },
    location: { type: String, default: "", trim: true },
    interviewers: { type: [interviewerSchema], default: [] },
    feedback: { type: feedbackSchema, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);
