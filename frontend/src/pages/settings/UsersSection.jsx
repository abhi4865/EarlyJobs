// src/pages/settings/UsersSection.jsx
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { settingsApi } from "@/api/services";
import { getErrorMessage } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { USER_ROLES } from "@/lib/constants";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Modal from "@/components/common/Modal";
import { Field, Input, Select } from "@/components/common/Fields";

export default function UsersSection() {
  const { users, refresh } = useSettings();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Recruiter" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toRemove, setToRemove] = useState(null);

  const add = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Enter a name and a valid email address");
    setSaving(true);
    try { await settingsApi.addUser(form); toast.success("Team member added"); setOpen(false); setForm({ name: "", email: "", role: "Recruiter" }); setError(""); refresh(); }
    catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  };
  const remove = async () => {
    try { await settingsApi.removeUser(toRemove._id); toast.success("Team member removed"); refresh(); } catch (e) { toast.error(getErrorMessage(e)); } finally { setToRemove(null); }
  };

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Users</h2><p className="text-sm text-slate-500">Manage team members who can access EarlyJobs</p></div><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Member</Button></div>
      <ul className="divide-y divide-slate-100">
        {users.map((u) => (
          <li key={u._id} className="flex items-center gap-3 py-3">
            <Avatar name={u.name} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900">{u.name}{u.email === user?.email && <span className="ml-2 text-xs text-slate-400">(you)</span>}</p><p className="truncate text-xs text-slate-500">{u.email}</p></div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{u.role}</span>
            <button onClick={() => setToRemove(u)} disabled={u.email === user?.email} aria-label={`Remove ${u.name}`} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      <Modal open={open} onClose={() => setOpen(false)} size="sm" title="Add team member" description="They'll appear as an interviewer option."
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="user-form" loading={saving}>Add member</Button></>}>
        <form id="user-form" onSubmit={add} className="space-y-4" noValidate>
          <Field label="Full name" htmlFor="u-name"><Input id="u-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></Field>
          <Field label="Email" htmlFor="u-email" error={error}><Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Role" htmlFor="u-role"><Select id="u-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{USER_ROLES.map((r) => <option key={r}>{r}</option>)}</Select></Field>
        </form>
      </Modal>
      <ConfirmDialog open={!!toRemove} title="Remove team member?" confirmLabel="Remove" description={`${toRemove?.name} will lose access and no longer appear as an interviewer option.`} onConfirm={remove} onClose={() => setToRemove(null)} />
    </section>
  );
}
