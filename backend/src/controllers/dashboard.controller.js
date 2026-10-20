// backend/src/controllers/dashboard.controller.js
import Candidate from "../models/Candidate.js";
import Interview from "../models/Interview.js";
import Job from "../models/Job.js";
import Settings from "../models/Settings.js";
import asyncHandler from "../utils/asyncHandler.js";
import { candidateDto, interviewDto, jobDto } from "../utils/serializers.js";
import { DAY_MS, pct, startOfMonth } from "../utils/stats.js";

const ACTIVE_INTERVIEW = { status: { $ne: "Cancelled" } };

export const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const last30 = { $gte: thirtyDaysAgo, $lte: now };
  const trendStart = startOfMonth(now, -5);

  const [
    settings,
    totalCandidates,
    openJobs,
    interviews,
    hires,
    newCandidates,
    newOpenJobs,
    newInterviews,
    newHires,
    stageAgg,
    openingsAgg,
    appliedDates,
    upcoming,
    recent,
    activeJobs,
    perJob,
  ] = await Promise.all([
    Settings.get(),
    Candidate.countDocuments(),
    Job.countDocuments({ status: "Active" }),
    Interview.countDocuments(ACTIVE_INTERVIEW),
    Candidate.countDocuments({ stage: "Hired" }),
    Candidate.countDocuments({ appliedOn: last30 }),
    Job.countDocuments({ status: "Active", createdAt: last30 }),
    Interview.countDocuments({ ...ACTIVE_INTERVIEW, start: last30 }),
    Candidate.countDocuments({ stage: "Hired", appliedOn: last30 }),
    Candidate.aggregate([{ $group: { _id: "$stage", n: { $sum: 1 } } }]),
    Job.aggregate([{ $match: { status: "Active" } }, { $group: { _id: null, openings: { $sum: "$openings" } } }]),
    Candidate.find({ appliedOn: { $gte: trendStart } }).select("appliedOn").lean(),
    Interview.find({ ...ACTIVE_INTERVIEW, end: { $gt: now } })
      .sort({ start: 1 })
      .limit(3)
      .populate("candidate", "name email")
      .populate("job", "title")
      .lean(),
    Candidate.find().sort({ appliedOn: -1 }).limit(3).populate("job", "title").lean(),
    Job.find({ status: "Active" }).lean(),
    Candidate.aggregate([{ $group: { _id: "$job", n: { $sum: 1 } } }]),
  ]);

  /* --- pipeline donut --- */
  const stageCounts = new Map(stageAgg.map((s) => [s._id, s.n]));
  const stages = settings.stages.map((s) => ({ name: s.name, color: s.color, count: stageCounts.get(s.name) || 0 }));

  const openOpenings = openingsAgg[0]?.openings || 0;
  const denominator = hires + openOpenings;
  const filledPercent = denominator > 0 ? Math.round((hires / denominator) * 100) : 0;

  /* --- applications per month (last 6 calendar months, oldest first) --- */
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = startOfMonth(now, -5 + i);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en-US", { month: "short" }), applications: 0 };
  });
  for (const { appliedOn } of appliedDates) {
    const d = new Date(appliedOn);
    const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket.applications += 1;
  }

  /* --- top job openings by candidate count --- */
  const countByJob = new Map(perJob.map((j) => [String(j._id), j.n]));
  const jobOpenings = activeJobs
    .map((j) => jobDto(j, countByJob.get(String(j._id)) || 0))
    .sort((a, b) => b.candidateCount - a.candidateCount || new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  res.json({
    stats: {
      totalCandidates,
      openJobs,
      interviews,
      hires,
      trends: {
        totalCandidates: pct(totalCandidates, totalCandidates - newCandidates),
        openJobs: pct(openJobs, openJobs - newOpenJobs),
        interviews: pct(interviews, interviews - newInterviews),
        hires: pct(hires, hires - newHires),
      },
    },
    pipeline: {
      stages,
      filledPercent,
      trend: months.map(({ month, applications }) => ({ month, applications })),
    },
    upcomingInterviews: upcoming.map(interviewDto),
    recentCandidates: recent.map(candidateDto),
    jobOpenings,
  });
});
