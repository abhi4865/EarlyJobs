// src/components/common/Badges.jsx
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

/** Stage badge coloured from the (editable) stage colour in Settings */
export function StageBadge({ stage, className }) {
  const { stageColor } = useSettings();
  const c = stageColor(stage);
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}
      style={{ backgroundColor: `${c}1f`, color: `color-mix(in srgb, ${c} 75%, black)` }}
    >
      {stage}
    </span>
  );
}

const STATUS = {
  Active: "bg-emerald-50 text-emerald-700", "On Hold": "bg-amber-50 text-amber-700", Closed: "bg-red-50 text-red-600",
  Scheduled: "bg-sky-50 text-sky-700", "In Progress": "bg-violet-50 text-violet-700",
  Completed: "bg-emerald-50 text-emerald-700", Cancelled: "bg-slate-100 text-slate-600",
};
export function StatusBadge({ status, className }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS[status] ?? "bg-slate-100 text-slate-600", className)}>{status}</span>;
}

export function Chip({ children, className }) {
  return <span className={cn("inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600", className)}>{children}</span>;
}
