// src/components/layout/GlobalSearch.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Loader2, Search } from "lucide-react";
import { candidatesApi, jobsApi } from "@/api/services";
import { useDebounce } from "@/hooks";
import Avatar from "@/components/common/Avatar";

export default function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState({ candidates: [], jobs: [] });
  const term = useDebounce(q.trim(), 300);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (term.length < 2) { setRes({ candidates: [], jobs: [] }); return; }
    let live = true;
    setLoading(true);
    Promise.all([candidatesApi.list({ search: term, limit: 4 }), jobsApi.list({ search: term, limit: 4 })])
      .then(([c, j]) => live && setRes({ candidates: c.data, jobs: j.data }))
      .catch(() => live && setRes({ candidates: [], jobs: [] }))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [term]);

  useEffect(() => {
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (to) => { setOpen(false); setQ(""); navigate(to); };
  const submit = (e) => { e.preventDefault(); if (q.trim()) go(`/candidates?search=${encodeURIComponent(q.trim())}`); };
  const empty = !res.candidates.length && !res.jobs.length;

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <form onSubmit={submit} role="search">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-400" aria-hidden />
        <input
          value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          placeholder="Search candidates, jobs, or keywords…" aria-label="Global search"
          className="h-11 w-full rounded-xl border border-transparent bg-indigo-50/60 pl-11 pr-4 text-sm placeholder:text-slate-500 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </form>
      {open && term.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          {loading && <p className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</p>}
          {!loading && empty && <p className="px-3 py-3 text-sm text-slate-500">No results for “{term}”.</p>}
          {res.candidates.length > 0 && <p className="px-3 pb-1 pt-2 text-xs font-medium text-slate-400">Candidates</p>}
          {res.candidates.map((c) => (
            <button key={c._id} onClick={() => go(`/candidates?id=${c._id}`)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50">
              <Avatar name={c.name} size="sm" />
              <span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800">{c.name}</span><span className="block truncate text-xs text-slate-500">{c.job?.title}</span></span>
            </button>
          ))}
          {res.jobs.length > 0 && <p className="px-3 pb-1 pt-2 text-xs font-medium text-slate-400">Jobs</p>}
          {res.jobs.map((j) => (
            <button key={j._id} onClick={() => go(`/jobs?id=${j._id}`)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Briefcase className="h-4 w-4" /></span>
              <span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800">{j.title}</span><span className="block truncate text-xs text-slate-500">{j.department} • {j.code}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
