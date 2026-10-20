// src/components/common/DetailPanel.jsx
// Inline column on wide screens (xl+), slide-over drawer on smaller screens.
import { createPortal } from "react-dom";
import { useMediaQuery } from "@/hooks";
import { useEscape, useLockBodyScroll } from "./Modal";

export default function DetailPanel({ open, onClose, children }) {
  const wide = useMediaQuery("(min-width: 1280px)");
  useLockBodyScroll(open && !wide);
  useEscape(open && !wide, onClose);
  if (!open) return null;

  if (wide) {
    return (
      <aside className="sticky top-24 max-h-[calc(100vh-7rem)] self-start overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {children}
      </aside>
    );
  }
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white shadow-2xl">{children}</aside>
    </div>,
    document.body
  );
}

export const panelGridClass = "xl:grid-cols-[minmax(0,1fr)_24rem]";
