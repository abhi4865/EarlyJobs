// backend/src/routes/settings.routes.js
import { Router } from "express";
import { ROLES } from "../config/defaults.js";
import {
  addUser,
  getSettings,
  removeUser,
  setIntegration,
  sourceHandlers,
  stageHandlers,
  updateCompany,
  updateNotifications,
  updateProfile,
} from "../controllers/settings.controller.js";
import { emailField, hexColor, oneOf, optString, reqString, validate, z } from "../middleware/validate.js";

const router = Router();

const profileSchema = z.object({
  name: reqString("Name is required"),
  email: emailField("A valid email is required"),
  role: oneOf(ROLES, "Invalid role").optional(),
  phone: optString,
});

const companySchema = z.object({
  name: reqString("Company name is required"),
  website: optString,
  industry: optString,
  location: optString,
});

const notificationsSchema = z.object({
  newCandidate: z.boolean().optional(),
  interviewReminder: z.boolean().optional(),
  stageChange: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
});

const integrationSchema = z.object({
  connected: z.boolean({ required_error: "connected must be true or false", invalid_type_error: "connected must be true or false" }),
});

const userSchema = z.object({
  name: reqString("Name and a valid email are required"),
  email: emailField("Name and a valid email are required"),
  role: oneOf(ROLES, "Invalid role").default("Recruiter"),
});

const reorderSchema = z.object({
  ids: z.array(z.string(), { required_error: "ids must be a list", invalid_type_error: "ids must be a list" }),
});

router.get("/", getSettings);
router.put("/profile", validate(profileSchema), updateProfile);
router.put("/company", validate(companySchema), updateCompany);
router.put("/notifications", validate(notificationsSchema), updateNotifications);
router.put("/integrations/:key", validate(integrationSchema), setIntegration);
router.post("/users", validate(userSchema), addUser);
router.delete("/users/:id", removeUser);

/** Stages and sources share the same route shape. */
const mountList = (path, label, handlers) => {
  const createSchema = z.object({ name: reqString(`${label} name is required`), color: hexColor.optional() });
  const updateSchema = z.object({ name: reqString(`${label} name is required`).optional(), color: hexColor.optional() });

  router.post(path, validate(createSchema), handlers.create);
  router.put(`${path}/reorder`, validate(reorderSchema), handlers.reorder); // before "/:id"
  router.put(`${path}/:id`, validate(updateSchema), handlers.update);
  router.delete(`${path}/:id`, handlers.remove);
};

mountList("/stages", "Stage", stageHandlers);
mountList("/sources", "Source", sourceHandlers);

export default router;
