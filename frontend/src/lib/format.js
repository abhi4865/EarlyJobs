// src/lib/format.js
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export const formatDate = (v) => (v ? dateFmt.format(new Date(v)) : "—");
export const formatShortDate = (v) => (v ? shortFmt.format(new Date(v)) : "—");
export const formatTime = (v) =>
  v ? new Date(v).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

export function timeAgo(v) {
  const diff = Date.now() - new Date(v).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  return formatDate(v);
}

export const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

/** Local YYYY-MM-DD key (avoids UTC off-by-one bugs) */
export const toDateKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export const toTimeValue = (d) => {
  const x = new Date(d);
  return `${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
};

export const salaryLabel = (min, max) => (min || max ? `₹${min ?? 0} - ${max ?? min} LPA` : "—");
export const experienceLabel = (min, max) => (min || max ? `${min ?? 0} - ${max ?? min} years` : "Fresher");

/** A "Scheduled" interview that is happening right now is shown as "In Progress". */
export function effectiveInterviewStatus(i) {
  if (i.status !== "Scheduled") return i.status;
  const now = Date.now();
  return now >= new Date(i.start).getTime() && now <= new Date(i.end).getTime() ? "In Progress" : "Scheduled";
}
