// src/api/mock/adapter.js
// Axios adapter that behaves like the real REST API. Mirrors the contract the Express backend should implement.
import { AxiosError } from "axios";
import { getDb, save, uid } from "./db";

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new HttpError(status, message); };

const DAY = 86400000;
const db = getDb;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const has = (s, q) => String(s ?? "").toLowerCase().includes(String(q).toLowerCase());
const pct = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0);
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");

const jobRef = (id) => { const j = db().jobs.find((x) => x._id === id); return j ? { _id: j._id, title: j.title } : null; };
const candRef = (id) => { const c = db().candidates.find((x) => x._id === id); return c ? { _id: c._id, name: c.name, email: c.email } : null; };
const withJob = (c) => ({ ...c, job: jobRef(c.jobId) });
const withCount = (j) => ({ ...j, candidateCount: db().candidates.filter((c) => c.jobId === j._id).length });
const withRefs = (i) => ({ ...i, candidate: candRef(i.candidateId), job: jobRef(i.jobId) });
const log = (c, text) => c.activity.unshift({ _id: uid(), text, createdAt: new Date().toISOString() });
const notify = (text) => db().notifications.unshift({ _id: uid(), text, createdAt: new Date().toISOString(), read: false });
const find = (list, id, label) => list.find((x) => x._id === id) || fail(404, `${label} not found`);

function paginate(rows, page, limit) {
  page = Math.max(1, +page || 1); limit = Math.max(1, +limit || 10);
  const total = rows.length;
  return { data: rows.slice((page - 1) * limit, page * limit), total, page, pages: Math.max(1, Math.ceil(total / limit)), limit };
}
function sortRows(rows, key, order, pick = (r, k) => r[k]) {
  const dir = order === "asc" ? 1 : -1;
  return rows.sort((a, b) => String(pick(a, key) ?? "").localeCompare(String(pick(b, key) ?? ""), undefined, { numeric: true }) * dir);
}

const routes = [];
const on = (method, path, handler) => routes.push([method, new RegExp(`^${path}$`), handler]);

/* ---------------- Auth ---------------- */
on("post", "auth/login", ({ body }) => {
  if (!isEmail(body.email) || body.password !== db().password) fail(401, "Invalid email or password");
  return { token: "mock-jwt-token", user: db().settings.profile };
});
on("get", "auth/me", () => ({ user: db().settings.profile }));
on("post", "auth/change-password", ({ body }) => {
  if (body.currentPassword !== db().password) fail(400, "Current password is incorrect");
  if (!body.newPassword || body.newPassword.length < 8) fail(400, "New password must be at least 8 characters");
  db().password = body.newPassword; save();
  return { message: "Password updated" };
});

/* ---------------- Dashboard ---------------- */
on("get", "dashboard", () => {
  const d = db(); const now = new Date();
  const cands = d.candidates.map(withJob);
  const hired = cands.filter((c) => c.stage === "Hired").length;
  const activeJobs = d.jobs.filter((j) => j.status === "Active");
  const openings = activeJobs.reduce((s, j) => s + j.openings, 0);
  const live = d.interviews.filter((i) => i.status !== "Cancelled");
  const recent = (t) => now - new Date(t) <= 30 * DAY;
  const growth = (items, get) => pct(items.length, items.length - items.filter((i) => recent(get(i))).length);
  const months = Array.from({ length: 6 }, (_, k) => { const m = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1); return { m, label: m.toLocaleString("en-US", { month: "short" }) }; });
  return {
    stats: {
      totalCandidates: cands.length, openJobs: activeJobs.length, interviews: live.length, hires: hired,
      trends: {
        totalCandidates: growth(cands, (c) => c.appliedOn), openJobs: growth(activeJobs, (j) => j.createdAt),
        interviews: growth(live, (i) => i.start), hires: growth(cands.filter((c) => c.stage === "Hired"), (c) => c.appliedOn),
      },
    },
    pipeline: {
      stages: d.settings.stages.map((s) => ({ name: s.name, color: s.color, count: cands.filter((c) => c.stage === s.name).length })),
      filledPercent: Math.round((hired / Math.max(1, hired + openings)) * 100),
      trend: months.map(({ m, label }) => ({
        month: label,
        applications: cands.filter((c) => { const a = new Date(c.appliedOn); return a.getFullYear() === m.getFullYear() && a.getMonth() === m.getMonth(); }).length,
      })),
    },
    upcomingInterviews: live.filter((i) => new Date(i.end) > now).sort((a, b) => new Date(a.start) - new Date(b.start)).slice(0, 3).map(withRefs),
    recentCandidates: [...cands].sort((a, b) => b.appliedOn.localeCompare(a.appliedOn)).slice(0, 3),
    jobOpenings: activeJobs.map(withCount).sort((a, b) => b.candidateCount - a.candidateCount).slice(0, 3),
  };
});

