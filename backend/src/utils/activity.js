// backend/src/utils/activity.js
import Candidate from "../models/Candidate.js";

/** A candidate activity / note entry. */
export const activityEntry = (text) => ({ text, createdAt: new Date() });

/** Appends an activity line to a candidate without loading the document. */
export const logActivity = (candidateId, text) =>
  Candidate.updateOne({ _id: candidateId }, { $push: { activity: activityEntry(text) } });
