// src/components/common/StatCard.jsx
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, trend, sublabel, tone = "bg-indigo-50 text-indigo-600", color, onClick, active, className }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick} aria-pressed={onClick ? !!active : undefined}
      className={cn("flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition",
        active ? "border-indigo-400 ring-2 ring-indigo-500/20" : "border-slate-200/70", onClick && "hover:border-indigo-300", className)}
    >
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", !color && tone)} style={color ? { backgroundColor: `${color}1f`, color } : undefined}>
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-500">{label}</p>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-3xl font-semibold leading-tight text-slate-900">{value}</p>
          {trend != null && (
            <span className={cn("inline-flex items-center text-sm font-medium", trend >= 0 ? "text-emerald-600" : "text-red-500")}>
              {trend >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}{Math.abs(trend)}%
            </span>
          )}
        </div>
        {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
      </div>
    </Comp>
  );
}
