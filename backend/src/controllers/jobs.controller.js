// backend/src/controllers/jobs.controller.js
import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { containsRegex } from "../utils/escapeRegex.js";
import notify from "../utils/notify.js";
import { queryString } from "../utils/objectId.js";
import { paginated, parsePagination } from "../utils/pagination.js";
import { jobDto } from "../utils/serializers.js";

const candidateCountMap = async (jobIds) => {
  const rows = await Candidate.aggregate([{ $match: { job: { $in: jobIds } } }, { $group: { _id: "$job", n: { $sum: 1 } } }]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
};

const loadJob = async (id) => {
  const job = await Job.findById(id).lean();
  if (!job) throw ApiError.notFound("Job not found");
  const count = await Candidate.countDocuments({ job: job._id });
  return jobDto(job, count);
};

/** Next code = highest existing number + 1 (JD-001, JD-002, …). */
const nextCode = async () => {
  const rows = await Job.find({}, "code").lean();
  const max = rows.reduce((m, { code }) => {
    const n = parseInt(String(code).replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `JD-${String(max + 1).padStart(3, "0")}`;
};

/* GET /api/jobs */
export const listJobs = asyncHandler(async (req, res) => {
  const pager = parsePagination(req.query);
  const search = queryString(req.query.search);
  const department = queryString(req.query.department);
  const status = queryString(req.query.status);

  const filter = {};
  if (department) filter.department = department;
  if (status) filter.status = status;
  if (search) {
    const rx = containsRegex(search);
    filter.$or = [{ title: rx }, { department: rx }, { code: rx }];
  }

  const [jobs, total, statusRows] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1, _id: -1 }).skip(pager.skip).limit(pager.limit).lean(),
    Job.countDocuments(filter),
    Job.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);

  const counts = { total: 0, Active: 0, "On Hold": 0, Closed: 0 };
  for (const { _id, n } of statusRows) {
    counts.total += n;
    if (_id in counts && _id !== "total") counts[_id] = n;
  }

  const perJob = await candidateCountMap(jobs.map((j) => j._id));
  res.json(paginated(jobs.map((j) => jobDto(j, perJob.get(String(j._id)) || 0)), total, pager, { counts }));
});

/* GET /api/jobs/:id */
export const getJob = asyncHandler(async (req, res) => {
  res.json(await loadJob(req.params.id));
});

/* POST /api/jobs */
export const createJob = asyncHandler(async (req, res) => {
  let job;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      job = await Job.create({ ...req.body, code: await nextCode() });
      break;
    } catch (err) {
      // Two jobs created at the same moment can pick the same code — just retry with the next one.
      const codeClash = err.code === 11000 && err.keyPattern?.code;
      if (!codeClash || attempt === 4) throw err;
    }
  }
  await notify(`Job created: ${job.title}`);
  res.status(201).json(await loadJob(job._id));
});

/* PUT /api/jobs/:id */
export const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound("Job not found");
  job.set(req.body);
  await job.save();
  res.json(await loadJob(job._id));
});

/* DELETE /api/jobs/:id */
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).select("_id");
  if (!job) throw ApiError.notFound("Job not found");

  const count = await Candidate.countDocuments({ job: job._id });
  if (count > 0) {
    throw ApiError.conflict(
      `This job has ${count} candidate${count === 1 ? "" : "s"}. Move or delete them first, or set the job to Closed.`
    );
  }
  await job.deleteOne();
  res.json({ message: "Job deleted" });
});
