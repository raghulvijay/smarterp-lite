/**
 * useFilterPresets — saves and loads named filter configurations to localStorage.
 *
 * @param {string} storageKey - Unique localStorage key for this page's presets.
 * @returns {{
 *   presets: Array<{name: string, filters: object}>,
 *   savePreset: (name: string, filters: object) => void,
 *   deletePreset: (name: string) => void
 * }}
 */
import { useState, useCallback } from "react";

const MAX = 5;

export default function useFilterPresets(storageKey) {
  const [presets, setPresets] = useState(() => {
    try {
      const s = localStorage.getItem(storageKey);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const savePreset = useCallback(
    (name, filters) => {
      if (!name.trim()) return;
      setPresets((prev) => {
        const without = prev.filter((p) => p.name !== name.trim());
        const next    = [...without, { name: name.trim(), filters }].slice(-MAX);
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey],
  );

  const deletePreset = useCallback(
    (name) => {
      setPresets((prev) => {
        const next = prev.filter((p) => p.name !== name);
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey],
  );

  return { presets, savePreset, deletePreset };
}
