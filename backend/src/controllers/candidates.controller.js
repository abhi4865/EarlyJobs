// backend/src/controllers/candidates.controller.js
import Candidate from "../models/Candidate.js";
import Interview from "../models/Interview.js";
import Job from "../models/Job.js";
import Settings from "../models/Settings.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { activityEntry } from "../utils/activity.js";
import { containsRegex } from "../utils/escapeRegex.js";
import notify from "../utils/notify.js";
import { isObjectId, queryString, toObjectId } from "../utils/objectId.js";
import { paginated, parsePagination } from "../utils/pagination.js";
import { candidateDto } from "../utils/serializers.js";

const SORT_FIELDS = { name: "name", job: "jobDoc.title", stage: "stage", appliedOn: "appliedOn" };

const jobLookup = [
  { $lookup: { from: Job.collection.name, localField: "job", foreignField: "_id", as: "jobDoc" } },
  { $unwind: { path: "$jobDoc", preserveNullAndEmptyArrays: true } },
];
const shapeJob = [
  {
    $addFields: {
      job: {
        $cond: [{ $eq: [{ $type: "$jobDoc" }, "object"] }, { _id: "$jobDoc._id", title: "$jobDoc.title" }, "$job"],
      },
    },
  },
  { $project: { jobDoc: 0, __v: 0 } },
];

/** `{ total, <StageName>: n, ... }` over ALL candidates (ignores filters). */
const stageCounts = async (settings) => {
  const rows = await Candidate.aggregate([{ $group: { _id: "$stage", n: { $sum: 1 } } }]);
  const counts = { total: 0 };
  settings.stages.forEach((s) => { counts[s.name] = 0; });
  for (const { _id, n } of rows) {
    counts.total += n;
    if (_id in counts && _id !== "total") counts[_id] = n;
  }
  return counts;
};

const loadCandidate = async (id) => {
  const doc = await Candidate.findById(id).populate("job", "title").lean();
  if (!doc) throw ApiError.notFound("Candidate not found");
  return candidateDto(doc);
};

const assertJobExists = async (jobId) => {
  if (!isObjectId(jobId) || !(await Job.exists({ _id: jobId }))) throw ApiError.badRequest("Select a job position");
};

const assertEmailFree = async (email, excludeId) => {
  const clash = await Candidate.exists({ email, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
  if (clash) throw ApiError.conflict("A candidate with this email already exists");
};

const assertStageExists = (settings, stage) => {
  if (!settings.stages.some((s) => s.name === stage)) throw ApiError.badRequest("Unknown stage");
};

/* GET /api/candidates */
export const listCandidates = asyncHandler(async (req, res) => {
  const pager = parsePagination(req.query);
  const search = queryString(req.query.search);
  const stage = queryString(req.query.stage);
  const source = queryString(req.query.source);
  const jobId = queryString(req.query.jobId);
  const sortKey = SORT_FIELDS[req.query.sort] ? req.query.sort : "appliedOn";
  const dir = req.query.order === "asc" ? 1 : -1;

  const settings = await Settings.get();
  const countsPromise = stageCounts(settings);

  const match = {};
  if (stage) match.stage = stage;
  if (source) match.source = source;
  if (jobId) {
    if (!isObjectId(jobId)) return res.json(paginated([], 0, pager, { counts: await countsPromise }));
    match.job = toObjectId(jobId);
  }
  if (search) {
    const rx = containsRegex(search);
    const jobIds = await Job.find({ title: rx }).distinct("_id");
    match.$or = [{ name: rx }, { email: rx }, { skills: rx }, { job: { $in: jobIds } }];
  }

  const sort = { [SORT_FIELDS[sortKey]]: dir, _id: 1 };
  const pipeline =
    sortKey === "job"
      ? [{ $match: match }, ...jobLookup, { $sort: sort }, { $skip: pager.skip }, { $limit: pager.limit }, ...shapeJob]
      : [{ $match: match }, { $sort: sort }, { $skip: pager.skip }, { $limit: pager.limit }, ...jobLookup, ...shapeJob];

  const [rows, total, counts] = await Promise.all([
    Candidate.aggregate(pipeline).collation({ locale: "en", strength: 2 }),
    Candidate.countDocuments(match),
    countsPromise,
  ]);

  res.json(paginated(rows.map(candidateDto), total, pager, { counts }));
});

/* GET /api/candidates/:id */
export const getCandidate = asyncHandler(async (req, res) => {
  res.json(await loadCandidate(req.params.id));
});

/* POST /api/candidates */
export const createCandidate = asyncHandler(async (req, res) => {
  const b = req.body;
  await assertJobExists(b.jobId);
  await assertEmailFree(b.email);

  const settings = await Settings.get();
  const stage = b.stage || settings.stages[0]?.name || "Applied";
  assertStageExists(settings, stage);
  const source = b.source || "Other";

  const candidate = await Candidate.create({
    name: b.name,
    email: b.email,
    phone: b.phone ?? "",
    location: b.location ?? "",
    linkedin: b.linkedin ?? "",
    job: b.jobId,
    stage,
    source,
    appliedOn: new Date(),
    expectedSalary: b.expectedSalary ?? "",
    noticePeriod: b.noticePeriod ?? "",
    skills: b.skills ?? [],
    resume: { name: `${b.name.replace(/\s+/g, "_")}_Resume.pdf`, size: "—", url: null },
    activity: [activityEntry(`Added to ${stage} via ${source}`)],
  });

  await notify(`New candidate: ${candidate.name}`);
  res.status(201).json(await loadCandidate(candidate._id));
});

/* PUT /api/candidates/:id */
export const updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) throw ApiError.notFound("Candidate not found");
  const b = req.body;

  if (b.email !== undefined && b.email !== candidate.email) {
    await assertEmailFree(b.email, candidate._id);
    candidate.email = b.email;
  }
  if (b.jobId !== undefined) {
    await assertJobExists(b.jobId);
    candidate.job = b.jobId;
  }
  if (b.stage && b.stage !== candidate.stage) {
    assertStageExists(await Settings.get(), b.stage);
    candidate.activity.push(activityEntry(`Moved from ${candidate.stage} to ${b.stage}`));
    candidate.stage = b.stage;
  }
  for (const key of ["name", "phone", "location", "linkedin", "source", "expectedSalary", "noticePeriod"]) {
    if (b[key] !== undefined) candidate[key] = b[key];
  }
  if (b.skills !== undefined) candidate.skills = b.skills;

  await candidate.save();
  res.json(await loadCandidate(candidate._id));
});

/* PATCH /api/candidates/:id/stage */
export const setStage = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) throw ApiError.notFound("Candidate not found");

  const { stage } = req.body;
  assertStageExists(await Settings.get(), stage);

  if (stage !== candidate.stage) {
    candidate.activity.push(activityEntry(`Moved from ${candidate.stage} to ${stage}`));
    candidate.stage = stage;
    await candidate.save();
    await notify(`${candidate.name} moved to ${stage}`);
  }
  res.json(await loadCandidate(candidate._id));
});

/* POST /api/candidates/:id/notes */
export const addNote = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) throw ApiError.notFound("Candidate not found");

  candidate.notes.push(activityEntry(req.body.text));
  candidate.activity.push(activityEntry("Note added"));
  await candidate.save();
  res.json(await loadCandidate(candidate._id));
});

/* DELETE /api/candidates/:id */
export const deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).select("_id");
  if (!candidate) throw ApiError.notFound("Candidate not found");
  await Interview.deleteMany({ candidate: candidate._id });
  await candidate.deleteOne();
  res.json({ message: "Candidate deleted" });
});
