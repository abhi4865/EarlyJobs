// src/components/interviews/InterviewForm.jsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { candidatesApi, interviewsApi } from "@/api/services";
import { getErrorMessage } from "@/api/client";
import { useSettings } from "@/context/SettingsContext";
import { DURATIONS, INTERVIEW_TYPES } from "@/lib/constants";
import { toDateKey, toTimeValue } from "@/lib/format";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { Checkbox, Field, Input, Select } from "@/components/common/Fields";

const locationLabel = { "Video Call": "Meeting link", "On-Site": "Location", Phone: "Phone number" };

export default function InterviewForm({ open, onClose, interview, candidate, defaultDate, onSaved }) {
  const { users } = useSettings();
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const editing = !!interview;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (!editing) candidatesApi.list({ limit: 200, sort: "name", order: "asc" }).then((r) => setPeople(r.data)).catch(() => toast.error("Couldn't load candidates"));
    if (editing) {
      const mins = Math.round((new Date(interview.end) - new Date(interview.start)) / 60000);
      setForm({ candidateId: interview.candidateId, date: toDateKey(interview.start), time: toTimeValue(interview.start), duration: mins, type: interview.type, location: interview.location || "", interviewers: interview.interviewers.map((i) => i.name) });
    } else {
      setForm({ candidateId: candidate?._id ?? "", date: toDateKey(defaultDate || new Date()), time: "10:00", duration: 45, type: "Video Call", location: "", interviewers: users.slice(0, 1).map((u) => u.name) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, interview, candidate, defaultDate]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleUser = (name) => setForm((f) => ({ ...f, interviewers: f.interviewers.includes(name) ? f.interviewers.filter((n) => n !== name) : [...f.interviewers, name] }));

  const submit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.candidateId) e.candidateId = "Choose a candidate";
    if (!form.date) e.date = "Pick a date";
    if (!form.time) e.time = "Pick a start time";
    if (!form.interviewers.length) e.interviewers = "Add at least one interviewer";
    setErrors(e);
    if (Object.keys(e).length) return;

    const start = new Date(`${form.date}T${form.time}`);
    const end = new Date(start.getTime() + Number(form.duration) * 60000);
    const payload = {
      candidateId: form.candidateId, start: start.toISOString(), end: end.toISOString(), type: form.type, location: form.location,
      interviewers: form.interviewers.map((name) => ({ name, role: users.find((u) => u.name === name)?.role ?? "Interviewer" })),
    };
    setSaving(true);
    try {
      const saved = editing ? await interviewsApi.update(interview._id, payload) : await interviewsApi.create(payload);
      toast.success(editing ? "Interview rescheduled" : "Interview scheduled");
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const candidateOptions = candidate && !people.some((p) => p._id === candidate._id) ? [candidate, ...people] : people;

  return (
    <Modal
      open={open} onClose={onClose} size="md" title={editing ? "Reschedule interview" : "Schedule interview"}
      description={editing ? "Change the time, type or interviewers." : "Pick a candidate and a time that works."}
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" form="interview-form" loading={saving}>{editing ? "Save changes" : "Schedule interview"}</Button>
      </>}
    >
      <form id="interview-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Candidate" required error={errors.candidateId} className="sm:col-span-2" htmlFor="i-cand">
          {editing ? <Input id="i-cand" disabled value={interview.candidate?.name ?? ""} readOnly /> : (
            <Select id="i-cand" value={form.candidateId ?? ""} onChange={set("candidateId")} invalid={!!errors.candidateId}>
              <option value="">Select a candidate</option>
              {candidateOptions.map((c) => <option key={c._id} value={c._id}>{c.name} — {c.job?.title}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Date" required error={errors.date} htmlFor="i-date"><Input id="i-date" type="date" value={form.date ?? ""} onChange={set("date")} invalid={!!errors.date} /></Field>
        <Field label="Start time" required error={errors.time} htmlFor="i-time"><Input id="i-time" type="time" value={form.time ?? ""} onChange={set("time")} invalid={!!errors.time} /></Field>
        <Field label="Duration" htmlFor="i-dur"><Select id="i-dur" value={form.duration ?? 45} onChange={set("duration")}>{DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}</Select></Field>
        <Field label="Interview type" htmlFor="i-type"><Select id="i-type" value={form.type ?? "Video Call"} onChange={set("type")}>{INTERVIEW_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label={locationLabel[form.type] ?? "Location"} className="sm:col-span-2" htmlFor="i-loc"><Input id="i-loc" value={form.location ?? ""} onChange={set("location")} placeholder={form.type === "Video Call" ? "https://meet.google.com/…" : ""} /></Field>
        <Field label="Interviewers" required error={errors.interviewers} className="sm:col-span-2">
          <div className="space-y-2 rounded-lg border border-slate-200 p-3">
            {users.map((u) => (
              <label key={u._id} className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                <Checkbox checked={form.interviewers?.includes(u.name) ?? false} onChange={() => toggleUser(u.name)} /> {u.name} <span className="text-slate-400">({u.role})</span>
              </label>
            ))}
          </div>
        </Field>
      </form>
    </Modal>
  );
}