/* ---------------- Candidates ---------------- */
on("get", "candidates", ({ params: q }) => {
  const all = db().candidates.map(withJob);
  const rows = all.filter((c) =>
    (!q.search || [c.name, c.email, c.job?.title, ...c.skills].some((v) => has(v, q.search))) &&
    (!q.stage || c.stage === q.stage) && (!q.jobId || c.jobId === q.jobId) && (!q.source || c.source === q.source));
  sortRows(rows, q.sort || "appliedOn", q.order || "desc", (r, k) => (k === "job" ? r.job?.title : r[k]));
  const counts = { total: all.length };
  db().settings.stages.forEach((s) => { counts[s.name] = all.filter((c) => c.stage === s.name).length; });
  return { ...paginate(rows, q.page, q.limit), counts };
});
on("get", "candidates/([^/]+)", ({ args }) => withJob(find(db().candidates, args[0], "Candidate")));
on("post", "candidates", ({ body }) => {
  if (!body.name?.trim()) fail(400, "Name is required");
  if (!isEmail(body.email)) fail(400, "A valid email is required");
  if (!jobRef(body.jobId)) fail(400, "Select a job position");
  if (db().candidates.some((c) => c.email.toLowerCase() === body.email.toLowerCase())) fail(409, "A candidate with this email already exists");
  const c = {
    _id: uid(), name: body.name.trim(), email: body.email.trim(), phone: body.phone || "", location: body.location || "", linkedin: body.linkedin || "",
    jobId: body.jobId, stage: body.stage || db().settings.stages[0].name, source: body.source || "Other", appliedOn: new Date().toISOString(),
    expectedSalary: body.expectedSalary || "", noticePeriod: body.noticePeriod || "", skills: body.skills || [],
    resume: { name: `${body.name.trim().replace(/ /g, "_")}_Resume.pdf`, size: "—", url: null }, notes: [], activity: [],
  };
  log(c, `Added to ${c.stage} via ${c.source}`);
  db().candidates.unshift(c);
  notify(`New candidate: ${c.name}`); save();
  return withJob(c);
});
on("put", "candidates/([^/]+)", ({ args, body }) => {
  const c = find(db().candidates, args[0], "Candidate");
  if (body.email && !isEmail(body.email)) fail(400, "A valid email is required");
  if (body.email && db().candidates.some((x) => x._id !== c._id && x.email.toLowerCase() === body.email.toLowerCase())) fail(409, "A candidate with this email already exists");
  const prevStage = c.stage;
  ["name", "email", "phone", "location", "linkedin", "jobId", "stage", "source", "expectedSalary", "noticePeriod", "skills"].forEach((k) => { if (body[k] !== undefined) c[k] = body[k]; });
  if (c.stage !== prevStage) log(c, `Moved from ${prevStage} to ${c.stage}`);
  save();
  return withJob(c);
});
on("patch", "candidates/([^/]+)/stage", ({ args, body }) => {
  const c = find(db().candidates, args[0], "Candidate");
  if (!db().settings.stages.some((s) => s.name === body.stage)) fail(400, "Unknown stage");
  if (c.stage !== body.stage) { log(c, `Moved from ${c.stage} to ${body.stage}`); notify(`${c.name} moved to ${body.stage}`); c.stage = body.stage; save(); }
  return withJob(c);
});
on("post", "candidates/([^/]+)/notes", ({ args, body }) => {
  const c = find(db().candidates, args[0], "Candidate");
  if (!body.text?.trim()) fail(400, "Note cannot be empty");
  c.notes.unshift({ _id: uid(), text: body.text.trim(), createdAt: new Date().toISOString() }); log(c, "Note added"); save();
  return withJob(c);
});
on("delete", "candidates/([^/]+)", ({ args }) => {
  const c = find(db().candidates, args[0], "Candidate");
  db().candidates = db().candidates.filter((x) => x !== c);
  db().interviews = db().interviews.filter((i) => i.candidateId !== c._id); save();
  return { message: "Candidate deleted" };
});

