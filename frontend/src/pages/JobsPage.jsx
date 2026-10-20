// src/pages/JobsPage.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { BarChart3, Briefcase, Building2, CheckCircle2, CircleX, Code2, Database, FileText, IndianRupee, Layers, MapPin, MoreVertical, PauseCircle, Pencil, PenLine, Plus, Share2, ShieldCheck, Trash2, Users, X, Palette, Settings2, LineChart } from "lucide-react";
import { candidatesApi, jobsApi } from "@/api/services";
import { getErrorMessage } from "@/api/client";
import { useDebounce, useFetch } from "@/hooks";
import { cn } from "@/lib/utils";
import { DEPARTMENTS, JOB_STATUSES } from "@/lib/constants";
import { experienceLabel, formatDate, salaryLabel } from "@/lib/format";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DetailPanel, { panelGridClass } from "@/components/common/DetailPanel";
import { SearchInput, Select, Textarea } from "@/components/common/Fields";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import Popover, { MenuItem } from "@/components/common/Popover";
import StatCard from "@/components/common/StatCard";
import Tabs from "@/components/common/Tabs";
import { Chip, StageBadge, StatusBadge } from "@/components/common/Badges";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/States";
import JobForm from "@/components/jobs/JobForm";

const ICONS = { "Frontend Developer": [Code2, "bg-blue-50 text-blue-600"], "Backend Developer": [Database, "bg-sky-50 text-sky-600"], "UI/UX Designer": [Palette, "bg-violet-50 text-violet-600"], "Product Manager": [BarChart3, "bg-rose-50 text-rose-600"], "DevOps Engineer": [Settings2, "bg-blue-50 text-blue-600"], "Data Analyst": [LineChart, "bg-emerald-50 text-emerald-600"], "QA Engineer": [ShieldCheck, "bg-indigo-50 text-indigo-600"], "Content Writer": [FileText, "bg-amber-50 text-amber-600"] };
const DEPT_ICONS = { Engineering: [Code2, "bg-blue-50 text-blue-600"], Design: [Palette, "bg-violet-50 text-violet-600"], Product: [BarChart3, "bg-rose-50 text-rose-600"], Data: [LineChart, "bg-emerald-50 text-emerald-600"], Marketing: [FileText, "bg-amber-50 text-amber-600"] };
const iconFor = (j) => ICONS[j.title] ?? DEPT_ICONS[j.department] ?? [Briefcase, "bg-indigo-50 text-indigo-600"];
const JobIcon = ({ job, className }) => { const [Icon, tone] = iconFor(job); return <span className={cn("flex shrink-0 items-center justify-center rounded-xl", tone, className)}><Icon className="h-5 w-5" /></span>; };

function Info({ icon: Icon, label, value }) {
  return <div className="flex gap-3"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" /><div><p className="text-sm font-medium text-slate-800">{label}</p><p className="text-sm text-slate-500">{value}</p></div></div>;
}

