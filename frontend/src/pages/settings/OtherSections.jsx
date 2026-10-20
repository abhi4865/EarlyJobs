// src/pages/settings/OtherSections.jsx
import { useState } from "react";
import { toast } from "sonner";
import { Download, Moon, Monitor, Sun } from "lucide-react";
import { authApi, candidatesApi, interviewsApi, jobsApi, settingsApi } from "@/api/services";
import { getErrorMessage } from "@/api/client";
import { useSettings } from "@/context/SettingsContext";
import { downloadFile, toCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
import Button from "@/components/common/Button";
import { Field, Input, Switch } from "@/components/common/Fields";

const Card = ({ title, subtitle, children }) => (
  <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2><p className="mb-5 text-sm text-slate-500">{subtitle}</p>{children}
  </section>
);

const NOTIFY = [
  ["newCandidate", "New candidate applied", "Email me when someone applies to a job"],
  ["interviewReminder", "Interview reminders", "Remind me before scheduled interviews"],
  ["stageChange", "Stage changes", "Notify me when a candidate moves between stages"],
  ["weeklyDigest", "Weekly digest", "A summary of hiring activity every Monday"],
];

export function NotificationsSection() {
  const { settings, refresh } = useSettings();
  const [prefs, setPrefs] = useState(settings.notifications);
  const toggle = async (key, value) => {
    const prev = prefs; setPrefs({ ...prefs, [key]: value });
    try { await settingsApi.updateNotifications({ [key]: value }); refresh(); } catch (e) { setPrefs(prev); toast.error(getErrorMessage(e)); }
  };
  return (
    <Card title="Notifications" subtitle="Choose what you want to be alerted about">
      <ul className="divide-y divide-slate-100">{NOTIFY.map(([k, label, desc]) => (
        <li key={k} className="flex items-center justify-between gap-4 py-3.5"><div><p className="text-sm font-medium text-slate-800">{label}</p><p className="text-sm text-slate-500">{desc}</p></div><Switch checked={!!prefs[k]} onChange={(v) => toggle(k, v)} label={label} /></li>
      ))}</ul>
    </Card>
  );
}

export function AppearanceSection() {
  const opts = [["Light", Sun, true], ["Dark", Moon, false], ["System", Monitor, false]];
  return (
    <Card title="Appearance" subtitle="Theme and display">
      <div className="grid max-w-md grid-cols-3 gap-3">{opts.map(([label, Icon, on]) => (
        <button key={label} disabled={!on} aria-pressed={on} className={cn("flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium", on ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-400")}>
          <Icon className="h-6 w-6" />{label}{!on && <span className="text-[10px] font-normal">Coming soon</span>}</button>
      ))}</div>
    </Card>
  );
}

export function DataSection() {
  const [busy, setBusy] = useState("");
  const run = (key, fn) => async () => { setBusy(key); try { await fn(); } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(""); } };
  const day = new Date().toISOString().slice(0, 10);

  const exportCandidates = run("c", async () => {
    const { data } = await candidatesApi.list({ limit: 5000 });
    downloadFile(`candidates-${day}.csv`, toCsv(data, [
      { label: "Name", value: (c) => c.name }, { label: "Email", value: (c) => c.email }, { label: "Phone", value: (c) => c.phone },
      { label: "Job", value: (c) => c.job?.title }, { label: "Stage", value: (c) => c.stage }, { label: "Source", value: (c) => c.source },
      { label: "Applied On", value: (c) => c.appliedOn?.slice(0, 10) }, { label: "Expected Salary", value: (c) => c.expectedSalary }, { label: "Skills", value: (c) => c.skills.join("; ") },
    ]));
    toast.success(`Exported ${data.length} candidates`);
  });
  const exportJobs = run("j", async () => {
    const { data } = await jobsApi.list({ limit: 1000 });
    downloadFile(`jobs-${day}.csv`, toCsv(data, [
      { label: "Code", value: (j) => j.code }, { label: "Title", value: (j) => j.title }, { label: "Department", value: (j) => j.department }, { label: "Location", value: (j) => j.location },
      { label: "Status", value: (j) => j.status }, { label: "Openings", value: (j) => j.openings }, { label: "Candidates", value: (j) => j.candidateCount }, { label: "Created", value: (j) => j.createdAt?.slice(0, 10) },
    ]));
    toast.success(`Exported ${data.length} jobs`);
  });
  const backup = run("b", async () => {
    const [c, j, i] = await Promise.all([candidatesApi.list({ limit: 5000 }), jobsApi.list({ limit: 1000 }), interviewsApi.list({})]);
    downloadFile(`earlyjobs-backup-${day}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), candidates: c.data, jobs: j.data, interviews: i.data }, null, 2), "application/json");
    toast.success("Backup downloaded");
  });

  return (
    <Card title="Data Management" subtitle="Export and back up your hiring data">
      <div className="grid gap-3 sm:grid-cols-3">
        {[["Candidates (CSV)", exportCandidates, "c"], ["Jobs (CSV)", exportJobs, "j"], ["Full backup (JSON)", backup, "b"]].map(([label, fn, k]) => (
          <Button key={k} variant="outline" size="lg" onClick={fn} loading={busy === k}><Download className="h-4 w-4" /> {label}</Button>
        ))}
      </div>
    </Card>
  );
}

export function IntegrationsSection() {
  const { settings, refresh } = useSettings();
  const toggle = async (it) => {
    try { await settingsApi.setIntegration(it.key, !it.connected); toast.success(`${it.name} ${it.connected ? "disconnected" : "connected"}`); refresh(); } catch (e) { toast.error(getErrorMessage(e)); }
  };
  return (
    <Card title="Integrations" subtitle="Connect third-party tools">
      <ul className="divide-y divide-slate-100">{settings.integrations.map((it) => (
        <li key={it.key} className="flex items-center justify-between gap-4 py-3.5"><div><p className="text-sm font-medium text-slate-800">{it.name}</p><p className="text-sm text-slate-500">{it.description}</p></div>
          <Button size="sm" variant={it.connected ? "outline" : "primary"} onClick={() => toggle(it)}>{it.connected ? "Disconnect" : "Connect"}</Button></li>
      ))}</ul>
    </Card>
  );
}

export function SecuritySection() {
  const [f, setF] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.currentPassword) er.currentPassword = "Enter your current password";
    if (f.newPassword.length < 8) er.newPassword = "Use at least 8 characters";
    if (f.confirm !== f.newPassword) er.confirm = "Passwords don't match";
    setErrors(er); if (Object.keys(er).length) return;
    setSaving(true);
    try { await authApi.changePassword({ currentPassword: f.currentPassword, newPassword: f.newPassword }); toast.success("Password updated"); setF({ currentPassword: "", newPassword: "", confirm: "" }); }
    catch (err) { setErrors({ currentPassword: getErrorMessage(err) }); } finally { setSaving(false); }
  };
  return (
    <Card title="Security" subtitle="Password and access">
      <form onSubmit={submit} className="max-w-md space-y-4" noValidate>
        <Field label="Current password" error={errors.currentPassword} htmlFor="s-cur"><Input id="s-cur" type="password" autoComplete="current-password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} /></Field>
        <Field label="New password" error={errors.newPassword} htmlFor="s-new"><Input id="s-new" type="password" autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} /></Field>
        <Field label="Confirm new password" error={errors.confirm} htmlFor="s-conf"><Input id="s-conf" type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} /></Field>
        <Button type="submit" loading={saving}>Update password</Button>
      </form>
    </Card>
  );
}

export function AboutSection() {
  return (
    <Card title="About" subtitle="App version and support">
      <dl className="grid max-w-md grid-cols-[120px_1fr] gap-y-3 text-sm">
        <dt className="text-slate-500">App</dt><dd className="text-slate-800">EarlyJobs Hiring Dashboard</dd>
        <dt className="text-slate-500">Version</dt><dd className="text-slate-800">1.0.0</dd>
        <dt className="text-slate-500">Data source</dt><dd className="text-slate-800">{import.meta.env.VITE_USE_MOCK === "true" ? "Demo data (mock API)" : "Live API"}</dd>
      </dl>
    </Card>
  );
}
