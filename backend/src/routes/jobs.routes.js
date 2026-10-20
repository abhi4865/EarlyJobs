// backend/src/routes/jobs.routes.js
import { Router } from "express";
import { createJob, deleteJob, getJob, listJobs, updateJob } from "../controllers/jobs.controller.js";
import { JOB_STATUSES, JOB_TYPES } from "../config/defaults.js";
import { oneOf, optNumber, reqString, stringList, validate, z } from "../middleware/validate.js";
import { checkId } from "../utils/objectId.js";

const router = Router();
router.param("id", checkId("Job"));

const REQUIRED = "Title, department and location are required";

const jobSchema = z.object({
  title: reqString(REQUIRED),
  department: reqString(REQUIRED),
  location: reqString(REQUIRED),
  type: oneOf(JOB_TYPES, "Invalid job type").optional(),
  status: oneOf(JOB_STATUSES, "Invalid job status").optional(),
  experienceMin: optNumber("Experience must be a positive number"),
  experienceMax: optNumber("Experience must be a positive number"),
  salaryMin: optNumber("Salary must be a positive number"),
  salaryMax: optNumber("Salary must be a positive number"),
  openings: z.number({ invalid_type_error: "Openings must be at least 1" }).int("Openings must be a whole number").min(1, "Openings must be at least 1").optional(),
  description: z.string().nullish().transform((v) => (v === null ? "" : v)),
  skills: stringList,
  interviewers: stringList,
  notes: z.string().nullish().transform((v) => (v === null ? "" : v)),
});

router.route("/").get(listJobs).post(validate(jobSchema), createJob);
router.route("/:id").get(getJob).put(validate(jobSchema.partial()), updateJob).delete(deleteJob);

export default router;
