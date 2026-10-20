// src/components/common/Fields.jsx
import { forwardRef } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-lg border bg-white text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export function Field({ label, error, hint, required, className, children, htmlFor }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="text-xs text-red-600" role="alert">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ className, invalid, ...props }, ref) {
  return <input ref={ref} className={cn(base, "h-10 px-3", invalid ? "border-red-400" : "border-slate-200", className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, invalid, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(base, "resize-y px-3 py-2", invalid ? "border-red-400" : "border-slate-200", className)} {...props} />;
});

export const Select = forwardRef(function Select({ className, invalid, wrapperClassName, children, ...props }, ref) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select ref={ref} className={cn(base, "h-10 appearance-none pl-3 pr-9", invalid ? "border-red-400" : "border-slate-200", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
    </div>
  );
});

export function SearchInput({ className, ...props }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input type="search" className={cn(base, "h-10 border-slate-200 pl-9 pr-3")} {...props} />
    </div>
  );
}

export function Checkbox({ className, ...props }) {
  return <input type="checkbox" className={cn("h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500", className)} {...props} />;
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50", checked ? "bg-indigo-600" : "bg-slate-300")}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}
