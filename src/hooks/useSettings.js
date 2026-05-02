/**
 * useSettings — reads/writes app preferences from localStorage key 'app_settings'.
 * Returns the settings object and a setter. Merges partial updates.
 */
import { useCallback, useState } from "react";

const STORAGE_KEY = "app_settings";

export const DEFAULT_SETTINGS = {
  appName:            "SmartERP Lite",
  currency:           "USD",
  dateFormat:         "MM/DD/YYYY",
  theme:              "light",
  alertLowStock:      true,
  alertPendingOrders: true,
  restockThreshold:   10,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState(load);

  const setSettings = useCallback((patch) => {
    setSettingsState((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettingsState(DEFAULT_SETTINGS);
  }, []);

  const exportSettings = useCallback(() => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "smarterp-settings.json"; a.click();
    URL.revokeObjectURL(url);
  }, [settings]);

  const importSettings = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        setSettingsState(merged);
      } catch { /* ignore malformed JSON */ }
    };
    reader.readAsText(file);
  }, []);

  return { settings, setSettings, resetSettings, exportSettings, importSettings };
}
