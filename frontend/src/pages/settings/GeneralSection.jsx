// src/pages/settings/GeneralSection.jsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { settingsApi } from "@/api/services";
import { getErrorMessage } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { USER_ROLES } from "@/lib/constants";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import { Field, Input, Select } from "@/components/common/Fields";
import ListManager from "./ListManager";

const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Education", "Retail", "Manufacturing", "Other"];

function Card({ title, subtitle, onSave, saving, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} noValidate>
        <div className="mb-5 flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div><Button type="submit" loading={saving}>Save Changes</Button></div>
        {children}
      </form>
    </section>
  );
}

export default function GeneralSection() {
  const { settings, refresh } = useSettings();
  const { setUser } = useAuth();
  const [profile, setProfile] = useState(settings.profile);
  const [company, setCompany] = useState(settings.company);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState("");
  useEffect(() => { setProfile(settings.profile); setCompany(settings.company); }, [settings.profile, settings.company]);

  const saveProfile = async () => {
    const e = {};
    if (!profile.name.trim()) e.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) e.email = "Enter a valid email";
    setErrors(e); if (Object.keys(e).length) return;
    setSaving("profile");
    try { const p = await settingsApi.updateProfile(profile); setUser((u) => ({ ...u, ...p })); toast.success("Profile saved"); refresh(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(""); }
  };
  const saveCompany = async () => {
    if (!company.name.trim()) return setErrors({ company: "Enter your company name" });
    setErrors({}); setSaving("company");
    try { await settingsApi.updateCompany(company); toast.success("Company details saved"); refresh(); } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(""); }
  };

  return (
    <div className="space-y-6">
      <Card title="Profile Settings" subtitle="Update your personal information" onSave={saveProfile} saving={saving === "profile"}>
        <div className="grid gap-5 md:grid-cols-[10rem_1fr]">
          <div className="flex flex-col items-center gap-3"><Avatar name={profile.name} size="xl" className="!h-20 !w-20 !text-3xl" /><Button variant="outline" size="sm" onClick={() => toast.info("Photo upload needs file storage — coming with the backend.")}>Change Photo</Button></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" error={errors.name} htmlFor="p-name"><Input id="p-name" value={profile.name} invalid={!!errors.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
            <Field label="Email Address" error={errors.email} htmlFor="p-email"><Input id="p-email" type="email" value={profile.email} invalid={!!errors.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
            <Field label="Role" htmlFor="p-role"><Select id="p-role" value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })}>{USER_ROLES.map((r) => <option key={r}>{r}</option>)}</Select></Field>
            <Field label="Phone Number" htmlFor="p-phone"><Input id="p-phone" value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
          </div>
        </div>
      </Card>

      <Card title="Company Information" subtitle="Update your company details" onSave={saveCompany} saving={saving === "company"}>
        <div className="grid gap-5 md:grid-cols-[10rem_1fr]">
          <button type="button" onClick={() => toast.info("Logo upload needs file storage — coming with the backend.")} className="flex h-32 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:bg-slate-50">
            <Building2 className="h-7 w-7" /><span className="text-sm font-medium text-slate-700">Upload Logo</span><span className="text-xs">PNG, JPG (Max 2MB)</span>
          </button>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name" error={errors.company} htmlFor="co-name"><Input id="co-name" value={company.name} invalid={!!errors.company} onChange={(e) => setCompany({ ...company, name: e.target.value })} /></Field>
            <Field label="Website" htmlFor="co-web"><Input id="co-web" type="url" value={company.website ?? ""} onChange={(e) => setCompany({ ...company, website: e.target.value })} /></Field>
            <Field label="Industry" htmlFor="co-ind"><Select id="co-ind" value={company.industry} onChange={(e) => setCompany({ ...company, industry: e.target.value })}>{INDUSTRIES.map((r) => <option key={r}>{r}</option>)}</Select></Field>
            <Field label="Location" htmlFor="co-loc"><Input id="co-loc" value={company.location ?? ""} onChange={(e) => setCompany({ ...company, location: e.target.value })} /></Field>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <ListManager compact kind="stages" title="Hiring Stages" description="Manage the stages of your hiring pipeline" noun="Stage" api={settingsApi.stages} />
        <ListManager compact kind="sources" title="Application Sources" description="Manage candidate sources" noun="Source" api={settingsApi.sources} />
      </div>
    </div>
  );
}
