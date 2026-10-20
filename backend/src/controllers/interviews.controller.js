// backend/src/controllers/interviews.controller.js
import Candidate from "../models/Candidate.js";
import Interview from "../models/Interview.js";
import Job from "../models/Job.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { logActivity } from "../utils/activity.js";
import { containsRegex } from "../utils/escapeRegex.js";
import notify from "../utils/notify.js";
import { isObjectId, queryString } from "../utils/objectId.js";
import { interviewDto } from "../utils/serializers.js";
import { addDays, pct, startOfDay, startOfMonth } from "../utils/stats.js";

const populateInterview = (query) => query.populate("candidate", "name email").populate("job", "title");

const loadInterview = async (id) => {
  const doc = await populateInterview(Interview.findById(id)).lean();
  if (!doc) throw ApiError.notFound("Interview not found");
  return interviewDto(doc);
};

const parseDate = (value, label) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw ApiError.badRequest(`${label} is not a valid date`);
  return d;
};

/* GET /api/interviews */
export const listInterviews = asyncHandler(async (req, res) => {
  const from = queryString(req.query.from);
  const to = queryString(req.query.to);
  const candidateId = queryString(req.query.candidateId);
  const jobId = queryString(req.query.jobId);
  const type = queryString(req.query.type);
  const search = queryString(req.query.search);

  const filter = {};
  if (from || to) {
    filter.start = {};
    if (from) filter.start.$gte = parseDate(from, "From date");
    if (to) filter.start.$lte = parseDate(to, "To date");
  }
  if (candidateId) {
    if (!isObjectId(candidateId)) return res.json({ data: [], total: 0 });
    filter.candidate = candidateId;
  }
  if (jobId) {
    if (!isObjectId(jobId)) return res.json({ data: [], total: 0 });
    filter.job = jobId;
  }
  if (type) filter.type = type;
  if (search) {
    const rx = containsRegex(search);
    const [candidateIds, jobIds] = await Promise.all([
      Candidate.find({ name: rx }).distinct("_id"),
      Job.find({ title: rx }).distinct("_id"),
    ]);
    filter.$or = [{ candidate: { $in: candidateIds } }, { job: { $in: jobIds } }];
  }

  const docs = await populateInterview(Interview.find(filter).sort({ start: 1, _id: 1 })).lean();
  res.json({ data: docs.map(interviewDto), total: docs.length });
});

/* GET /api/interviews/stats  (non-cancelled interviews only) */
export const interviewStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const base = { status: { $ne: "Cancelled" } };

  const monthStart = startOfMonth(now);
  const nextMonthStart = startOfMonth(now, 1);
  const prevMonthStart = startOfMonth(now, -1);
  const thisMonth = { $gte: monthStart, $lt: nextMonthStart };
  const lastMonth = { $gte: prevMonthStart, $lt: monthStart };

  const todayStart = startOfDay(now);
  const today = { $gte: todayStart, $lt: addDays(todayStart, 1) };
  const sameDayLastWeek = { $gte: addDays(todayStart, -7), $lt: addDays(todayStart, -6) };

  const [totalScheduled, prevScheduled, todayCount, prevToday, completed, prevCompleted, pending] = await Promise.all([
    Interview.countDocuments({ ...base, start: thisMonth }),
    Interview.countDocuments({ ...base, start: lastMonth }),
    Interview.countDocuments({ ...base, start: today }),
    Interview.countDocuments({ ...base, start: sameDayLastWeek }),
    Interview.countDocuments({ status: "Completed", start: thisMonth }),
    Interview.countDocuments({ status: "Completed", start: lastMonth }),
    Interview.countDocuments({ status: "Scheduled", end: { $gt: now } }),
  ]);

  res.json({
    totalScheduled,
    today: todayCount,
    completed,
    pending,
    trends: {
      totalScheduled: pct(totalScheduled, prevScheduled),
      today: pct(todayCount, prevToday),
      completed: pct(completed, prevCompleted),
      pending: null,
    },
  });
});

/* POST /api/interviews */
export const createInterview = asyncHandler(async (req, res) => {
  const b = req.body;
  const candidate = isObjectId(b.candidateId) ? await Candidate.findById(b.candidateId).select("name job") : null;
  if (!candidate) throw ApiError.badRequest("Select a candidate");

  const start = new Date(b.start);
  const end = new Date(b.end);
  if (!(end > start)) throw ApiError.badRequest("End time must be after start time");

  const interview = await Interview.create({
    candidate: candidate._id,
    job: candidate.job,
    start,
    end,
    type: b.type,
    location: b.location ?? "",
    interviewers: b.interviewers ?? [],
  });

  await logActivity(candidate._id, `Interview scheduled (${interview.type})`);
  await notify(`Interview scheduled with ${candidate.name}`);
  res.status(201).json(await loadInterview(interview._id));
});

/* PUT /api/interviews/:id  (candidate can't change) */
export const updateInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) throw ApiError.notFound("Interview not found");
  const b = req.body;

  const start = b.start ? new Date(b.start) : interview.start;
  const end = b.end ? new Date(b.end) : interview.end;
  if (!(end > start)) throw ApiError.badRequest("End time must be after start time");
  interview.start = start;
  interview.end = end;

  for (const key of ["type", "status", "location", "interviewers", "notes"]) {
    if (b[key] !== undefined) interview[key] = b[key];
  }
  if (b.feedback !== undefined) interview.feedback = b.feedback; // object, or null to clear

  await interview.save();
  res.json(await loadInterview(interview._id));
});

/* PATCH /api/interviews/:id/status */
export const setInterviewStatus = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) throw ApiError.notFound("Interview not found");
  interview.status = req.body.status;
  await interview.save();
  res.json(await loadInterview(interview._id));
});

/* DELETE /api/interviews/:id */
export const deleteInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id).select("_id");
  if (!interview) throw ApiError.notFound("Interview not found");
  await interview.deleteOne();
  res.json({ message: "Interview deleted" });
});