/* ---------------- Jobs ---------------- */
on("get", "jobs", ({ params: q }) => {
  const all = db().jobs.map(withCount);
  const rows = all.filter((j) =>
    (!q.search || has(j.title, q.search) || has(j.department, q.search) || has(j.code, q.search)) &&
    (!q.department || j.department === q.department) && (!q.status || j.status === q.status));
  sortRows(rows, "createdAt", "desc");
  const counts = { total: all.length, Active: 0, "On Hold": 0, Closed: 0 };
  all.forEach((j) => { counts[j.status] += 1; });
  return { ...paginate(rows, q.page, q.limit), counts };
});
on("get", "jobs/([^/]+)", ({ args }) => withCount(find(db().jobs, args[0], "Job")));
const JOB_FIELDS = ["title", "department", "location", "type", "status", "experienceMin", "experienceMax", "salaryMin", "salaryMax", "openings", "description", "skills", "interviewers", "notes"];
on("post", "jobs", ({ body }) => {
  if (!body.title?.trim() || !body.department || !body.location?.trim()) fail(400, "Title, department and location are required");
  const next = Math.max(0, ...db().jobs.map((j) => parseInt(j.code.slice(3), 10))) + 1;
  const j = { _id: uid(), code: `JD-${String(next).padStart(3, "0")}`, status: "Active", type: "Full-time", openings: 1, skills: [], interviewers: [], notes: "", description: "", createdAt: new Date().toISOString() };
  JOB_FIELDS.forEach((k) => { if (body[k] !== undefined) j[k] = body[k]; });
  db().jobs.unshift(j); notify(`Job created: ${j.title}`); save();
  return withCount(j);
});
on("put", "jobs/([^/]+)", ({ args, body }) => {
  const j = find(db().jobs, args[0], "Job");
  JOB_FIELDS.forEach((k) => { if (body[k] !== undefined) j[k] = body[k]; }); save();
  return withCount(j);
});
on("delete", "jobs/([^/]+)", ({ args }) => {
  const j = find(db().jobs, args[0], "Job");
  const n = db().candidates.filter((c) => c.jobId === j._id).length;
  if (n) fail(409, `This job has ${n} candidate${n > 1 ? "s" : ""}. Move or delete them first, or set the job to Closed.`);
  db().jobs = db().jobs.filter((x) => x !== j); save();
  return { message: "Job deleted" };
});

