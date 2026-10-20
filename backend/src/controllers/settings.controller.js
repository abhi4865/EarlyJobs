// backend/src/controllers/settings.controller.js
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import Candidate from "../models/Candidate.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isObjectId } from "../utils/objectId.js";
import { userDto } from "../utils/serializers.js";

const plain = (settings) => settings.toObject();
const companyOf = (s) => {
  const { name, website, industry, location } = plain(s).company;
  return { name, website, industry, location };
};

/* ---------------------------------------------------------------- overview */

export const getSettings = asyncHandler(async (req, res) => {
  const [settings, users] = await Promise.all([Settings.get(), User.find().sort({ createdAt: 1, _id: 1 }).lean()]);
  const s = plain(settings);
  res.json({
    profile: userDto(req.user),
    company: companyOf(settings),
    stages: s.stages,
    sources: s.sources,
    users: users.map(({ _id, name, email, role }) => ({ _id, name, email, role })),
    notifications: s.notifications,
    integrations: s.integrations,
  });
});

/* ----------------------------------------------------------------- profile */

export const updateProfile = asyncHandler(async (req, res) => {
  const b = req.body;
  const user = req.user;

  if (b.email !== user.email && (await User.exists({ email: b.email, _id: { $ne: user._id } }))) {
    throw ApiError.conflict("A user with this email already exists");
  }
  user.name = b.name;
  user.email = b.email;
  if (b.role !== undefined) user.role = b.role;
  if (b.phone !== undefined) user.phone = b.phone;
  await user.save();
  res.json(userDto(user));
});

/* ----------------------------------------------------------------- company */

export const updateCompany = asyncHandler(async (req, res) => {
  const settings = await Settings.get();
  const b = req.body;
  settings.company.name = b.name;
  for (const key of ["website", "industry", "location"]) {
    if (b[key] !== undefined) settings.company[key] = b[key];
  }
  await settings.save();
  res.json(companyOf(settings));
});

/* ----------------------------------------------------------- notifications */

export const updateNotifications = asyncHandler(async (req, res) => {
  const settings = await Settings.get();
  for (const [key, value] of Object.entries(req.body)) {
    if (value !== undefined) settings.notifications[key] = value;
  }
  await settings.save();
  res.json(plain(settings).notifications);
});

/* ------------------------------------------------------------ integrations */

export const setIntegration = asyncHandler(async (req, res) => {
  const settings = await Settings.get();
  const integration = settings.integrations.find((i) => i.key === req.params.key);
  if (!integration) throw ApiError.notFound("Integration not found");
  integration.connected = req.body.connected;
  await settings.save();
  res.json(integration.toObject());
});

/* ------------------------------------------------------------------- users */

export const addUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;
  if (await User.exists({ email })) throw ApiError.conflict("A user with this email already exists");

  // No email sending yet: the temporary password is printed to the server console.
  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const user = await User.create({ name, email, role, passwordHash: await bcrypt.hash(tempPassword, 10) });

  console.log(`\n[users] Created ${user.email} (${user.role}) — temporary password: ${tempPassword}\n`);
  const { _id } = user;
  res.status(201).json({ _id, name: user.name, email: user.email, role: user.role });
});

export const removeUser = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw ApiError.notFound("User not found");
  if (String(req.user._id) === req.params.id) throw ApiError.badRequest("You can't remove your own account");

  const user = await User.findById(req.params.id).select("_id");
  if (!user) throw ApiError.notFound("User not found");
  await user.deleteOne();
  res.json({ message: "User removed" });
});

/* ------------------------------------------------------ stages and sources */

/**
 * Stages and sources behave the same (ordered, colored, renameable lists); stages additionally
 * have locked core items. This factory builds the handlers for either.
 */
const listHandlers = ({ field, label, candidateField, locked }) => {
  const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const lower = label.toLowerCase();

  const assertNameFree = (items, name, excludeId) => {
    if (items.some((i) => String(i._id) !== String(excludeId) && sameName(i.name, name))) {
      throw ApiError.conflict(`${label} "${name}" already exists`);
    }
  };

  const findItem = (settings, id) => {
    if (!isObjectId(id)) throw ApiError.notFound(`${label} not found`);
    const item = settings[field].find((i) => String(i._id) === id);
    if (!item) throw ApiError.notFound(`${label} not found`);
    return item;
  };

  const create = asyncHandler(async (req, res) => {
    const { name, color } = req.body;
    const settings = await Settings.get();
    assertNameFree(settings[field], name);

    const items = plain(settings)[field];
    const item = { name, color: color || "#64748B", ...(locked ? { locked: false } : {}) };
    // New stages go just before "Hired"; new sources are appended.
    const hiredAt = locked ? items.findIndex((i) => i.name === "Hired") : -1;
    if (hiredAt >= 0) items.splice(hiredAt, 0, item);
    else items.push(item);

    settings[field] = items;
    await settings.save();
    const saved = settings[field].find((i) => i.name === name);
    res.status(201).json(saved.toObject());
  });

  const update = asyncHandler(async (req, res) => {
    const settings = await Settings.get();
    const item = findItem(settings, req.params.id);
    const { name, color } = req.body;

    if (name !== undefined && name !== item.name) {
      if (locked && item.locked) throw ApiError.badRequest(`"${item.name}" is a core ${lower} and can't be renamed`);
      assertNameFree(settings[field], name, item._id);
      const oldName = item.name;
      item.name = name;
      await Candidate.updateMany({ [candidateField]: oldName }, { $set: { [candidateField]: name } });
    }
    if (color !== undefined) item.color = color;

    await settings.save();
    res.json(item.toObject());
  });

  const remove = asyncHandler(async (req, res) => {
    const settings = await Settings.get();
    const item = findItem(settings, req.params.id);

    if (locked && item.locked) throw ApiError.badRequest(`"${item.name}" is a core ${lower} and can't be deleted`);

    const inUse = await Candidate.countDocuments({ [candidateField]: item.name });
    if (inUse > 0) {
      throw ApiError.conflict(`${inUse} candidate${inUse === 1 ? " uses" : "s use"} "${item.name}". Move them first.`);
    }
    settings[field].pull({ _id: item._id });
    await settings.save();
    res.json({ message: `${label} deleted` });
  });

  const reorder = asyncHandler(async (req, res) => {
    const settings = await Settings.get();
    const items = plain(settings)[field];
    const byId = new Map(items.map((i) => [String(i._id), i]));

    const ordered = [];
    for (const id of req.body.ids) {
      const item = byId.get(String(id));
      if (item) {
        ordered.push(item);
        byId.delete(String(id));
      }
    }
    ordered.push(...byId.values()); // anything the client forgot keeps its relative order at the end

    settings[field] = ordered;
    await settings.save();
    res.json(plain(settings)[field]);
  });

  return { create, update, remove, reorder };
};

export const stageHandlers = listHandlers({ field: "stages", label: "Stage", candidateField: "stage", locked: true });
export const sourceHandlers = listHandlers({ field: "sources", label: "Source", candidateField: "source", locked: false });
