// backend/src/routes/interviews.routes.js
import { Router } from "express";
import {
  createInterview,
  deleteInterview,
  interviewStats,
  listInterviews,
  setInterviewStatus,
  updateInterview,
} from "../controllers/interviews.controller.js";
import { INTERVIEW_STATUSES, INTERVIEW_TYPES } from "../config/defaults.js";
import { dateString, oneOf, optString, reqString, validate, z } from "../middleware/validate.js";
import { checkId } from "../utils/objectId.js";

const router = Router();
router.param("id", checkId("Interview"));

const interviewer = z.object({
  name: reqString("Interviewer name is required"),
  role: z.string().trim().nullish().transform((v) => v || "Interviewer"),
});

const feedback = z
  .object({
    rating: z
      .number({ required_error: "Rating must be between 1 and 5", invalid_type_error: "Rating must be between 1 and 5" })
      .int("Rating must be between 1 and 5")
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5"),
    text: z.string().nullish().transform((v) => v ?? ""),
  })
  .nullable();

const createSchema = z.object({
  candidateId: reqString("Select a candidate"),
  start: dateString("Start time is required"),
  end: dateString("End time is required"),
  type: oneOf(INTERVIEW_TYPES, "Invalid interview type").default("Video Call"),
  location: optString,
  interviewers: z.array(interviewer).optional(),
});

// candidate cannot change on update
const updateSchema = z.object({
  start: dateString("Start time is required").optional(),
  end: dateString("End time is required").optional(),
  type: oneOf(INTERVIEW_TYPES, "Invalid interview type").optional(),
  status: oneOf(INTERVIEW_STATUSES, "Invalid interview status").optional(),
  location: optString,
  interviewers: z.array(interviewer).optional(),
  feedback: feedback.optional(),
  notes: z.string().nullish().transform((v) => (v === null ? "" : v)),
});

const statusSchema = z.object({
  status: oneOf(INTERVIEW_STATUSES, "Invalid interview status"),
});

router.route("/").get(listInterviews).post(validate(createSchema), createInterview);
router.get("/stats", interviewStats); // must be registered before "/:id"
router.route("/:id").put(validate(updateSchema), updateInterview).delete(deleteInterview);
router.patch("/:id/status", validate(statusSchema), setInterviewStatus);

export default router;