/* ---------------- Interviews ---------------- */
on("get", "interviews/stats", () => {
  const now = new Date(); const live = db().interviews.filter((i) => i.status !== "Cancelled");
  const inMonth = (i, off) => { const d = new Date(i.start); const t = new Date(now.getFullYear(), now.getMonth() + off, 1); return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth(); };
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const today = live.filter((i) => sameDay(i.start, now)).length;
  return {
    totalScheduled: live.filter((i) => inMonth(i, 0)).length, today,
    completed: live.filter((i) => i.status === "Completed" && inMonth(i, 0)).length,
    pending: live.filter((i) => i.status === "Scheduled" && new Date(i.end) > now).length,
    trends: {
      totalScheduled: pct(live.filter((i) => inMonth(i, 0)).length, live.filter((i) => inMonth(i, -1)).length),
      today: pct(today, live.filter((i) => sameDay(i.start, weekAgo)).length),
      completed: pct(live.filter((i) => i.status === "Completed" && inMonth(i, 0)).length, live.filter((i) => i.status === "Completed" && inMonth(i, -1)).length),
      pending: null,
    },
  };
});
on("get", "interviews", ({ params: q }) => {
  const rows = db().interviews.map(withRefs).filter((i) =>
    (!q.from || new Date(i.start) >= new Date(q.from)) && (!q.to || new Date(i.start) <= new Date(q.to)) &&
    (!q.candidateId || i.candidateId === q.candidateId) && (!q.jobId || i.jobId === q.jobId) && (!q.type || i.type === q.type) &&
    (!q.search || has(i.candidate?.name, q.search) || has(i.job?.title, q.search)));
  rows.sort((a, b) => new Date(a.start) - new Date(b.start));
  return { data: rows, total: rows.length };
});
const INT_FIELDS = ["candidateId", "start", "end", "type", "status", "location", "interviewers", "feedback", "notes"];
function checkInterview(b) {
  if (!candRef(b.candidateId)) fail(400, "Select a candidate");
  if (!b.start || !b.end || new Date(b.end) <= new Date(b.start)) fail(400, "End time must be after start time");
}
on("post", "interviews", ({ body }) => {
  checkInterview(body);
  const c = find(db().candidates, body.candidateId, "Candidate");
  const i = { _id: uid(), jobId: c.jobId, status: "Scheduled", location: "", interviewers: [], feedback: null, notes: "" };
  INT_FIELDS.forEach((k) => { if (body[k] !== undefined) i[k] = body[k]; });
  db().interviews.push(i); log(c, `Interview scheduled (${i.type})`); notify(`Interview scheduled with ${c.name}`); save();
  return withRefs(i);
});
on("put", "interviews/([^/]+)", ({ args, body }) => {
  const i = find(db().interviews, args[0], "Interview");
  const merged = { ...i, ...body, candidateId: i.candidateId };
  checkInterview(merged);
  INT_FIELDS.forEach((k) => { if (body[k] !== undefined && k !== "candidateId") i[k] = body[k]; }); save();
  return withRefs(i);
});
on("patch", "interviews/([^/]+)/status", ({ args, body }) => {
  const i = find(db().interviews, args[0], "Interview");
  i.status = body.status; save();
  return withRefs(i);
});
on("delete", "interviews/([^/]+)", ({ args }) => {
  const i = find(db().interviews, args[0], "Interview");
  db().interviews = db().interviews.filter((x) => x !== i); save();
  return { message: "Interview deleted" };
});

/* ---------------- Notifications ---------------- */
on("get", "notifications", () => ({ data: db().notifications.slice(0, 20), unread: db().notifications.filter((n) => !n.read).length }));
on("post", "notifications/read", () => { db().notifications.forEach((n) => { n.read = true; }); save(); return { message: "ok" }; });

/* ---------------- Settings ---------------- */
on("get", "settings", () => db().settings);
on("put", "settings/profile", ({ body }) => {
  if (!body.name?.trim()) fail(400, "Name is required");
  if (!isEmail(body.email)) fail(400, "A valid email is required");
  Object.assign(db().settings.profile, { name: body.name.trim(), email: body.email.trim(), role: body.role, phone: body.phone }); save();
  return db().settings.profile;
});
on("put", "settings/company", ({ body }) => {
  if (!body.name?.trim()) fail(400, "Company name is required");
  Object.assign(db().settings.company, body); save();
  return db().settings.company;
});
on("put", "settings/notifications", ({ body }) => { Object.assign(db().settings.notifications, body); save(); return db().settings.notifications; });
on("put", "settings/integrations/([^/]+)", ({ args, body }) => {
  const it = db().settings.integrations.find((x) => x.key === args[0]) || fail(404, "Integration not found");
  it.connected = !!body.connected; save();
  return it;
});
on("post", "settings/users", ({ body }) => {
  if (!body.name?.trim() || !isEmail(body.email)) fail(400, "Name and a valid email are required");
  if (db().settings.users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) fail(409, "A user with this email already exists");
  const u = { _id: uid(), name: body.name.trim(), email: body.email.trim(), role: body.role || "Recruiter" };
  db().settings.users.push(u); save();
  return u;
});
on("delete", "settings/users/([^/]+)", ({ args }) => {
  const u = find(db().settings.users, args[0], "User");
  if (u.email === db().settings.profile.email) fail(400, "You can't remove your own account");
  db().settings.users = db().settings.users.filter((x) => x !== u); save();
  return { message: "User removed" };
});

