// backend/src/seed/seed.js
// Demo data for the EarlyJobs dashboard.
//   npm run seed         → adds anything that is missing (safe to run twice)
//   npm run seed:reset   → wipes every collection first, then reseeds
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Candidate from "../models/Candidate.js";
import Interview from "../models/Interview.js";
import Job from "../models/Job.js";
import Notification from "../models/Notification.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";

const RESET = process.argv.includes("--reset");
const DAY = 24 * 60 * 60 * 1000;
const DEMO_PASSWORD = "password123";

/* ---------- small deterministic random helpers (same data every run) ---------- */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261020);
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
const pick = (list) => list[Math.floor(rand() * list.length)];
const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const daysAgo = (n) => new Date(Date.now() - n * DAY);
const atDay = (offset, hour, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minute, 0, 0);
  return d;
};

/* ---------- static data ---------- */
const USERS = [
  { name: "Abhishek Yadav", email: "abhishek.ybit@gmail.com", role: "Recruiter", phone: "+91 98765 43210" },
  { name: "Sneha Verma", email: "sneha.verma@earlyjobs.com", role: "Hiring Manager", phone: "+91 98765 11122" },
  { name: "Rahul Mehra", email: "rahul.mehra@earlyjobs.com", role: "Admin", phone: "+91 98765 33344" },
];

const JOBS = [
  {
    title: "Frontend Developer", department: "Engineering", location: "Bangalore", type: "Full-time", status: "Active",
    experienceMin: 2, experienceMax: 5, salaryMin: 12, salaryMax: 20, openings: 2, age: 45,
    skills: ["React", "JavaScript", "TypeScript", "HTML", "CSS", "REST APIs"],
    description: "Build and ship fast, accessible interfaces for our hiring platform. You will own features end to end with design and backend teams.",
  },
  {
    title: "Backend Developer", department: "Engineering", location: "Remote", type: "Full-time", status: "Active",
    experienceMin: 3, experienceMax: 6, salaryMin: 15, salaryMax: 28, openings: 2, age: 38,
    skills: ["Node.js", "Express", "MongoDB", "REST APIs", "Docker", "AWS"],
    description: "Design reliable APIs and data models that power candidate search, pipelines and analytics.",
  },
  {
    title: "UI/UX Designer", department: "Design", location: "Bangalore", type: "Full-time", status: "Active",
    experienceMin: 2, experienceMax: 5, salaryMin: 10, salaryMax: 18, openings: 1, age: 33,
    skills: ["Figma", "Prototyping", "User Research", "Design Systems", "Accessibility"],
    description: "Shape the look and feel of the product, from research and flows to polished, production-ready designs.",
  },
  {
    title: "Product Manager", department: "Product", location: "Remote", type: "Full-time", status: "Active",
    experienceMin: 4, experienceMax: 8, salaryMin: 22, salaryMax: 38, openings: 1, age: 29,
    skills: ["Roadmapping", "Agile", "Analytics", "Stakeholder Management", "User Stories"],
    description: "Own the product roadmap for hiring workflows. Work closely with engineering, design and customers.",
  },
  {
    title: "DevOps Engineer", department: "Engineering", location: "Hyderabad", type: "Full-time", status: "On Hold",
    experienceMin: 3, experienceMax: 7, salaryMin: 16, salaryMax: 30, openings: 1, age: 41,
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "Linux"],
    description: "Automate our infrastructure, deployments and monitoring. Hiring is paused until the platform roadmap is confirmed.",
  },
  {
    title: "Data Analyst", department: "Data", location: "Bangalore", type: "Full-time", status: "Active",
    experienceMin: 1, experienceMax: 4, salaryMin: 8, salaryMax: 15, openings: 2, age: 24,
    skills: ["SQL", "Python", "Tableau", "Excel", "Statistics"],
    description: "Turn hiring data into insight: funnel metrics, source quality and time-to-hire reporting.",
  },
  {
    title: "QA Engineer", department: "Engineering", location: "Remote", type: "Full-time", status: "Closed",
    experienceMin: 2, experienceMax: 5, salaryMin: 9, salaryMax: 16, openings: 1, age: 36,
    skills: ["Selenium", "Cypress", "Test Automation", "API Testing", "JIRA"],
    description: "Own quality across releases with automated and exploratory testing. This position has been filled.",
  },
  {
    title: "Content Writer", department: "Marketing", location: "Delhi", type: "Full-time", status: "Active",
    experienceMin: 1, experienceMax: 3, salaryMin: 5, salaryMax: 9, openings: 1, age: 19,
    skills: ["SEO", "Copywriting", "Content Strategy", "Editing", "Social Media"],
    description: "Write blogs, case studies and product copy that explains recruiting to a wide audience.",
  },
];
const JOB_WEIGHTS = [10, 8, 6, 6, 5, 5, 4, 4]; // 48 candidates in total

