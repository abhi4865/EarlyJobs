// src/pages/PipelinePage.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Clock, Columns3, Eye, MoreVertical, Pencil, Plus, Table2, Trash2, CalendarPlus, Link2 } from "lucide-react";
import { candidatesApi, jobsApi } from "@/api/services";
import { getErrorMessage } from "@/api/client";
import { useDebounce, useFetch } from "@/hooks";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";
import { formatDate, timeAgo } from "@/lib/format";
import { stageIcon } from "@/lib/stageIcons";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { SearchInput, Select } from "@/components/common/Fields";
import { useEscape, useLockBodyScroll } from "@/components/common/Modal";
import Popover, { MenuItem } from "@/components/common/Popover";
import { ErrorState, Skeleton } from "@/components/common/States";
import { StageBadge } from "@/components/common/Badges";
import PageHeader from "@/components/common/PageHeader";
import CandidateDetail from "@/components/candidates/CandidateDetail";
import CandidateForm from "@/components/candidates/CandidateForm";
import InterviewForm from "@/components/interviews/InterviewForm";

function StageMenu({ candidate, onMove, onView, onEdit, onSchedule, onDelete }) {
  const { stages } = useSettings();
  return (
    <Popover panelClassName="w-52"
      trigger={({ toggle }) => <button onClick={toggle} aria-label={`Actions for ${candidate.name}`} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><MoreVertical className="h-4 w-4" /></button>}>
      {(close) => (<>
        <MenuItem icon={Eye} onClick={() => { close(); onView(candidate); }}>View details</MenuItem>
        <MenuItem icon={Pencil} onClick={() => { close(); onEdit(candidate); }}>Edit</MenuItem>
        <MenuItem icon={CalendarPlus} onClick={() => { close(); onSchedule(candidate); }}>Schedule interview</MenuItem>
        <p className="px-3 pb-1 pt-2 text-xs font-medium text-slate-400">Change Stage</p>
        {stages.map((s) => { const Icon = stageIcon(s.name); return (
          <MenuItem key={s._id} active={s.name === candidate.stage} onClick={() => { close(); onMove(candidate, s.name); }}>
            <Icon className="h-4 w-4" style={{ color: s.color }} aria-hidden /> {s.name}
          </MenuItem>); })}
        <div className="my-1 border-t border-slate-100" />
        <MenuItem icon={Trash2} danger onClick={() => { close(); onDelete(candidate); }}>Delete</MenuItem>
      </>)}
    </Popover>
  );
}