function JobDetail({ job, onClose, onEdit, onChanged }) {
  const [tab, setTab] = useState("Overview");
  const [notes, setNotes] = useState(job.notes || "");
  const [saving, setSaving] = useState(false);
  const { data: cands } = useFetch(() => (tab === "Candidates" ? candidatesApi.list({ jobId: job._id, limit: 50 }) : Promise.resolve(null)), [tab, job._id]);

  const share = async () => {
    const url = `${window.location.origin}/jobs?id=${job._id}`;
    try { await navigator.clipboard.writeText(url); toast.success("Job link copied"); } catch { toast.info(url); }
  };
  const saveNotes = async () => {
    setSaving(true);
    try { await jobsApi.update(job._id, { notes }); toast.success("Notes saved"); onChanged(); } catch (e) { toast.error(getErrorMessage(e)); } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-start gap-3 p-5 pb-4">
        <JobIcon job={job} className="h-12 w-12" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-semibold text-slate-900">{job.title}</h2><StatusBadge status={job.status} /></div>
          <p className="text-sm text-slate-500">{job.code} • {job.department} • {job.type}</p>
        </div>
        <button onClick={onClose} aria-label="Close panel" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>
      <Tabs tabs={["Overview", "Candidates", "Interviewers", "Notes"]} value={tab} onChange={setTab} />

      {tab === "Overview" && (
        <div className="space-y-5 p-5">
          <div><h3 className="mb-1.5 text-sm font-semibold text-slate-900">Job Description</h3><p className="text-sm leading-relaxed text-slate-600">{job.description || "No description added yet."}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <Info icon={MapPin} label="Location" value={job.location} /><Info icon={Briefcase} label="Job Type" value={job.type} />
            <Info icon={BarChart3} label="Experience" value={experienceLabel(job.experienceMin, job.experienceMax)} /><Info icon={IndianRupee} label="Salary Range" value={salaryLabel(job.salaryMin, job.salaryMax)} />
            <Info icon={Building2} label="Department" value={job.department} /><Info icon={Users} label="Openings" value={job.openings} />
          </div>
          <div><h3 className="mb-2 text-sm font-semibold text-slate-900">Key Skills</h3><div className="flex flex-wrap gap-2">{job.skills?.length ? job.skills.map((s) => <Chip key={s} className="rounded-full px-3">{s}</Chip>) : <span className="text-sm text-slate-500">—</span>}</div></div>
          <div className="grid grid-cols-2 gap-3"><Button variant="outline" onClick={() => onEdit(job)}><Pencil className="h-4 w-4" /> Edit Job</Button><Button onClick={share}><Share2 className="h-4 w-4" /> Share Job</Button></div>
        </div>
      )}
      {tab === "Candidates" && (
        <div className="p-5">
          {!cands ? <p className="text-sm text-slate-500">Loading…</p> : cands.data.length === 0 ? <EmptyState icon={Users} title="No candidates yet" description="Candidates added to this job will appear here." className="py-8" /> : (
            <ul className="divide-y divide-slate-100">{cands.data.map((c) => <li key={c._id} className="flex items-center gap-3 py-3"><Avatar name={c.name} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{c.name}</p><p className="truncate text-xs text-slate-500">{c.email}</p></div><StageBadge stage={c.stage} /></li>)}</ul>
          )}
        </div>
      )}
      {tab === "Interviewers" && (
        <div className="p-5">{job.interviewers?.length ? <ul className="space-y-3">{job.interviewers.map((n) => <li key={n} className="flex items-center gap-3"><Avatar name={n} size="sm" /><span className="text-sm text-slate-800">{n}</span></li>)}</ul> : <p className="text-sm text-slate-500">No interviewers assigned. Edit the job to add some.</p>}</div>
      )}
      {tab === "Notes" && (
        <div className="space-y-3 p-5"><Textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about this position…" aria-label="Job notes" /><Button size="sm" onClick={saveNotes} loading={saving} disabled={notes === (job.notes || "")}>Save notes</Button></div>
      )}
    </div>
  );
}

