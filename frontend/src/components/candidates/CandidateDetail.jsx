// src/components/candidates/CandidateDetail.jsx
import { useState } from "react";
import { toast } from "sonner";
import { Link2, CalendarPlus, Download, FileText, Mail, MapPin, Phone, Pencil, Trash2, X, CalendarDays, Video, Building2 } from "lucide-react";
import { candidatesApi, interviewsApi } from "@/api/services";
import { getErrorMessage } from "@/api/client";
import { useFetch } from "@/hooks";
import { useSettings } from "@/context/SettingsContext";
import { formatDate, formatShortDate, formatTime, timeAgo, effectiveInterviewStatus } from "@/lib/format";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import Tabs from "@/components/common/Tabs";
import { Chip, StatusBadge } from "@/components/common/Badges";
import { Select, Textarea } from "@/components/common/Fields";
import { EmptyState, Skeleton } from "@/components/common/States";

const TABS = ["Overview", "Interviews", "Notes", "Activity"];

function Row({ icon: Icon, children }) {
  return <li className="flex items-start gap-3 text-sm text-slate-700"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden /><span className="min-w-0 break-words">{children}</span></li>;
}

function InterviewsTab({ candidateId }) {
  const { data, loading } = useFetch(() => interviewsApi.list({ candidateId }), [candidateId]);
  if (loading && !data) return <div className="space-y-3 p-5"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>;
  if (!data?.data.length) return <EmptyState icon={CalendarDays} title="No interviews yet" description="Schedule one to see it here." className="py-10" />;
  return (
    <ul className="space-y-3 p-5">
      {[...data.data].reverse().map((i) => (
        <li key={i._id} className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-800">{formatShortDate(i.start)} · {formatTime(i.start)}</p>
            <StatusBadge status={effectiveInterviewStatus(i)} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">{i.type === "On-Site" ? <Building2 className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}{i.type}</p>
        </li>
      ))}
    </ul>
  );
}

function NotesTab({ candidate, onChanged }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const add = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try { await candidatesApi.addNote(candidate._id, text); setText(""); toast.success("Note added"); onChanged(); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setSaving(false); }
  };
  return (
    <div className="space-y-4 p-5">
      <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a note about this candidate…" aria-label="New note" />
      <Button size="sm" onClick={add} loading={saving} disabled={!text.trim()}>Add note</Button>
      {candidate.notes.length === 0 ? <p className="text-sm text-slate-500">No notes yet.</p> : (
        <ul className="space-y-3">{candidate.notes.map((n) => (
          <li key={n._id} className="rounded-xl bg-slate-50 p-3"><p className="whitespace-pre-wrap text-sm text-slate-700">{n.text}</p><p className="mt-1 text-xs text-slate-400">{timeAgo(n.createdAt)}</p></li>
        ))}</ul>
      )}
    </div>
  );
}

export default function CandidateDetail({ candidate, onClose, onChanged, onEdit, onDelete, onSchedule }) {
  const { stageNames } = useSettings();
  const [tab, setTab] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const offerStage = stageNames.find((s) => s.toLowerCase() === "offer");

  const changeStage = async (stage) => {
    setBusy(true);
    try { await candidatesApi.setStage(candidate._id, stage); toast.success(`Moved to ${stage}`); onChanged(); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const downloadResume = () => {
    if (candidate.resume?.url) window.open(candidate.resume.url, "_blank", "noopener");
    else toast.info("No resume file is attached to this candidate yet.");
  };

  return (
    <div>
      <div className="flex items-start gap-3 p-5 pb-4">
        <Avatar name={candidate.name} size="xl" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-slate-900">{candidate.name}</h2>
          <p className="truncate text-sm text-slate-500">{candidate.job?.title}</p>
          <Select value={candidate.stage} disabled={busy} onChange={(e) => changeStage(e.target.value)} aria-label="Change stage" wrapperClassName="mt-2 w-40" className="h-8 py-0 text-xs font-medium">
            {stageNames.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <button onClick={onClose} aria-label="Close panel" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "Overview" && (
        <div className="space-y-5 p-5">
          <ul className="space-y-3">
            <Row icon={Mail}><a className="hover:underline" href={`mailto:${candidate.email}`}>{candidate.email}</a></Row>
            {candidate.phone && <Row icon={Phone}><a className="hover:underline" href={`tel:${candidate.phone.replace(/\s/g, "")}`}>{candidate.phone}</a></Row>}
            {candidate.location && <Row icon={MapPin}>{candidate.location}</Row>}
            {candidate.linkedin && <Row icon={Link2}><a className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer" href={`https://${candidate.linkedin.replace(/^https?:\/\//, "")}`}>{candidate.linkedin}</a></Row>}
            <Row icon={CalendarDays}>Applied on {formatDate(candidate.appliedOn)}</Row>
          </ul>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Resume</h3>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500"><FileText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-indigo-600">{candidate.resume?.name}</p><p className="text-xs text-slate-500">{candidate.resume?.size}</p></div>
              <button onClick={downloadResume} aria-label="Download resume" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Download className="h-4 w-4" /></button>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Additional info</h3>
            <dl className="grid grid-cols-[110px_1fr] gap-y-2.5 text-sm">
              <dt className="text-slate-500">Source</dt><dd className="text-slate-800">{candidate.source || "—"}</dd>
              <dt className="text-slate-500">Expected salary</dt><dd className="text-slate-800">{candidate.expectedSalary || "—"}</dd>
              <dt className="text-slate-500">Notice period</dt><dd className="text-slate-800">{candidate.noticePeriod || "—"}</dd>
              <dt className="text-slate-500">Skills</dt>
              <dd className="flex flex-wrap gap-1.5">{candidate.skills?.length ? candidate.skills.map((s) => <Chip key={s}>{s}</Chip>) : "—"}</dd>
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" disabled={!offerStage || busy || ["Offer", "Hired"].includes(candidate.stage)} onClick={() => changeStage(offerStage)}>Move to Offer</Button>
            <Button onClick={() => onSchedule(candidate)}><CalendarPlus className="h-4 w-4" /> Schedule Interview</Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(candidate)}><Pencil className="h-4 w-4" /> Edit</Button>
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => onDelete(candidate)}><Trash2 className="h-4 w-4" /> Delete</Button>
          </div>
        </div>
      )}
      {tab === "Interviews" && <InterviewsTab candidateId={candidate._id} />}
      {tab === "Notes" && <NotesTab candidate={candidate} onChanged={onChanged} />}
      {tab === "Activity" && (
        <ol className="space-y-4 p-5">
          {candidate.activity.map((a) => (
            <li key={a._id} className="relative border-l-2 border-indigo-100 pl-4"><span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-indigo-500" /><p className="text-sm text-slate-700">{a.text}</p><p className="text-xs text-slate-400">{timeAgo(a.createdAt)}</p></li>
          ))}
        </ol>
      )}
    </div>
  );
}
