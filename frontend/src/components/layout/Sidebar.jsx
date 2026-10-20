// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { CalendarCheck, ChevronRight, KanbanSquare, LayoutDashboard, Briefcase, Rocket, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import Avatar from "@/components/common/Avatar";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/pipeline", label: "Hiring Pipeline", icon: KanbanSquare },
  { to: "/interviews", label: "Interviews", icon: CalendarCheck },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0a1235] to-[#101a4a] text-slate-300">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <Rocket className="h-8 w-8 text-indigo-400" aria-hidden />
        <span className="text-2xl font-semibold tracking-tight text-white">EarlyJobs</span>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Main">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors",
              isActive ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-900/30" : "hover:bg-white/5 hover:text-white")}>
            <Icon className="h-5 w-5" aria-hidden /> {label}
          </NavLink>
        ))}
      </nav>
      <button onClick={() => { navigate("/settings"); onNavigate?.(); }}
        className="m-3 flex items-center gap-3 rounded-xl border-t border-white/10 px-3 py-4 text-left transition-colors hover:bg-white/5">
        <Avatar name={user?.name} className="!bg-indigo-100 !text-indigo-700" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.role}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </button>
    </div>
  );
}
