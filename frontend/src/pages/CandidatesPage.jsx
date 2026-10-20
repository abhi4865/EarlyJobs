// src/pages/CandidatesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowUp, CalendarPlus, Eye, MoreHorizontal, Pencil, Plus, Trash2, Users, UserPlus, X, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { candidatesApi, jobsApi } from "@/api/services";
import { getErrorMessage } from "@/api/client";
import { useDebounce, useFetch } from "@/hooks";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { stageIcon } from "@/lib/stageIcons";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import DetailPanel, { panelGridClass } from "@/components/common/DetailPanel";
import { Checkbox, SearchInput, Select } from "@/components/common/Fields";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import Popover, { MenuItem } from "@/components/common/Popover";
import StatCard from "@/components/common/StatCard";
import { StageBadge } from "@/components/common/Badges";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/States";
import CandidateDetail from "@/components/candidates/CandidateDetail";
import CandidateForm from "@/components/candidates/CandidateForm";
import InterviewForm from "@/components/interviews/InterviewForm";

function SortHead({ label, field, sort, order, onSort, className }) {
  const active = sort === field;
  return (
    <th className={cn("px-3 py-3 font-medium", className)} aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}>
      <button onClick={() => onSort(field)} className="inline-flex items-center gap-1 hover:text-slate-800">
        {label} {active && (order === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );
}

export default function CandidatesPage() {
  const [params, setParams] = useSearchParams();
  const { stages, stageNames, sourceNames } = useSettings();
  const [f, setF] = useState({ search: params.get("search") || "", jobId: "", stage: "", source: "", sort: "appliedOn", order: "desc", page: 1, limit: 10 });
  const [selectedId, setSelectedId] = useState(params.get("id"));
  const [checked, setChecked] = useState(new Set());
  const [formState, setFormState] = useState({ open: false, candidate: null });
  const [scheduleFor, setScheduleFor] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const search = useDebounce(f.search);
  const set = (patch) => setF((s) => ({ ...s, page: 1, ...patch }));
  const { data, loading, error, reload } = useFetch(
    () => candidatesApi.list({ search: search || undefined, jobId: f.jobId || undefined, stage: f.stage || undefined, source: f.source || undefined, sort: f.sort, order: f.order, page: f.page, limit: f.limit }),
    [search, f.jobId, f.stage, f.source, f.sort, f.order, f.page, f.limit]
  );
  const { data: jobsData } = useFetch(() => jobsApi.list({ limit: 100 }), []);

  // Pick up ?search= / ?id= when navigating from the global search
  useEffect(() => {
    const s = params.get("search"); const id = params.get("id");
    if (s !== null) setF((x) => ({ ...x, search: s, page: 1 }));
    if (id) setSelectedId(id);
    if (s !== null || id) setParams({}, { replace: true });
  }, [params, setParams]);

  const rows = data?.data ?? [];
  const selected = useMemo(() => rows.find((c) => c._id === selectedId) ?? null, [rows, selectedId]);
  const [fetched, setFetched] = useState(null);
  // A candidate opened via link may not be on the current page — fetch it directly
  useEffect(() => {
    if (!selectedId || selected) { setFetched(null); return; }
    candidatesApi.get(selectedId).then(setFetched).catch(() => setSelectedId(null));
  }, [selectedId, selected]);
  const current = selected ?? (fetched?._id === selectedId ? fetched : null);

  const sortBy = (field) => set({ sort: field, order: f.sort === field && f.order === "desc" ? "asc" : "desc", page: f.page });
  const hasFilters = f.search || f.jobId || f.stage || f.source;
  const allChecked = rows.length > 0 && rows.every((r) => checked.has(r._id));
  const toggleAll = () => setChecked(allChecked ? new Set() : new Set(rows.map((r) => r._id)));
  const toggleOne = (id) => setChecked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const refreshed = () => { reload(); };

  const doDelete = async () => {
    setBusy(true);
    try {
      const ids = toDelete.ids;
      await Promise.all(ids.map((id) => candidatesApi.remove(id)));
      toast.success(ids.length > 1 ? `${ids.length} candidates deleted` : "Candidate deleted");
      setChecked(new Set()); if (ids.includes(selectedId)) setSelectedId(null);
      setToDelete(null); reload();
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  const bulkStage = async (stage, close) => {
    close();
    try { await Promise.all([...checked].map((id) => candidatesApi.setStage(id, stage))); toast.success(`Moved ${checked.size} to ${stage}`); setChecked(new Set()); reload(); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="Candidates" subtitle="Manage all your candidates in one place"
        actions={<Button size="lg" onClick={() => setFormState({ open: true, candidate: null })}><Plus className="h-5 w-5" /> Add Candidate</Button>} />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput value={f.search} onChange={(e) => set({ search: e.target.value })} placeholder="Search by name, email, or keyword…" aria-label="Search candidates" className="min-w-56 flex-1" />
        <Select value={f.jobId} onChange={(e) => set({ jobId: e.target.value })} wrapperClassName="w-full sm:w-48" aria-label="Filter by job"><option value="">All Jobs</option>{jobsData?.data.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}</Select>
        <Select value={f.stage} onChange={(e) => set({ stage: e.target.value })} wrapperClassName="w-full sm:w-44" aria-label="Filter by stage"><option value="">All Stages</option>{stageNames.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select value={f.source} onChange={(e) => set({ source: e.target.value })} wrapperClassName="w-full sm:w-44" aria-label="Filter by source"><option value="">All Sources</option>{sourceNames.map((s) => <option key={s}>{s}</option>)}</Select>
        {hasFilters && <Button variant="ghost" onClick={() => set({ search: "", jobId: "", stage: "", source: "" })}>Clear Filters</Button>}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        <StatCard icon={Users} label="Total Candidates" value={data?.counts.total ?? "–"} tone="bg-blue-50 text-blue-600" onClick={() => set({ stage: "" })} active={!f.stage} className="p-3" />
        {stages.map((s) => (
          <StatCard key={s._id} icon={stageIcon(s.name)} label={s.name} value={data?.counts[s.name] ?? "–"} color={s.color} active={f.stage === s.name} onClick={() => set({ stage: f.stage === s.name ? "" : s.name })} className="p-3" />
        ))}
      </div>

      <div className={cn("grid gap-5", current && panelGridClass)}>
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          {checked.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 bg-indigo-50 px-4 py-2.5 text-sm">
              <span className="font-medium text-indigo-700">{checked.size} selected</span>
              <Popover align="left" trigger={({ toggle }) => <Button size="sm" variant="outline" onClick={toggle}><ArrowRightLeft className="h-4 w-4" /> Move to stage</Button>}>
                {(close) => stageNames.map((s) => <MenuItem key={s} onClick={() => bulkStage(s, close)}>{s}</MenuItem>)}
              </Popover>
              <Button size="sm" variant="danger-outline" onClick={() => setToDelete({ ids: [...checked], label: `${checked.size} candidates` })}><Trash2 className="h-4 w-4" /> Delete</Button>
              <button className="ml-auto text-slate-500 hover:text-slate-800" onClick={() => setChecked(new Set())} aria-label="Clear selection"><X className="h-4 w-4" /></button>
            </div>
          )}
          {error && !data ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <TableSkeleton /> : rows.length === 0 ? (
            <EmptyState icon={UserPlus} title={hasFilters ? "No candidates match your filters" : "No candidates yet"} description={hasFilters ? "Try changing or clearing the filters." : "Add your first candidate to start building your pipeline."}
              action={hasFilters ? <Button variant="outline" onClick={() => set({ search: "", jobId: "", stage: "", source: "" })}>Clear filters</Button> : <Button onClick={() => setFormState({ open: true, candidate: null })}><Plus className="h-4 w-4" /> Add Candidate</Button>} />
          ) : (
            <div className={cn("overflow-x-auto transition-opacity", loading && "opacity-60")}>
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="w-10 px-4 py-3"><Checkbox checked={allChecked} onChange={toggleAll} aria-label="Select all on this page" /></th>
                    <th className="hidden px-2 py-3 font-medium md:table-cell">#</th>
                    <SortHead label="Name" field="name" {...{ sort: f.sort, order: f.order, onSort: sortBy }} />
                    <SortHead label="Job Position" field="job" className="hidden lg:table-cell" {...{ sort: f.sort, order: f.order, onSort: sortBy }} />
                    <SortHead label="Stage" field="stage" {...{ sort: f.sort, order: f.order, onSort: sortBy }} />
                    <th className="hidden px-3 py-3 font-medium xl:table-cell">Source</th>
                    <SortHead label="Applied On" field="appliedOn" className="hidden md:table-cell" {...{ sort: f.sort, order: f.order, onSort: sortBy }} />
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((c, idx) => (
                    <tr key={c._id} onClick={() => setSelectedId(c._id)} className={cn("cursor-pointer hover:bg-slate-50", c._id === selectedId && "bg-indigo-50/50")}>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={checked.has(c._id)} onChange={() => toggleOne(c._id)} aria-label={`Select ${c.name}`} /></td>
                      <td className="hidden px-2 py-3 text-slate-500 md:table-cell">{(f.page - 1) * f.limit + idx + 1}</td>
                      <td className="px-3 py-3"><div className="flex items-center gap-3"><Avatar name={c.name} size="sm" /><div className="min-w-0"><p className="truncate font-medium text-slate-900">{c.name}</p><p className="truncate text-xs text-slate-500">{c.email}</p></div></div></td>
                      <td className="hidden px-3 py-3 text-slate-700 lg:table-cell">{c.job?.title}</td>
                      <td className="px-3 py-3"><StageBadge stage={c.stage} /></td>
                      <td className="hidden px-3 py-3 text-slate-700 xl:table-cell">{c.source}</td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-slate-600 md:table-cell">{formatDate(c.appliedOn)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1 text-slate-500">
                          <button className="rounded-lg p-1.5 hover:bg-slate-100" aria-label={`View ${c.name}`} onClick={(e) => { e.stopPropagation(); setSelectedId(c._id); }}><Eye className="h-4 w-4" /></button>
                          <button className="rounded-lg p-1.5 hover:bg-slate-100" aria-label={`Edit ${c.name}`} onClick={(e) => { e.stopPropagation(); setFormState({ open: true, candidate: c }); }}><Pencil className="h-4 w-4" /></button>
                          <Popover trigger={({ toggle }) => <button onClick={toggle} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label={`More actions for ${c.name}`}><MoreHorizontal className="h-4 w-4" /></button>}>
                            {(close) => (<>
                              <MenuItem icon={CalendarPlus} onClick={() => { close(); setScheduleFor(c); }}>Schedule interview</MenuItem>
                              <MenuItem icon={Trash2} danger onClick={() => { close(); setToDelete({ ids: [c._id], label: c.name }); }}>Delete</MenuItem>
                            </>)}
                          </Popover>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data && rows.length > 0 && <Pagination page={data.page} pages={data.pages} total={data.total} limit={f.limit} onPage={(p) => setF((s) => ({ ...s, page: p }))} onLimit={(l) => set({ limit: l })} label="candidates" />}
        </section>

        <DetailPanel open={!!current} onClose={() => setSelectedId(null)}>
          {current && (
            <CandidateDetail key={current._id} candidate={current} onClose={() => setSelectedId(null)}
              onChanged={() => { refreshed(); if (fetched) candidatesApi.get(current._id).then(setFetched); }}
              onEdit={(c) => setFormState({ open: true, candidate: c })} onDelete={(c) => setToDelete({ ids: [c._id], label: c.name })} onSchedule={setScheduleFor} />
          )}
        </DetailPanel>
      </div>

      <CandidateForm open={formState.open} candidate={formState.candidate} onClose={() => setFormState({ open: false, candidate: null })} onSaved={(c) => { reload(); if (formState.candidate) setFetched(null); else setSelectedId(c._id); }} />
      <InterviewForm open={!!scheduleFor} candidate={scheduleFor} onClose={() => setScheduleFor(null)} onSaved={reload} />
      <ConfirmDialog open={!!toDelete} loading={busy} title="Delete candidate?" description={`This permanently removes ${toDelete?.label} and any interviews linked to them. This can't be undone.`} onConfirm={doDelete} onClose={() => setToDelete(null)} />
    </>
  );
}
