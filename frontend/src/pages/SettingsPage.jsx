// src/pages/SettingsPage.jsx
import { useState } from "react";
import { Bell, Database, Info, Link2, Palette, Settings, ShieldCheck, Tag, Users, Workflow } from "lucide-react";
import { settingsApi } from "@/api/services";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/common/PageHeader";
import { PageSpinner } from "@/components/common/States";
import GeneralSection from "./settings/GeneralSection";
import ListManager from "./settings/ListManager";
import UsersSection from "./settings/UsersSection";
import { AboutSection, AppearanceSection, DataSection, IntegrationsSection, NotificationsSection, SecuritySection } from "./settings/OtherSections";

const TABS = [
  { id: "general", label: "General", hint: "Profile and company settings", icon: Settings },
  { id: "stages", label: "Hiring Stages", hint: "Manage candidate stages", icon: Workflow },
  { id: "sources", label: "Sources", hint: "Application sources", icon: Tag },
  { id: "users", label: "Users", hint: "Manage team members", icon: Users },
  { id: "notifications", label: "Notifications", hint: "Email and in-app alerts", icon: Bell },
  { id: "appearance", label: "Appearance", hint: "Theme and display", icon: Palette },
  { id: "data", label: "Data Management", hint: "Import, export and backup", icon: Database },
  { id: "integrations", label: "Integrations", hint: "Third-party tools", icon: Link2 },
  { id: "security", label: "Security", hint: "Password and access", icon: ShieldCheck },
  { id: "about", label: "About", hint: "App version and support", icon: Info },
];

export default function SettingsPage() {
  const { ready } = useSettings();
  const [tab, setTab] = useState("general");
  if (!ready) return <PageSpinner />;

  const content = {
    general: <GeneralSection />,
    stages: <ListManager kind="stages" title="Hiring Stages" description="Rename, recolour and reorder your pipeline stages. Drag to reorder." noun="Stage" api={settingsApi.stages} />,
    sources: <ListManager kind="sources" title="Application Sources" description="Where your candidates come from. Drag to reorder." noun="Source" api={settingsApi.sources} />,
    users: <UsersSection />, notifications: <NotificationsSection />, appearance: <AppearanceSection />, data: <DataSection />,
    integrations: <IntegrationsSection />, security: <SecuritySection />, about: <AboutSection />,
  }[tab];

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account, company details, and hiring preferences" />
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white p-2 shadow-sm lg:flex-col lg:self-start lg:overflow-visible">
          {TABS.map(({ id, label, hint, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
              className={cn("flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors", tab === id ? "bg-indigo-50" : "hover:bg-slate-50")}>
              <Icon className={cn("h-5 w-5", tab === id ? "text-indigo-600" : "text-slate-500")} aria-hidden />
              <span><span className={cn("block text-sm font-medium", tab === id ? "text-indigo-700" : "text-slate-800")}>{label}</span><span className="hidden text-xs text-slate-500 lg:block">{hint}</span></span>
            </button>
          ))}
        </nav>
        <div className="min-w-0">{content}</div>
      </div>
    </>
  );
}