// Stages & sources share the same CRUD shape
for (const kind of ["stages", "sources"]) {
  const list = () => db().settings[kind];
  const label = kind === "stages" ? "Stage" : "Source";
  const dupe = (name, id) => list().some((x) => x._id !== id && x.name.toLowerCase() === name.toLowerCase());
  on("put", `settings/${kind}/reorder`, ({ body }) => {
    const byId = new Map(list().map((x) => [x._id, x]));
    db().settings[kind] = body.ids.map((id) => byId.get(id)).filter(Boolean); save();
    return list();
  });
  on("post", `settings/${kind}`, ({ body }) => {
    if (!body.name?.trim()) fail(400, `${label} name is required`);
    if (dupe(body.name.trim(), null)) fail(409, `${label} "${body.name.trim()}" already exists`);
    const item = { _id: uid(), name: body.name.trim(), color: body.color || "#64748b", ...(kind === "stages" ? { locked: false } : {}) };
    if (kind === "stages") { const at = list().findIndex((s) => s.name === "Hired"); list().splice(at < 0 ? list().length : at, 0, item); } else list().push(item);
    save();
    return item;
  });
  on("put", `settings/${kind}/([^/]+)`, ({ args, body }) => {
    const item = find(list(), args[0], label);
    const name = (body.name ?? item.name).trim();
    if (!name) fail(400, `${label} name is required`);
    if (dupe(name, item._id)) fail(409, `${label} "${name}" already exists`);
    if (item.locked && name !== item.name) fail(400, `"${item.name}" is a core stage and can't be renamed`);
    if (name !== item.name) db().candidates.forEach((c) => { if (kind === "stages" && c.stage === item.name) c.stage = name; if (kind === "sources" && c.source === item.name) c.source = name; });
    item.name = name; if (body.color) item.color = body.color; save();
    return item;
  });
  on("delete", `settings/${kind}/([^/]+)`, ({ args }) => {
    const item = find(list(), args[0], label);
    if (item.locked) fail(400, `"${item.name}" is a core stage and can't be deleted`);
    const n = db().candidates.filter((c) => (kind === "stages" ? c.stage : c.source) === item.name).length;
    if (n) fail(409, `${n} candidate${n > 1 ? "s use" : " uses"} "${item.name}". Move them first.`);
    db().settings[kind] = list().filter((x) => x !== item); save();
    return { message: `${label} deleted` };
  });
}

/* ---------------- Adapter ---------------- */
export default async function mockAdapter(config) {
  await delay(120 + Math.random() * 180);
  const method = (config.method || "get").toLowerCase();
  const url = (config.url || "").replace(/^\/+/, "").split("?")[0];
  let body = config.data;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const respond = (status, data) => ({ data, status, statusText: String(status), headers: {}, config, request: {} });
  const reject = (status, message) =>
    Promise.reject(new AxiosError(message, status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST", config, {}, respond(status, { message })));

  for (const [m, re, handler] of routes) {
    if (m !== method) continue;
    const match = url.match(re);
    if (!match) continue;
    try {
      return respond(200, structuredClone(handler({ params: config.params || {}, body, args: match.slice(1) })));
    } catch (e) {
      if (e instanceof HttpError) return reject(e.status, e.message);
      console.error(e);
      return reject(500, "Unexpected mock server error");
    }
  }
  return reject(404, `No mock route for ${method.toUpperCase()} /${url}`);
}