export default function JobsPage() {
  const [params, setParams] = useSearchParams();
  const [f, setF] = useState({ search: "", department: "", status: "", page: 1, limit: 10 });
  const [selectedId, setSelectedId] = useState(params.get("id"));
  const [formState, setFormState] = useState({ open: params.get("new") === "1", job: null });
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const search = useDebounce(f.search);
  const set = (patch) => setF((s) => ({ ...s, page: 1, ...patch }));

  const { data, loading, error, reload } = useFetch(
    () => jobsApi.list({ search: search || undefined, department: f.department || undefined, status: f.status || undefined, page: f.page, limit: f.limit }),
    [search, f.department, f.status, f.page, f.limit]
  );

  useEffect(() => {
    if (params.get("new") === "1") setFormState({ open: true, job: null });
    if (params.get("id")) setSelectedId(params.get("id"));
    if (params.get("new") || params.get("id")) setParams({}, { replace: true });
  }, [params, setParams]);

  const rows = data?.data ?? [];
  const [fetched, setFetched] = useState(null);
  const inList = rows.find((j) => j._id === selectedId);
  useEffect(() => {
    if (!selectedId || inList) { setFetched(null); return; }
    jobsApi.get(selectedId).then(setFetched).catch(() => setSelectedId(null));
  }, [selectedId, inList]);
  const current = inList ?? (fetched?._id === selectedId ? fetched : null);
  const counts = data?.counts;
  const hasFilters = f.search || f.department || f.status;

  const setStatus = async (job, status) => {
    try { await jobsApi.update(job._id, { status }); toast.success(`Job set to ${status}`); reload(); } catch (e) { toast.error(getErrorMessage(e)); }
  };
  const doDelete = async () => {
    setBusy(true);
    try { await jobsApi.remove(toDelete._id); toast.success("Job deleted"); if (selectedId === toDelete._id) setSelectedId(null); setToDelete(null); reload(); }
    catch (e) { toast.error(getErrorMessage(e)); setToDelete(null); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Jobs" subtitle="Create and manage open positions" actions={<Button size="lg" onClick={() => setFormState({ open: true, job: null })}><Plus className="h-5 w-5" /> Create Job</Button>} />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Briefcase} label="Total Jobs" value={counts?.total ?? "–"} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={CheckCircle2} label="Active Jobs" value={counts?.Active ?? "–"} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={PauseCircle} label="On Hold" value={counts?.["On Hold"] ?? "–"} tone="bg-amber-50 text-amber-600" />
        <StatCard icon={CircleX} label="Closed" value={counts?.Closed ?? "–"} tone="bg-red-50 text-red-500" />
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={f.search} onChange={(e) => set({ search: e.target.value })} placeholder="Search by job title, department…" aria-label="Search jobs" className="min-w-56 flex-1 sm:max-w-md" />
        <Select value={f.department} onChange={(e) => set({ department: e.target.value })} wrapperClassName="w-full sm:w-52" aria-label="Filter by department"><option value="">All Departments</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select>
        <Select value={f.status} onChange={(e) => set({ status: e.target.value })} wrapperClassName="w-full sm:w-44" aria-label="Filter by status"><option value="">All Status</option>{JOB_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
        {hasFilters && <Button variant="ghost" onClick={() => set({ search: "", department: "", status: "" })}>Clear Filters</Button>}
      </div>

      <div className={cn("grid gap-5", current && panelGridClass)}>
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          {error && !data ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <TableSkeleton /> : rows.length === 0 ? (
            <EmptyState icon={Briefcase} title={hasFilters ? "No jobs match your filters" : "No jobs yet"} description={hasFilters ? "Try changing or clearing the filters." : "Create your first position to start hiring."}
              action={!hasFilters && <Button onClick={() => setFormState({ open: true, job: null })}><Plus className="h-4 w-4" /> Create Job</Button>} />
          ) : (
            <div className={cn("overflow-x-auto transition-opacity", loading && "opacity-60")}>
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500"><tr>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">#</th><th className="px-3 py-3 font-medium">Job Title</th><th className="hidden px-3 py-3 font-medium lg:table-cell">Department</th>
                  <th className="hidden px-3 py-3 font-medium lg:table-cell">Location</th><th className="px-3 py-3 font-medium">Candidates</th><th className="px-3 py-3 font-medium">Status</th>
                  <th className="hidden px-3 py-3 font-medium md:table-cell">Created On</th><th className="px-3 py-3 text-right font-medium">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((j, idx) => (
                    <tr key={j._id} onClick={() => setSelectedId(j._id)} className={cn("cursor-pointer hover:bg-slate-50", j._id === selectedId && "bg-indigo-50/50")}>
                      <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{(f.page - 1) * f.limit + idx + 1}</td>
                      <td className="px-3 py-3"><div className="flex items-center gap-3"><JobIcon job={j} className="h-10 w-10" /><div><p className="font-medium text-slate-900">{j.title}</p><p className="text-xs text-slate-500">{j.code}</p></div></div></td>
                      <td className="hidden px-3 py-3 text-slate-700 lg:table-cell">{j.department}</td>
                      <td className="hidden px-3 py-3 text-slate-700 lg:table-cell"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{j.location}</span></td>
                      <td className="px-3 py-3 text-slate-700"><span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-slate-400" />{j.candidateCount}</span></td>
                      <td className="px-3 py-3"><StatusBadge status={j.status} /></td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-slate-600 md:table-cell">{formatDate(j.createdAt)}</td>
                      <td className="px-3 py-3 text-right">
                        <Popover trigger={({ toggle }) => <button onClick={toggle} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label={`Actions for ${j.title}`}><MoreVertical className="h-4 w-4" /></button>}>
                          {(close) => (<>
                            <MenuItem icon={PenLine} onClick={() => { close(); setFormState({ open: true, job: j }); }}>Edit</MenuItem>
                            {JOB_STATUSES.filter((s) => s !== j.status).map((s) => <MenuItem key={s} icon={Layers} onClick={() => { close(); setStatus(j, s); }}>Mark as {s}</MenuItem>)}
                            <MenuItem icon={Trash2} danger onClick={() => { close(); setToDelete(j); }}>Delete</MenuItem>
                          </>)}
                        </Popover>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data && rows.length > 0 && <Pagination page={data.page} pages={data.pages} total={data.total} limit={f.limit} onPage={(p) => setF((s) => ({ ...s, page: p }))} onLimit={(l) => set({ limit: l })} label="jobs" />}
        </section>

        <DetailPanel open={!!current} onClose={() => setSelectedId(null)}>
          {current && <JobDetail key={current._id} job={current} onClose={() => setSelectedId(null)} onEdit={(job) => setFormState({ open: true, job })} onChanged={() => { reload(); setFetched(null); }} />}
        </DetailPanel>
      </div>

      <JobForm open={formState.open} job={formState.job} onClose={() => setFormState({ open: false, job: null })} onSaved={(j) => { reload(); setFetched(null); if (!formState.job) setSelectedId(j._id); }} />
      <ConfirmDialog open={!!toDelete} loading={busy} title="Delete job?" description={`This permanently removes “${toDelete?.title}”. Jobs that still have candidates can't be deleted — set them to Closed instead.`} onConfirm={doDelete} onClose={() => setToDelete(null)} />
    </>
  );
}
