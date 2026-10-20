// src/pages/InterviewsPage.jsx
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, CalendarCheck, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, Filter, MoreVertical, Pencil, Phone, Plus, Users, Video, X, XCircle, Star, Trash2 } from "lucide-react";
import { interviewsApi, jobsApi } from "@/api/services";
import { getErrorMessage } from "@/api/client";
import { useDebounce, useFetch } from "@/hooks";
import { cn } from "@/lib/utils";
import { INTERVIEW_STATUSES, INTERVIEW_TYPES } from "@/lib/constants";
import { effectiveInterviewStatus, formatDate, formatTime, toDateKey } from "@/lib/format";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DetailPanel, { panelGridClass } from "@/components/common/DetailPanel";
import { SearchInput, Select, Textarea } from "@/components/common/Fields";
import PageHeader from "@/components/common/PageHeader";
import Popover, { MenuItem } from "@/components/common/Popover";
import StatCard from "@/components/common/StatCard";
import Tabs from "@/components/common/Tabs";
import { StatusBadge } from "@/components/common/Badges";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/States";
import InterviewForm from "@/components/interviews/InterviewForm";

const TypeIcon = ({ type, className }) => (type === "Video Call" ? <Video className={className} /> : type === "Phone" ? <Phone className={className} /> : <Building2 className={className} />);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Calendar({ month, setMonth, selected, onSelect, marked }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const cells = Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay() + i));
  const todayKey = toDateKey(new Date());
  const shift = (n) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{month.toLocaleString("en-US", { month: "long", year: "numeric" })}</h2>
        <div className="flex gap-1">
          <button onClick={() => shift(-1)} aria-label="Previous month" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={() => shift(1)} aria-label="Next month" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-slate-500">{DAYS.map((d) => <div key={d} className="py-2">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
        {cells.map((d) => {
          const key = toDateKey(d); const inMonth = d.getMonth() === month.getMonth(); const sel = key === toDateKey(selected);
          return (
            <button key={key} onClick={() => onSelect(d)} aria-label={d.toDateString()} aria-pressed={sel}
              className={cn("relative mx-auto flex h-9 w-9 items-center justify-center rounded-full", inMonth ? "text-slate-800" : "text-slate-300",
                sel ? "bg-indigo-600 font-semibold text-white" : "hover:bg-slate-100", key === todayKey && !sel && "font-bold text-indigo-600")}>
              {d.getDate()}
              {marked.has(key) && <span className={cn("absolute bottom-0.5 h-1.5 w-1.5 rounded-full", sel ? "bg-white" : "bg-indigo-500")} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InterviewDetail({ interview, onClose, onChanged, onReschedule, onCancel }) {
  const [tab, setTab] = useState("Details");
  const status = effectiveInterviewStatus(interview);
  const [rating, setRating] = useState(interview.feedback?.rating ?? 0);
  const [text, setText] = useState(interview.feedback?.text ?? "");
  const [notes, setNotes] = useState(interview.notes ?? "");
  const [saving, setSaving] = useState(false);
  const closed = status === "Cancelled";

  const save = async (patch, msg) => {
    setSaving(true);
    try { await interviewsApi.update(interview._id, patch); toast.success(msg); onChanged(); } catch (e) { toast.error(getErrorMessage(e)); } finally { setSaving(false); }
  };
  const join = () => {
    if (interview.type === "Video Call" && interview.location?.startsWith("http")) window.open(interview.location, "_blank", "noopener,noreferrer");
    else toast.info(interview.type === "Video Call" ? "No meeting link has been added. Reschedule to add one." : `This is a ${interview.type.toLowerCase()} interview.`);
  };
  const complete = async () => { try { await interviewsApi.setStatus(interview._id, "Completed"); toast.success("Marked as completed"); onChanged(); } catch (e) { toast.error(getErrorMessage(e)); } };

  return (
    <div>
      <div className="flex items-start gap-3 p-5 pb-4">
        <Avatar name={interview.candidate?.name} size="lg" />
        <div className="min-w-0 flex-1"><h2 className="truncate text-lg font-semibold text-slate-900">{interview.candidate?.name}</h2><p className="truncate text-sm text-slate-500">{interview.job?.title}</p></div>
        <button onClick={onClose} aria-label="Close panel" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>
      <Tabs tabs={["Details", "Feedback", "Notes"]} value={tab} onChange={setTab} />

      {tab === "Details" && (
        <div className="space-y-4 p-5">
          {[
            [CalendarDays, "Date & Time", `${formatDate(interview.start)} | ${formatTime(interview.start)} - ${formatTime(interview.end)}`],
            [Video, "Interview Type", interview.type + (interview.location ? ` (${interview.location})` : "")],
            [FileText, "Job Position", interview.job?.title],
          ].map(([Icon, label, value]) => (
            <div key={label} className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="text-sm font-medium text-slate-800">{label}</p><p className="break-words text-sm text-slate-500">{value}</p></div></div>
          ))}
          <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Users className="h-4 w-4" /></span>
            <div><p className="text-sm font-medium text-slate-800">Interviewer(s)</p><ul className="mt-1 space-y-1.5">{interview.interviewers.map((p) => <li key={p.name} className="flex items-center gap-2 text-sm text-slate-600"><Avatar name={p.name} size="sm" className="!h-6 !w-6 !text-[10px]" />{p.name} <span className="text-slate-400">({p.role})</span></li>)}</ul></div></div>
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Clock className="h-4 w-4" /></span><p className="text-sm font-medium text-slate-800">Status</p><StatusBadge status={status} /></div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button disabled={closed || status === "Completed"} onClick={join}><Video className="h-4 w-4" /> Join Meeting</Button>
            <Button variant="outline" disabled={closed} onClick={() => onReschedule(interview)}><Pencil className="h-4 w-4" /> Reschedule</Button>
            <Button variant="outline" disabled={closed || status === "Completed"} onClick={() => onCancel(interview)}><XCircle className="h-4 w-4" /> Cancel Interview</Button>
            <Button variant="outline" onClick={() => setTab("Feedback")}><FileText className="h-4 w-4" /> Add Feedback</Button>
          </div>
          {status === "In Progress" || status === "Scheduled" ? <Button variant="soft" className="w-full" onClick={complete}><CheckCircle2 className="h-4 w-4" /> Mark as completed</Button> : null}
        </div>
      )}
      {tab === "Feedback" && (
        <div className="space-y-4 p-5">
          <div><p className="mb-1.5 text-sm font-medium text-slate-700">Rating</p>
            <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={rating >= n}><Star className={cn("h-7 w-7", rating >= n ? "fill-amber-400 text-amber-400" : "text-slate-300")} /></button>)}</div></div>
          <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="How did the interview go? Strengths, concerns, recommendation…" aria-label="Feedback" />
          <Button loading={saving} disabled={!rating && !text.trim()} onClick={() => save({ feedback: { rating, text: text.trim() } }, "Feedback saved")}>Save feedback</Button>
        </div>
      )}
      {tab === "Notes" && (
        <div className="space-y-4 p-5"><Textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Private notes for this interview…" aria-label="Notes" />
          <Button loading={saving} disabled={notes === (interview.notes ?? "")} onClick={() => save({ notes }, "Notes saved")}>Save notes</Button></div>
      )}
    </div>
  );
}

export default function InterviewsPage() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [f, setF] = useState({ jobId: "", type: "", status: "", search: "" });
  const [selectedId, setSelectedId] = useState(null);
  const [formState, setFormState] = useState({ open: false, interview: null });
  const [toCancel, setToCancel] = useState(null);
  const [busy, setBusy] = useState(false);
  const search = useDebounce(f.search);

  const from = new Date(month.getFullYear(), month.getMonth() - 0, 1 - new Date(month.getFullYear(), month.getMonth(), 1).getDay()).toISOString();
  const to = new Date(month.getFullYear(), month.getMonth(), 1 - new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 42).toISOString();
  const { data, loading, error, reload } = useFetch(() => interviewsApi.list({ from, to, jobId: f.jobId || undefined, type: f.type || undefined, search: search || undefined }), [from, f.jobId, f.type, search]);
  const stats = useFetch(() => interviewsApi.stats(), []);
  const { data: jobsData } = useFetch(() => jobsApi.list({ limit: 100 }), []);
  const refresh = () => { reload(); stats.reload(); };

  const all = useMemo(() => (data?.data ?? []).filter((i) => !f.status || effectiveInterviewStatus(i) === f.status), [data, f.status]);
  const marked = useMemo(() => new Set(all.map((i) => toDateKey(i.start))), [all]);
  const day = all.filter((i) => toDateKey(i.start) === toDateKey(selectedDate));
  const current = all.find((i) => i._id === selectedId);
  const s = stats.data;
  const hasFilters = f.jobId || f.type || f.status || f.search;

  const pick = (d) => { setSelectedDate(d); if (d.getMonth() !== month.getMonth()) setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); };
  const cancel = async () => {
    setBusy(true);
    try { await interviewsApi.setStatus(toCancel._id, "Cancelled"); toast.success("Interview cancelled"); setToCancel(null); refresh(); } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Interviews" subtitle="Schedule, track and manage candidate interviews"
        actions={<Button size="lg" onClick={() => setFormState({ open: true, interview: null })}><Plus className="h-5 w-5" /> Schedule Interview</Button>} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Total Scheduled" value={s?.totalScheduled ?? "–"} trend={s?.trends.totalScheduled} sublabel="vs last month" tone="bg-violet-50 text-violet-600" />
        <StatCard icon={Users} label="Today's Interviews" value={s?.today ?? "–"} trend={s?.trends.today} sublabel="vs last week" tone="bg-blue-50 text-blue-600" />
        <StatCard icon={CheckCircle2} label="Completed" value={s?.completed ?? "–"} trend={s?.trends.completed} sublabel="vs last month" tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock} label="Pending" value={s?.pending ?? "–"} trend={s?.trends.pending} tone="bg-amber-50 text-amber-600" />
      </div>

      <div className={cn("grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]", current && "xl:grid-cols-[20rem_minmax(0,1fr)_24rem]")}>
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm"><Calendar month={month} setMonth={setMonth} selected={selectedDate} onSelect={pick} marked={marked} /></section>
          <section className="space-y-3 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold text-slate-900"><Filter className="h-4 w-4 text-slate-500" /> Filters</h2>{hasFilters && <button className="text-sm font-medium text-indigo-600 hover:underline" onClick={() => setF({ jobId: "", type: "", status: "", search: "" })}>Clear All</button>}</div>
            <Select value={f.jobId} onChange={(e) => setF({ ...f, jobId: e.target.value })} aria-label="Job position"><option value="">All Jobs</option>{jobsData?.data.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}</Select>
            <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} aria-label="Interview type"><option value="">All Types</option>{INTERVIEW_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
            <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Status"><option value="">All Status</option>{INTERVIEW_STATUSES.map((t) => <option key={t}>{t}</option>)}</Select>
            <SearchInput value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} placeholder="Search candidates…" aria-label="Search candidates" />
          </section>
        </div>

        <section className="min-w-0 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Interviews on {formatDate(selectedDate)}</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{day.length} Interview{day.length === 1 ? "" : "s"}</span>
          </div>
          {error && !data ? <ErrorState message={error} onRetry={reload} /> : !data ? <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div> : day.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="Nothing scheduled" description="No interviews on this day. Pick another date or schedule one."
              action={<Button onClick={() => setFormState({ open: true, interview: null })}><Plus className="h-4 w-4" /> Schedule Interview</Button>} />
          ) : (
            <ul className={cn("space-y-3 transition-opacity", loading && "opacity-60")}>
              {day.map((i) => {
                const st = effectiveInterviewStatus(i);
                return (
                  <li key={i._id}>
                    <div role="button" tabIndex={0} onClick={() => setSelectedId(i._id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedId(i._id)}
                      className={cn("flex w-full cursor-pointer items-start gap-3 rounded-xl border-l-4 border border-slate-200 p-4 text-left transition hover:border-indigo-300", st === "In Progress" ? "border-l-violet-500 bg-violet-50/60" : "border-l-indigo-400", st === "Cancelled" && "opacity-60", i._id === selectedId && "ring-2 ring-indigo-500/30")}>
                      <div className="w-20 shrink-0"><p className="text-sm font-semibold text-slate-900">{formatTime(i.start)}</p><p className="text-xs text-slate-500">{formatTime(i.end)}</p></div>
                      <Avatar name={i.candidate?.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">{i.candidate?.name}</p><p className="truncate text-sm text-slate-500">{i.job?.title}</p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500"><TypeIcon type={i.type} className="h-3.5 w-3.5" />{i.type}</p>
                      </div>
                      <StatusBadge status={st} />
                      <Popover trigger={({ toggle }) => <button onClick={toggle} aria-label="More actions" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><MoreVertical className="h-4 w-4" /></button>}>
                        {(close) => (<>
                          <MenuItem icon={Pencil} disabled={st === "Cancelled"} onClick={() => { close(); setFormState({ open: true, interview: i }); }}>Reschedule</MenuItem>
                          <MenuItem icon={XCircle} disabled={st === "Cancelled" || st === "Completed"} onClick={() => { close(); setToCancel(i); }}>Cancel interview</MenuItem>
                          <MenuItem icon={Trash2} danger onClick={async () => { close(); try { await interviewsApi.remove(i._id); toast.success("Interview deleted"); refresh(); } catch (e) { toast.error(getErrorMessage(e)); } }}>Delete</MenuItem>
                        </>)}
                      </Popover>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <DetailPanel open={!!current} onClose={() => setSelectedId(null)}>
          {current && <InterviewDetail key={current._id} interview={current} onClose={() => setSelectedId(null)} onChanged={refresh} onReschedule={(i) => setFormState({ open: true, interview: i })} onCancel={setToCancel} />}
        </DetailPanel>
      </div>

      <InterviewForm open={formState.open} interview={formState.interview} defaultDate={selectedDate} onClose={() => setFormState({ open: false, interview: null })} onSaved={(i) => { refresh(); pick(new Date(i.start)); }} />
      <ConfirmDialog open={!!toCancel} loading={busy} title="Cancel this interview?" description={`The interview with ${toCancel?.candidate?.name} on ${toCancel ? formatDate(toCancel.start) : ""} will be marked as cancelled.`} confirmLabel="Cancel interview" onConfirm={cancel} onClose={() => setToCancel(null)} />
    </>
  );
}
