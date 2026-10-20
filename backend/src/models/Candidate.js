// backend/src/models/Candidate.js
import mongoose from "mongoose";

const { Schema } = mongoose;

// Used for both `notes` and `activity` (each entry gets its own _id)
const entrySchema = new Schema({
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const candidateSchema = new Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: { type: String, required: [true, "A valid email is required"], unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    linkedin: { type: String, default: "", trim: true },
    job: { type: Schema.Types.ObjectId, ref: "Job", required: [true, "Select a job position"], index: true },
    stage: { type: String, required: true, index: true },
    source: { type: String, default: "Other", index: true },
    appliedOn: { type: Date, default: Date.now, index: true },
    expectedSalary: { type: String, default: "" },
    noticePeriod: { type: String, default: "" },
    skills: { type: [String], default: [] },
    resume: {
      name: { type: String, default: "" },
      size: { type: String, default: "—" },
      url: { type: String, default: null },
    },
    notes: { type: [entrySchema], default: [] },
    activity: { type: [entrySchema], default: [] },
  },
  { timestamps: true }
);

candidateSchema.index({ name: 1 });

export default mongoose.model("Candidate", candidateSchema);
