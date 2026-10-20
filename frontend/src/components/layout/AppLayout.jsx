// src/components/layout/AppLayout.jsx
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { SettingsProvider } from "@/context/SettingsContext";
import { useEscape, useLockBodyScroll } from "@/components/common/Modal";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  useLockBodyScroll(menuOpen);
  useEscape(menuOpen, () => setMenuOpen(false));
  useEffect(() => { setMenuOpen(false); window.scrollTo({ top: 0 }); }, [pathname]);

  return (
    <SettingsProvider>
      <div className="min-h-screen bg-slate-50">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block"><Sidebar /></aside>

        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMenuOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-2xl">
              <Sidebar onNavigate={() => setMenuOpen(false)} />
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="absolute right-3 top-6 rounded-lg p-1.5 text-slate-300 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
          </div>
        )}

        <div className="lg:pl-64">
          <Header onMenu={() => setMenuOpen(true)} />
          <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
        </div>
      </div>
    </SettingsProvider>
  );
}
