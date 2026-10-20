// backend/src/models/User.js
import mongoose from "mongoose";
import { ROLES } from "../config/defaults.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: { type: String, required: [true, "A valid email is required"], unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "Recruiter" },
    phone: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
