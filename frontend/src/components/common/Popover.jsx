// src/components/common/Popover.jsx
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * <Popover trigger={({ toggle, open }) => <button onClick={toggle}>…</button>}>
 *   {(close) => <MenuItem onClick={() => { …; close(); }}>…</MenuItem>}
 * </Popover>
 */
export default function Popover({ trigger, children, align = "right", className, panelClassName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const toggle = (e) => { e?.stopPropagation(); setOpen((o) => !o); };
  const close = () => setOpen(false);

  return (
    <div ref={ref} className={cn("relative inline-block", className)} onClick={(e) => e.stopPropagation()}>
      {trigger({ toggle, open })}
      {open && (
        <div className={cn("absolute z-40 mt-2 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl", align === "right" ? "right-0" : "left-0", panelClassName)}>
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon: Icon, danger, active, className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50",
        active && "bg-indigo-50 font-medium text-indigo-700", className
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      {children}
    </button>
  );
}
