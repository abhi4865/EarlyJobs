// src/components/candidates/CandidateForm.jsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { candidatesApi, jobsApi } from "@/api/services";
import { getErrorMessage } from "@/api/client";
import { useSettings } from "@/context/SettingsContext";
import { NOTICE_PERIODS } from "@/lib/constants";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { Field, Input, Select } from "@/components/common/Fields";

const empty = { name: "", email: "", phone: "", location: "", linkedin: "", jobId: "", stage: "", source: "", expectedSalary: "", noticePeriod: "", skills: "" };

export default function CandidateForm({ open, onClose, candidate, defaultStage, onSaved }) {
  const { stageNames, sourceNames } = useSettings();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [jobs, setJobs] = useState([]);
  const [saving, setSaving] = useState(false);
  const editing = !!candidate;

  useEffect(() => {
    if (!open) return;
    jobsApi.list({ limit: 100 }).then((r) => setJobs(r.data)).catch(() => toast.error("Couldn't load jobs"));
    setErrors({});
    setForm(candidate
      ? { ...empty, ...candidate, jobId: candidate.job?._id ?? "", skills: (candidate.skills || []).join(", ") }
      : { ...empty, stage: defaultStage || stageNames[0] || "", source: sourceNames[0] || "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, candidate, defaultStage]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Enter the candidate's full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone)) e.phone = "Enter a valid phone number";
    if (!form.jobId) e.jobId = "Choose a job position";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name, email: form.email, phone: form.phone, location: form.location, linkedin: form.linkedin,
      jobId: form.jobId, stage: form.stage, source: form.source, expectedSalary: form.expectedSalary, noticePeriod: form.noticePeriod,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      const saved = editing ? await candidatesApi.update(candidate._id, payload) : await candidatesApi.create(payload);
      toast.success(editing ? "Candidate updated" : "Candidate added");
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
      open={open} onClose={onClose} size="lg" title={editing ? "Edit candidate" : "Add candidate"}
      description={editing ? "Update the candidate's details." : "Add someone to your hiring pipeline."}
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" form="candidate-form" loading={saving}>{editing ? "Save changes" : "Add candidate"}</Button>
      </>}
    >
      <form id="candidate-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.name} htmlFor="c-name"><Input id="c-name" value={form.name} onChange={set("name")} invalid={!!errors.name} placeholder="e.g. Rohan Sharma" autoFocus /></Field>
        <Field label="Email" required error={errors.email} htmlFor="c-email"><Input id="c-email" type="email" value={form.email} onChange={set("email")} invalid={!!errors.email} placeholder="name@email.com" /></Field>
        <Field label="Phone" error={errors.phone} htmlFor="c-phone"><Input id="c-phone" value={form.phone} onChange={set("phone")} invalid={!!errors.phone} placeholder="+91 98765 43210" /></Field>
        <Field label="Location" htmlFor="c-loc"><Input id="c-loc" value={form.location} onChange={set("location")} placeholder="Bangalore, India" /></Field>
        <Field label="Job position" required error={errors.jobId} htmlFor="c-job">
          <Select id="c-job" value={form.jobId} onChange={set("jobId")} invalid={!!errors.jobId}>
            <option value="">Select a job</option>
            {jobs.map((j) => <option key={j._id} value={j._id}>{j.title} ({j.code})</option>)}
          </Select>
        </Field>
        <Field label="Stage" htmlFor="c-stage"><Select id="c-stage" value={form.stage} onChange={set("stage")}>{stageNames.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Source" htmlFor="c-source"><Select id="c-source" value={form.source} onChange={set("source")}>{sourceNames.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Notice period" htmlFor="c-notice"><Select id="c-notice" value={form.noticePeriod} onChange={set("noticePeriod")}><option value="">Not specified</option>{NOTICE_PERIODS.map((n) => <option key={n}>{n}</option>)}</Select></Field>
        <Field label="Expected salary" htmlFor="c-sal"><Input id="c-sal" value={form.expectedSalary} onChange={set("expectedSalary")} placeholder="₹8 - 12 LPA" /></Field>
        <Field label="LinkedIn" htmlFor="c-li"><Input id="c-li" value={form.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/username" /></Field>
        <Field label="Skills" hint="Separate with commas" className="sm:col-span-2" htmlFor="c-skills"><Input id="c-skills" value={form.skills} onChange={set("skills")} placeholder="React, JavaScript, HTML" /></Field>
      </form>
    </Modal>
  );
}
