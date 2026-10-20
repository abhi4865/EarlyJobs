// src/components/common/Tabs.jsx
import { cn } from "@/lib/utils";

export default function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn("flex gap-5 overflow-x-auto border-b border-slate-200 px-5", className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t} role="tab" aria-selected={value === t} onClick={() => onChange(t)}
          className={cn("-mb-px whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors",
            value === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800")}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
