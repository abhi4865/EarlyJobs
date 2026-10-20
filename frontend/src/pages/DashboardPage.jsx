// src/pages/DashboardPage.jsx
import { Link, useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Briefcase, CalendarDays, CheckCircle2, Plus, Users, Code2, Palette } from "lucide-react";
import { toast } from "sonner";
import { dashboardApi } from "@/api/services";
import { useFetch } from "@/hooks";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatShortDate, formatTime } from "@/lib/format";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import StatCard from "@/components/common/StatCard";
import { StageBadge } from "@/components/common/Badges";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/States";

function Card({ title, link, to, children, className }) {
  return (
    <section className={`rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6 ${className ?? ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {link && <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">{link} <ArrowRight className="h-4 w-4" /></Link>}
      </div>
      {children}
    </section>
  );
}

const jobIcon = (dept) => (dept === "Design" ? Palette : dept === "Engineering" ? Code2 : Briefcase);

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(() => dashboardApi.get(), []);

  const join = (i) => {
    if (i.type === "Video Call" && i.location?.startsWith("http")) window.open(i.location, "_blank", "noopener,noreferrer");
    else toast.info(i.type === "On-Site" ? `On-site at ${i.location || "the office"}` : "This interview doesn't have a meeting link.");
  };

  const header = (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome back, {user?.name?.split(" ")[0]}! <span aria-hidden>👋</span></h1>
        <p className="mt-1 text-slate-500">Here's what's happening with your hiring today.</p>
      </div>
      <Button size="lg" onClick={() => navigate("/jobs?new=1")}><Plus className="h-5 w-5" /> New Job</Button>
    </div>
  );

  if (error && !data) return <>{header}<ErrorState message={error} onRetry={reload} /></>;
  if (!data) {
    return (
      <>{header}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3"><Skeleton className="h-72 rounded-2xl lg:col-span-2" /><Skeleton className="h-72 rounded-2xl" /></div>
      </>
    );
  }

  const { stats, pipeline, upcomingInterviews, recentCandidates, jobOpenings } = data;
  const maxApplicants = Math.max(1, ...jobOpenings.map((j) => j.candidateCount));
  const donut = [{ v: pipeline.filledPercent }, { v: 100 - pipeline.filledPercent }];

  return (
    <>
      {header}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Candidates" value={stats.totalCandidates} trend={stats.trends.totalCandidates} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={Briefcase} label="Open Jobs" value={stats.openJobs} trend={stats.trends.openJobs} tone="bg-sky-50 text-sky-600" />
        <StatCard icon={CalendarDays} label="Interviews" value={stats.interviews} trend={stats.trends.interviews} tone="bg-violet-50 text-violet-600" />
        <StatCard icon={CheckCircle2} label="Hires" value={stats.hires} trend={stats.trends.hires} tone="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card title="Hiring Pipeline" link="View Details" to="/pipeline" className="lg:col-span-3">
          <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
            <div className="flex items-center gap-6">
              <div className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donut} dataKey="v" innerRadius={52} outerRadius={70} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                      <Cell fill="#4f46e5" /><Cell fill="#e0e7ff" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-bold text-slate-900">{pipeline.filledPercent}%</span><span className="text-xs text-slate-500">Openings filled</span></div>
              </div>
              <ul className="space-y-2 text-sm">
                {pipeline.stages.map((s) => (
                  <li key={s.name} className="flex items-center gap-2.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} /><span className="w-20 text-slate-700">{s.name}</span><span className="font-semibold text-slate-900">{s.count}</span></li>
                ))}
              </ul>
            </div>
            <div className="h-48 min-w-0" aria-label="Applications per month">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pipeline.trend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs><linearGradient id="appsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip formatter={(v) => [v, "Applications"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="applications" stroke="#4f46e5" strokeWidth={2.5} fill="url(#appsFill)" dot={{ r: 3, fill: "#4f46e5" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card title="Upcoming Interviews" link="View All" to="/interviews" className="lg:col-span-2">
          {upcomingInterviews.length === 0 ? <EmptyState icon={CalendarDays} title="No upcoming interviews" description="Scheduled interviews will show up here." className="py-8" /> : (
            <ul className="divide-y divide-slate-100">
              {upcomingInterviews.map((i) => (
                <li key={i._id} className="flex items-center gap-3 py-3">
                  <div className="w-20 shrink-0"><p className="text-sm font-medium text-slate-900">{formatTime(i.start)}</p><p className="text-xs text-slate-500">{formatShortDate(i.start)}</p></div>
                  <Avatar name={i.candidate?.name} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{i.candidate?.name}</p><p className="truncate text-xs text-slate-500">{i.job?.title}</p></div>
                  <Button size="sm" onClick={() => join(i)}>Join</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card title="Recent Candidates" link="View All" to="/candidates" className="lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead><tr className="text-xs font-medium text-slate-500"><th className="pb-3">Name</th><th className="pb-3">Position</th><th className="pb-3">Stage</th><th className="pb-3">Applied On</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {recentCandidates.map((c) => (
                  <tr key={c._id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/candidates?id=${c._id}`)}>
                    <td className="py-3"><div className="flex items-center gap-3"><Avatar name={c.name} size="sm" /><div><p className="font-medium text-slate-900">{c.name}</p><p className="text-xs text-slate-500">{c.email}</p></div></div></td>
                    <td className="py-3 text-slate-700">{c.job?.title}</td>
                    <td className="py-3"><StageBadge stage={c.stage} /></td>
                    <td className="py-3 text-slate-600">{formatDate(c.appliedOn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Job Openings" link="View All" to="/jobs" className="lg:col-span-2">
          <ul className="space-y-4">
            {jobOpenings.map((j) => {
              const Icon = jobIcon(j.department);
              return (
                <li key={j._id} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{j.title}</p><p className="text-xs text-slate-500">{j.department}</p></div>
                  <div className="w-28 shrink-0 text-right">
                    <p className="text-xs text-slate-500">{j.candidateCount} Applicants</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-indigo-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${(j.candidateCount / maxApplicants) * 100}%` }} /></div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
