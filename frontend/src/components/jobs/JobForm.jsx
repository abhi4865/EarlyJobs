// src/components/jobs/JobForm.jsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { jobsApi } from "@/api/services";
import { getErrorMessage } from "@/api/client";
import { DEPARTMENTS, JOB_STATUSES, JOB_TYPES } from "@/lib/constants";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { Field, Input, Select, Textarea } from "@/components/common/Fields";

const empty = { title: "", department: "", location: "", type: "Full-time", status: "Active", experienceMin: "", experienceMax: "", salaryMin: "", salaryMax: "", openings: 1, description: "", skills: "", interviewers: "" };

export default function JobForm({ open, onClose, job, onSaved }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const editing = !!job;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(job ? { ...empty, ...job, skills: (job.skills || []).join(", "), interviewers: (job.interviewers || []).join(", ") } : empty);
  }, [open, job]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const num = (v) => (v === "" || v == null ? undefined : Number(v));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Enter a job title";
    if (!form.department) e.department = "Choose a department";
    if (!form.location.trim()) e.location = "Enter a location (or “Remote”)";
    if (num(form.experienceMin) > num(form.experienceMax)) e.experienceMax = "Max must be at least the min";
    if (num(form.salaryMin) > num(form.salaryMax)) e.salaryMax = "Max must be at least the min";
    if (!(Number(form.openings) >= 1)) e.openings = "At least 1 opening";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const split = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
    const payload = {
      title: form.title.trim(), department: form.department, location: form.location.trim(), type: form.type, status: form.status,
      experienceMin: num(form.experienceMin), experienceMax: num(form.experienceMax), salaryMin: num(form.salaryMin), salaryMax: num(form.salaryMax),
      openings: Number(form.openings), description: form.description, skills: split(form.skills), interviewers: split(form.interviewers),
    };
    try {
      const saved = editing ? await jobsApi.update(job._id, payload) : await jobsApi.create(payload);
      toast.success(editing ? "Job updated" : "Job created");
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open} onClose={onClose} size="lg" title={editing ? "Edit job" : "Create job"}
      description={editing ? `${job.code} · update the position details.` : "Open a new position and start receiving candidates."}
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" form="job-form" loading={saving}>{editing ? "Save changes" : "Create job"}</Button>
      </>}
    >
      <form id="job-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Job title" required error={errors.title} className="sm:col-span-2" htmlFor="j-title"><Input id="j-title" value={form.title} onChange={set("title")} invalid={!!errors.title} placeholder="e.g. Frontend Developer" autoFocus /></Field>
        <Field label="Department" required error={errors.department} htmlFor="j-dept"><Select id="j-dept" value={form.department} onChange={set("department")} invalid={!!errors.department}><option value="">Select department</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select></Field>
        <Field label="Location" required error={errors.location} htmlFor="j-loc"><Input id="j-loc" value={form.location} onChange={set("location")} invalid={!!errors.location} placeholder="Bangalore" /></Field>
        <Field label="Job type" htmlFor="j-type"><Select id="j-type" value={form.type} onChange={set("type")}>{JOB_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Status" htmlFor="j-status"><Select id="j-status" value={form.status} onChange={set("status")}>{JOB_STATUSES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Experience (years)" error={errors.experienceMax}>
          <div className="flex gap-2"><Input type="number" min="0" aria-label="Minimum experience" value={form.experienceMin} onChange={set("experienceMin")} placeholder="Min" /><Input type="number" min="0" aria-label="Maximum experience" value={form.experienceMax} onChange={set("experienceMax")} placeholder="Max" invalid={!!errors.experienceMax} /></div>
        </Field>
        <Field label="Salary range (LPA)" error={errors.salaryMax}>
          <div className="flex gap-2"><Input type="number" min="0" aria-label="Minimum salary" value={form.salaryMin} onChange={set("salaryMin")} placeholder="Min" /><Input type="number" min="0" aria-label="Maximum salary" value={form.salaryMax} onChange={set("salaryMax")} placeholder="Max" invalid={!!errors.salaryMax} /></div>
        </Field>
        <Field label="Openings" error={errors.openings} htmlFor="j-open"><Input id="j-open" type="number" min="1" value={form.openings} onChange={set("openings")} invalid={!!errors.openings} /></Field>
        <Field label="Interviewers" hint="Separate names with commas" htmlFor="j-int"><Input id="j-int" value={form.interviewers} onChange={set("interviewers")} placeholder="Abhishek Yadav, Sneha Verma" /></Field>
        <Field label="Key skills" hint="Separate with commas" className="sm:col-span-2" htmlFor="j-skills"><Input id="j-skills" value={form.skills} onChange={set("skills")} placeholder="React, JavaScript, REST APIs" /></Field>
        <Field label="Job description" className="sm:col-span-2" htmlFor="j-desc"><Textarea id="j-desc" value={form.description} onChange={set("description")} placeholder="What will this person work on?" /></Field>
      </form>
    </Modal>
  );
}
