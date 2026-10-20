// backend/src/config/defaults.js
// Default workspace settings (used on first run and by the seed script).

export const DEFAULT_COMPANY = {
  name: "EarlyJobs",
  website: "",
  industry: "Technology",
  location: "Bangalore, India",
};

export const DEFAULT_STAGES = [
  { name: "Applied", color: "#3B82F6", locked: true },
  { name: "Screening", color: "#6366F1", locked: false },
  { name: "Interview", color: "#8B5CF6", locked: false },
  { name: "Offer", color: "#F59E0B", locked: false },
  { name: "Hired", color: "#10B981", locked: true },
  { name: "Rejected", color: "#EF4444", locked: true },
];

export const DEFAULT_SOURCES = [
  { name: "LinkedIn", color: "#2563EB" },
  { name: "Naukri", color: "#7C3AED" },
  { name: "Company Website", color: "#10B981" },
  { name: "Referral", color: "#F59E0B" },
  { name: "Indeed", color: "#EC4899" },
  { name: "Other", color: "#64748B" },
];

export const DEFAULT_INTEGRATIONS = [
  { key: "google-calendar", name: "Google Calendar", description: "Sync interviews with your calendar", connected: true },
  { key: "gmail", name: "Gmail", description: "Send and track candidate emails", connected: true },
  { key: "slack", name: "Slack", description: "Get hiring updates in your channels", connected: false },
  { key: "linkedin", name: "LinkedIn", description: "Import candidates from LinkedIn", connected: false },
];

export const DEFAULT_NOTIFICATIONS = {
  newCandidate: true,
  interviewReminder: true,
  stageChange: true,
  weeklyDigest: false,
};

export const ROLES = ["Admin", "Recruiter", "Hiring Manager"];
export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
export const JOB_STATUSES = ["Active", "On Hold", "Closed"];
export const INTERVIEW_TYPES = ["Video Call", "On-Site", "Phone"];
export const INTERVIEW_STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled"];