const NAMES = [
  "Rohan Sharma", "Priya Nair", "Aarav Gupta", "Ananya Iyer", "Vikram Singh", "Neha Kapoor", "Karan Malhotra", "Sneha Reddy",
  "Arjun Menon", "Isha Verma", "Rahul Joshi", "Pooja Desai", "Aditya Rao", "Kavya Krishnan", "Siddharth Jain", "Meera Pillai",
  "Harsh Agarwal", "Divya Bhat", "Nikhil Chawla", "Shruti Kulkarni", "Manish Tiwari", "Ritu Saxena", "Varun Bansal", "Aishwarya Shetty",
  "Gaurav Mishra", "Tanvi Patil", "Abhinav Dubey", "Simran Kaur", "Deepak Yadav", "Nisha Thakur", "Rajesh Kumar", "Lakshmi Narayan",
  "Yash Mehta", "Sakshi Pandey", "Ishaan Khanna", "Anjali Sinha", "Mohit Arora", "Bhavna Rathod", "Kunal Bhatia", "Swati Ghosh",
  "Pranav Hegde", "Ritika Sethi", "Tarun Goyal", "Mansi Trivedi", "Sanjay Naidu", "Ekta Chopra", "Ayush Srivastava", "Zoya Khan",
];
const CITIES = ["Bangalore", "Hyderabad", "Pune", "Mumbai", "Delhi", "Chennai", "Gurgaon", "Noida", "Kolkata", "Ahmedabad"];
const DOMAINS = ["gmail.com", "outlook.com", "yahoo.in", "proton.me"];
const SOURCES = ["LinkedIn", "LinkedIn", "LinkedIn", "Naukri", "Naukri", "Company Website", "Company Website", "Referral", "Referral", "Indeed", "Other"];
const NOTICE = ["Immediate", "15 days", "30 days", "30 days", "60 days", "90 days"];
const NOTES = [
  "Strong portfolio and clear communicator.",
  "Available for a call early next week.",
  "Needs a deeper technical round before moving ahead.",
  "Salary expectation is slightly above budget.",
  "Referred by an existing team member.",
  "Great culture fit in the first conversation.",
];
const FLOW = ["Applied", "Screening", "Interview", "Offer", "Hired"];
// final stage of the 48 candidates (all six stages are used)
const STAGE_COUNTS = { Applied: 12, Screening: 10, Interview: 9, Offer: 5, Hired: 4, Rejected: 8 };

/* ---------- builders ---------- */
async function seedSettings() {
  const existing = await Settings.findOne();
  if (existing) return existing;
  return Settings.create({}); // schema defaults = the default stages / sources / integrations
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = [];
  for (const u of USERS) {
    const found = await User.findOne({ email: u.email });
    users.push(found || (await User.create({ ...u, passwordHash })));
  }
  return users;
}

async function seedJobs() {
  if ((await Job.countDocuments()) > 0) return Job.find().sort({ code: 1 });
  const jobs = [];
  for (let i = 0; i < JOBS.length; i += 1) {
    const { age, ...fields } = JOBS[i];
    jobs.push(
      await Job.create({
        ...fields,
        code: `JD-${String(i + 1).padStart(3, "0")}`,
        interviewers: ["Abhishek Yadav", "Sneha Verma"],
        createdAt: daysAgo(age),
      })
    );
  }
  return jobs;
}

/** Ages (in days) spread over the last 6 calendar months so every month of the dashboard chart has data. */
function applicationAges(count) {
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const maxAge = Math.max(30, Math.floor((now - windowStart) / DAY) - 1);
  return Array.from({ length: count }, (_, i) => Math.min(maxAge, Math.round((i / (count - 1)) * maxAge) + int(0, 2))).sort((a, b) => a - b);
}

