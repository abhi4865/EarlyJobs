// src/components/layout/Header.jsx
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu, Plus, Settings, CheckCheck } from "lucide-react";
import { notificationsApi } from "@/api/services";
import { useAuth } from "@/context/AuthContext";
import { timeAgo } from "@/lib/format";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import Popover, { MenuItem } from "@/components/common/Popover";
import GlobalSearch from "./GlobalSearch";

function Notifications() {
  const [state, setState] = useState({ data: [], unread: 0 });
  const load = useCallback(() => notificationsApi.list().then(setState).catch(() => {}), []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const markAll = async () => { await notificationsApi.markAllRead().catch(() => {}); load(); };

  return (
    <Popover
      panelClassName="w-80 p-0"
      trigger={({ toggle, open }) => (
        <button onClick={(e) => { toggle(e); if (!open) load(); }} aria-label={`Notifications, ${state.unread} unread`} aria-expanded={open}
          className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100">
          <Bell className="h-6 w-6" />
          {state.unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{state.unread}</span>
          )}
        </button>
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Notifications</p>
        {state.unread > 0 && <button onClick={markAll} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"><CheckCheck className="h-3.5 w-3.5" /> Mark all read</button>}
      </div>
      <ul className="max-h-80 overflow-y-auto">
        {state.data.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up.</li>}
        {state.data.map((n) => (
          <li key={n._id} className="flex gap-3 border-b border-slate-50 px-4 py-3 last:border-0">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-slate-200" : "bg-indigo-500"}`} />
            <div><p className="text-sm text-slate-700">{n.text}</p><p className="text-xs text-slate-400">{timeAgo(n.createdAt)}</p></div>
          </li>
        ))}
      </ul>
    </Popover>
  );
}

export default function Header({ onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Dashboard and Jobs already show their own "New Job" button
  const showNewJob = pathname !== "/" && pathname !== "/jobs";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Menu className="h-6 w-6" /></button>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {showNewJob && (
          <Button onClick={() => navigate("/jobs?new=1")} className="hidden sm:inline-flex"><Plus className="h-4 w-4" /> New Job</Button>
        )}
        <Notifications />
        <Popover
          trigger={({ toggle, open }) => (
            <button onClick={toggle} aria-expanded={open} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100">
              <Avatar name={user?.name} className="!bg-indigo-600/90 !text-white" />
              <span className="hidden text-sm font-medium text-slate-800 sm:block">{user?.name?.split(" ")[0]}</span>
              <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
            </button>
          )}
        >
          {(close) => (
            <>
              <div className="border-b border-slate-100 px-3 pb-2 pt-1"><p className="text-sm font-medium text-slate-900">{user?.name}</p><p className="text-xs text-slate-500">{user?.email}</p></div>
              <MenuItem icon={Settings} onClick={() => { close(); navigate("/settings"); }}>Profile & settings</MenuItem>
              <MenuItem icon={LogOut} danger onClick={() => { close(); logout(); navigate("/login"); }}>Sign out</MenuItem>
            </>
          )}
        </Popover>
      </div>
    </header>
  );
}
