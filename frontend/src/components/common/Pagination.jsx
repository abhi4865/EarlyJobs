// src/components/common/Pagination.jsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_SIZES } from "@/lib/constants";
import { Select } from "./Fields";

function windowPages(page, pages) {
  const size = Math.min(5, pages);
  let start = Math.max(1, page - Math.floor(size / 2));
  start = Math.min(start, pages - size + 1);
  return Array.from({ length: size }, (_, i) => start + i);
}

export default function Pagination({ page, pages, total, limit, onPage, onLimit, label = "items" }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const btn = "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:opacity-40";
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <p className="text-sm text-slate-500">Showing {from} to {to} of {total} {label}</p>
      <div className="flex items-center gap-3">
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button className={cn(btn, "text-slate-500 hover:bg-slate-100")} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
          {windowPages(page, pages).map((p) => (
            <button key={p} onClick={() => onPage(p)} aria-current={p === page ? "page" : undefined}
              className={cn(btn, p === page ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50")}>{p}</button>
          ))}
          <button className={cn(btn, "text-slate-500 hover:bg-slate-100")} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
        </nav>
        {onLimit && (
          <Select value={limit} onChange={(e) => onLimit(Number(e.target.value))} className="h-9 w-32" aria-label="Rows per page">
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} per page</option>)}
          </Select>
        )}
      </div>
    </div>
  );
}