export default function PipelinePage() {
  const [params, setParams] = useSearchParams();
  const { stages, stageNames, sourceNames } = useSettings();
  const [view, setView] = useState(params.get("view") === "table" ? "table" : "kanban");
  const [f, setF] = useState({ search: "", jobId: "", source: "" });
  const [selectedId, setSelectedId] = useState(null);
  const [formState, setFormState] = useState({ open: false, candidate: null, stage: undefined });
  const [scheduleFor, setScheduleFor] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);
  const search = useDebounce(f.search);

  const { data, setData, loading, error, reload } = useFetch(
    () => candidatesApi.list({ search: search || undefined, jobId: f.jobId || undefined, source: f.source || undefined, limit: 500, sort: "appliedOn", order: "desc" }),
    [search, f.jobId, f.source]
  );
  const { data: jobsData } = useFetch(() => jobsApi.list({ limit: 100 }), []);
  useEffect(() => { if (params.get("view")) setParams({}, { replace: true }); }, [params, setParams]);

  const items = data?.data ?? [];
  const current = items.find((c) => c._id === selectedId);
  const hasFilters = f.search || f.jobId || f.source;

  // Optimistic stage change with rollback
  const move = async (candidate, stage) => {
    if (candidate.stage === stage) return;
    const prev = data;
    setData((d) => ({ ...d, data: d.data.map((c) => (c._id === candidate._id ? { ...c, stage } : c)) }));
    try { await candidatesApi.setStage(candidate._id, stage); toast.success(`${candidate.name} moved to ${stage}`); reload(); }
    catch (e) { setData(prev); toast.error(getErrorMessage(e)); }
  };

  const doDelete = async () => {
    setBusy(true);
    try { await candidatesApi.remove(toDelete._id); toast.success("Candidate deleted"); if (selectedId === toDelete._id) setSelectedId(null); setToDelete(null); reload(); }
    catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  const menuProps = { onMove: move, onView: (c) => setSelectedId(c._id), onEdit: (c) => setFormState({ open: true, candidate: c }), onSchedule: setScheduleFor, onDelete: setToDelete };

  return (
    <>
      <PageHeader title="Hiring Pipeline" subtitle="Manage candidates across different hiring stages"
        actions={<>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="View">
            {[["kanban", Columns3, "Kanban"], ["table", Table2, "Table"]].map(([k, Icon, label]) => (
              <button key={k} onClick={() => setView(k)} aria-pressed={view === k} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium", view === k ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50")}><Icon className="h-4 w-4" />{label}</button>
            ))}
          </div>
          <Button size="lg" onClick={() => setFormState({ open: true, candidate: null })}><Plus className="h-5 w-5" /> Add Candidate</Button>
        </>} />

      <div className="mb-5 flex flex-wrap gap-3">
        <SearchInput value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} placeholder="Search candidates…" aria-label="Search candidates" className="min-w-56 flex-1 sm:max-w-sm" />
        <Select value={f.jobId} onChange={(e) => setF({ ...f, jobId: e.target.value })} wrapperClassName="w-full sm:w-48" aria-label="Filter by job"><option value="">All Jobs</option>{jobsData?.data.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}</Select>
        <Select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} wrapperClassName="w-full sm:w-44" aria-label="Filter by source"><option value="">All Sources</option>{sourceNames.map((s) => <option key={s}>{s}</option>)}</Select>
        {hasFilters && <Button variant="ghost" onClick={() => setF({ search: "", jobId: "", source: "" })}>Clear Filters</Button>}
      </div>

      {error && !data ? <ErrorState message={error} onRetry={reload} /> : !data ? (
        <div className="flex gap-4 overflow-hidden">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-2xl" />)}</div>
      ) : view === "kanban" ? (
        <div className={cn("-mx-1 flex gap-4 overflow-x-auto px-1 pb-4 transition-opacity", loading && "opacity-70")}>
          {stages.map((s) => {
            const col = items.filter((c) => c.stage === s.name);
            const Icon = stageIcon(s.name);
            return (
              <section key={s._id} aria-label={`${s.name} column`}
                onDragOver={(e) => { e.preventDefault(); setOverStage(s.name); }} onDragLeave={() => setOverStage((o) => (o === s.name ? null : o))}
                onDrop={(e) => { e.preventDefault(); setOverStage(null); const c = items.find((x) => x._id === dragId); if (c) move(c, s.name); setDragId(null); }}
                className={cn("flex w-72 shrink-0 flex-col rounded-2xl border bg-white/60 transition-colors", overStage === s.name ? "border-indigo-400 bg-indigo-50/40" : "border-slate-200/70")}>
                <header className="flex items-center gap-2 rounded-t-2xl px-4 py-3" style={{ backgroundColor: `${s.color}1a` }}>
                  <Icon className="h-5 w-5" style={{ color: s.color }} aria-hidden />
                  <h2 className="font-semibold" style={{ color: `color-mix(in srgb, ${s.color} 75%, black)` }}>{s.name}</h2>
                  <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-700">{col.length}</span>
                </header>
                <ul className="flex min-h-24 flex-1 flex-col gap-3 p-3">
                  {col.map((c) => (
                    <li key={c._id} draggable onDragStart={(e) => { setDragId(c._id); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      onClick={() => setSelectedId(c._id)}
                      className={cn("group cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-300 active:cursor-grabbing", dragId === c._id && "opacity-40", selectedId === c._id && "border-indigo-400 ring-2 ring-indigo-500/20")}>
                      <div className="flex items-start gap-2.5">
                        <Avatar name={c.name} size="sm" />
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{c.name}</p><p className="truncate text-xs text-slate-500">{c.job?.title}</p></div>
                        <StageMenu candidate={c} {...menuProps} />
                      </div>
                      <div className="mt-2.5 space-y-1 text-xs text-slate-500">
                        <p className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" />{c.source}</p>
                        <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{timeAgo(c.appliedOn)}</p>
                      </div>
                    </li>
                  ))}
                  {col.length === 0 && <li className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">Drop candidates here</li>}
                </ul>
                <button onClick={() => setFormState({ open: true, candidate: null, stage: s.name })} className="m-3 mt-0 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
                  <Plus className="h-4 w-4" /> Add Candidate
                </button>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3 font-medium">Name</th><th className="px-3 py-3 font-medium">Job Position</th><th className="px-3 py-3 font-medium">Stage</th><th className="hidden px-3 py-3 font-medium md:table-cell">Source</th><th className="hidden px-3 py-3 font-medium md:table-cell">Applied On</th><th className="px-3 py-3" /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((c) => (
                  <tr key={c._id} onClick={() => setSelectedId(c._id)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={c.name} size="sm" /><div><p className="font-medium text-slate-900">{c.name}</p><p className="text-xs text-slate-500">{c.email}</p></div></div></td>
                    <td className="px-3 py-3 text-slate-700">{c.job?.title}</td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2"><StageBadge stage={c.stage} />
                        <Select value={c.stage} onChange={(e) => move(c, e.target.value)} aria-label={`Change stage for ${c.name}`} wrapperClassName="w-32" className="h-8 py-0 text-xs">{stageNames.map((s) => <option key={s}>{s}</option>)}</Select></div>
                    </td>
                    <td className="hidden px-3 py-3 text-slate-700 md:table-cell">{c.source}</td>
                    <td className="hidden whitespace-nowrap px-3 py-3 text-slate-600 md:table-cell">{formatDate(c.appliedOn)}</td>
                    <td className="px-3 py-3 text-right"><StageMenu candidate={c} {...menuProps} /></td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-500">No candidates match your filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Drawer for details (always overlay here so the board keeps its width) */}
      {current && <DrawerHost onClose={() => setSelectedId(null)}>
        <CandidateDetail key={current._id} candidate={current} onClose={() => setSelectedId(null)} onChanged={reload}
          onEdit={(c) => setFormState({ open: true, candidate: c })} onDelete={setToDelete} onSchedule={setScheduleFor} />
      </DrawerHost>}

      <CandidateForm open={formState.open} candidate={formState.candidate} defaultStage={formState.stage} onClose={() => setFormState({ open: false, candidate: null })} onSaved={reload} />
      <InterviewForm open={!!scheduleFor} candidate={scheduleFor} onClose={() => setScheduleFor(null)} onSaved={reload} />
      <ConfirmDialog open={!!toDelete} loading={busy} title="Delete candidate?" description={`This permanently removes ${toDelete?.name} and any interviews linked to them. This can't be undone.`} onConfirm={doDelete} onClose={() => setToDelete(null)} />
    </>
  );
}

// Slide-over used on every screen size for this page
function DrawerHost({ onClose, children }) {
  useLockBodyScroll(true);
  useEscape(true, onClose);
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white shadow-2xl">{children}</aside>
    </div>,
    document.body
  );
}