async function seedCandidates(jobs) {
  if ((await Candidate.countDocuments()) > 0) return Candidate.find();

  const total = NAMES.length;
  // jobs → 48 slots (weighted); falls back gracefully if the jobs differ from the defaults
  let slots = jobs.flatMap((job, i) => Array(JOB_WEIGHTS[i] ?? 4).fill(job));
  while (slots.length < total) slots.push(pick(jobs));
  slots = shuffle(slots).slice(0, total);

  // newest → oldest ages. Rejected candidates are scattered; everyone else progresses further the older they are.
  const ages = applicationAges(total);
  const rejectedAt = new Set(shuffle([...Array(total).keys()]).slice(0, STAGE_COUNTS.Rejected));
  const progression = FLOW.flatMap((stage) => Array(STAGE_COUNTS[stage]).fill(stage));
  let next = 0;
  const stageFor = (i) => (rejectedAt.has(i) ? "Rejected" : progression[next++]);

  const candidates = [];
  for (let i = 0; i < total; i += 1) {
    const name = NAMES[i];
    const [first, last] = name.toLowerCase().split(" ");
    const job = slots[i];
    const stage = stageFor(i);
    const source = pick(SOURCES);
    const appliedOn = new Date(Date.now() - ages[i] * DAY - int(0, 20) * 60 * 60 * 1000);
    const elapsed = Date.now() - appliedOn.getTime();

    // stage history for the activity timeline
    const path = stage === "Rejected" ? FLOW.slice(0, int(1, 3)).concat("Rejected") : FLOW.slice(0, FLOW.indexOf(stage) + 1);
    const activity = [{ text: `Added to Applied via ${source}`, createdAt: appliedOn }];
    for (let s = 1; s < path.length; s += 1) {
      activity.push({
        text: `Moved from ${path[s - 1]} to ${path[s]}`,
        createdAt: new Date(appliedOn.getTime() + (elapsed * s) / path.length),
      });
    }
    const notes = [];
    if (rand() < 0.35) {
      const createdAt = new Date(appliedOn.getTime() + elapsed * 0.4);
      notes.push({ text: pick(NOTES), createdAt });
      activity.push({ text: "Note added", createdAt });
    }

    const baseSalary = (job.salaryMin ?? 8) + int(0, Math.max(1, (job.salaryMax ?? 15) - (job.salaryMin ?? 8) - 2));
    candidates.push(
      await Candidate.create({
        name,
        email: `${first}.${last}@${pick(DOMAINS)}`,
        phone: `+91 ${pick([6, 7, 8, 9])}${int(1000, 9999)} ${int(10000, 99999)}`,
        location: `${pick(CITIES)}, India`,
        linkedin: `linkedin.com/in/${first}-${last}`,
        job: job._id,
        stage,
        source,
        appliedOn,
        expectedSalary: `₹${baseSalary} - ${baseSalary + int(3, 6)} LPA`,
        noticePeriod: pick(NOTICE),
        skills: shuffle(job.skills?.length ? job.skills : ["Communication"]).slice(0, int(3, 5)),
        resume: { name: `${name.replace(/\s+/g, "_")}_Resume.pdf`, size: `${(0.8 + rand() * 2.4).toFixed(1)} MB`, url: null },
        notes,
        activity: activity.sort((a, b) => a.createdAt - b.createdAt),
      })
    );
  }
  return candidates;
}

