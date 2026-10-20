// backend/src/routes/candidates.routes.js
import { Router } from "express";
import {
  addNote,
  createCandidate,
  deleteCandidate,
  getCandidate,
  listCandidates,
  setStage,
  updateCandidate,
} from "../controllers/candidates.controller.js";
import { emailField, optString, reqString, stringList, validate, z } from "../middleware/validate.js";
import { checkId } from "../utils/objectId.js";

const router = Router();
router.param("id", checkId("Candidate"));

const candidateSchema = z.object({
  name: reqString("Name is required"),
  email: emailField("A valid email is required"),
  jobId: reqString("Select a job position"),
  phone: optString,
  location: optString,
  linkedin: optString,
  stage: optString,
  source: optString,
  expectedSalary: optString,
  noticePeriod: optString,
  skills: stringList,
});

const stageSchema = z.object({
  stage: reqString("Unknown stage"),
});

const noteSchema = z.object({
  text: reqString("Note cannot be empty"),
});

router.route("/").get(listCandidates).post(validate(candidateSchema), createCandidate);
router.route("/:id").get(getCandidate).put(validate(candidateSchema.partial()), updateCandidate).delete(deleteCandidate);
router.patch("/:id/stage", validate(stageSchema), setStage);
router.post("/:id/notes", validate(noteSchema), addNote);

export default router;
