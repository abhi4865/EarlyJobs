// backend/src/utils/serializers.js
// Turn DB documents into the exact shapes the frontend expects.

const toObj = (doc) => (doc && typeof doc.toObject === "function" ? doc.toObject() : doc);

const stripInternal = ({ __v, ...rest }) => rest;

// Newest first; entries created in the same millisecond keep latest-inserted first.
const newestFirst = (list = []) =>
  list
    .map((item, index) => ({ item, index }))
    .sort((a, b) => new Date(b.item.createdAt) - new Date(a.item.createdAt) || b.index - a.index)
    .map(({ item }) => item);

const isPopulated = (value, field) => value && typeof value === "object" && field in value;

export const userDto = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone ?? "",
});

/** Candidate with `job: { _id, title }` + `jobId`. Pass a lean/populated doc (or a mongoose doc). */
export const candidateDto = (doc) => {
  const o = toObj(doc);
  const populated = isPopulated(o.job, "title");
  return {
    ...stripInternal(o),
    jobId: o.job ? String(populated ? o.job._id : o.job) : null,
    job: populated ? { _id: o.job._id, title: o.job.title } : null,
    notes: newestFirst(o.notes),
    activity: newestFirst(o.activity),
  };
};

export const jobDto = (doc, candidateCount = 0) => ({
  ...stripInternal(toObj(doc)),
  candidateCount,
});

/** Interview with `candidateId`, `jobId`, `candidate: { _id, name, email }`, `job: { _id, title }`. */
export const interviewDto = (doc) => {
  const o = toObj(doc);
  const cand = isPopulated(o.candidate, "name") ? o.candidate : null;
  const job = isPopulated(o.job, "title") ? o.job : null;
  return {
    ...stripInternal(o),
    candidateId: o.candidate ? String(cand ? cand._id : o.candidate) : null,
    jobId: o.job ? String(job ? job._id : o.job) : null,
    candidate: cand ? { _id: cand._id, name: cand.name, email: cand.email } : null,
    job: job ? { _id: job._id, title: job.title } : null,
    feedback: o.feedback ?? null,
  };
};