async function seedInterviews(candidates, users) {
  if ((await Interview.countDocuments()) > 0) return;

  const byStage = (stage) => candidates.filter((c) => c.stage === stage);
  const pools = { Interview: byStage("Interview"), Screening: byStage("Screening"), Offer: byStage("Offer"), Hired: byStage("Hired") };
  const take = (stage) => pools[stage].shift() ?? candidates.find((c) => !used.has(String(c._id)));
  const used = new Set();

  const recruiter = users.find((u) => u.role === "Recruiter") ?? users[0];
  const manager = users.find((u) => u.role === "Hiring Manager") ?? users[1] ?? users[0];
  const panel = [
    { name: recruiter.name, role: recruiter.role },
    { name: manager.name, role: manager.role },
  ];
  const MEET = "https://meet.google.com/abc-defg-hij";

  const plan = [
    // 4 today
    { when: atDay(0, 10, 0), type: "Video Call", from: "Interview" },
    { when: atDay(0, 11, 30), type: "Video Call", from: "Interview" },
    { when: atDay(0, 14, 0), type: "On-Site", from: "Interview" },
    { when: atDay(0, 16, 0), type: "Video Call", from: "Interview" },
    // coming days
    { when: atDay(1, 11, 0), type: "Video Call", from: "Screening" },
    { when: atDay(1, 15, 30), type: "On-Site", from: "Screening" },
    { when: atDay(2, 10, 30), type: "Video Call", from: "Interview" },
    { when: atDay(3, 14, 0), type: "Phone", from: "Screening" },
    { when: atDay(5, 11, 30), type: "Video Call", from: "Interview" },
    // completed (with feedback)
    { when: atDay(-1, 15, 0), type: "Video Call", from: "Offer", status: "Completed", feedback: { rating: 5, text: "Excellent problem solving and communication. Recommend moving to offer." } },
    { when: atDay(-2, 11, 0), type: "On-Site", from: "Offer", status: "Completed", feedback: { rating: 4, text: "Solid fundamentals, good culture fit." } },
    { when: atDay(-3, 16, 0), type: "Video Call", from: "Hired", status: "Completed", feedback: { rating: 5, text: "Outstanding. Strong yes from the panel." } },
    { when: atDay(-5, 10, 0), type: "Phone", from: "Offer", status: "Completed", feedback: { rating: 3, text: "Good potential but needs more depth in system design." } },
    { when: atDay(-8, 14, 30), type: "Video Call", from: "Hired", status: "Completed", feedback: { rating: 4, text: "Confident and well prepared." } },
    // cancelled
    { when: atDay(-4, 12, 0), type: "Video Call", from: "Screening", status: "Cancelled", notes: "Candidate asked to reschedule." },
  ];

  for (const item of plan) {
    const candidate = take(item.from);
    used.add(String(candidate._id));
    const location = item.type === "Video Call" ? MEET : item.type === "On-Site" ? "EarlyJobs HQ, Bangalore" : candidate.phone;
    await Interview.create({
      candidate: candidate._id,
      job: candidate.job,
      start: item.when,
      end: new Date(item.when.getTime() + 45 * 60 * 1000),
      type: item.type,
      status: item.status ?? "Scheduled",
      location,
      interviewers: panel,
      feedback: item.feedback ?? null,
      notes: item.notes ?? "",
    });
    candidate.activity.push({
      text: `Interview scheduled (${item.type})`,
      createdAt: new Date(Math.min(Date.now(), item.when.getTime() - 2 * DAY)),
    });
    await candidate.save();
  }
}

async function seedNotifications(candidates) {
  if ((await Notification.countDocuments()) > 0) return;
  const newest = [...candidates].sort((a, b) => b.appliedOn - a.appliedOn);
  const hours = (n) => new Date(Date.now() - n * 60 * 60 * 1000);
  const items = [
    { text: `New candidate: ${newest[0].name}`, read: false, createdAt: hours(2) },
    { text: `Interview scheduled with ${candidates.find((c) => c.stage === "Interview")?.name ?? newest[1].name}`, read: false, createdAt: hours(5) },
    { text: `${newest[2].name} moved to Screening`, read: false, createdAt: hours(20) },
    { text: `New candidate: ${newest[1].name}`, read: true, createdAt: hours(30) },
    { text: "Job created: Content Writer", read: true, createdAt: hours(24 * 19) },
  ];
  for (const n of items) await Notification.create(n);
}

/* ---------- run ---------- */
async function run() {
  await connectDB();

  if (RESET) {
    await Promise.all([User, Settings, Job, Candidate, Interview, Notification].map((m) => m.deleteMany({})));
    console.log("Wiped all collections.");
  }

  await seedSettings();
  const users = await seedUsers();
  const jobs = await seedJobs();
  const candidates = await seedCandidates(jobs);
  await seedInterviews(candidates, users);
  await seedNotifications(candidates);

  const [u, j, c, i, n] = await Promise.all([
    User.countDocuments(), Job.countDocuments(), Candidate.countDocuments(), Interview.countDocuments(), Notification.countDocuments(),
  ]);
  console.log(`\nSeed complete → ${u} users, ${j} jobs, ${c} candidates, ${i} interviews, ${n} notifications`);
  console.log("\n──────────── Demo login ────────────");
  console.log(`  Email:    ${USERS[0].email}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log("────────────────────────────────────\n");
}

run()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
