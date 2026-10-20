// src/context/SettingsContext.jsx
// Holds stages / sources / users so every page uses the same (editable) lists.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { settingsApi } from "@/api/services";
import { STAGE_FALLBACK_COLOR } from "@/lib/constants";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setSettings(await settingsApi.get());
      setError(null);
    } catch (e) {
      setError(e);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => {
    const stages = settings?.stages ?? [];
    const sources = settings?.sources ?? [];
    return {
      settings, setSettings, refresh, error, ready: !!settings,
      stages, sources, users: settings?.users ?? [],
      stageNames: stages.map((s) => s.name),
      sourceNames: sources.map((s) => s.name),
      stageColor: (name) => stages.find((s) => s.name === name)?.color ?? STAGE_FALLBACK_COLOR,
    };
  }, [settings, refresh, error]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
};
