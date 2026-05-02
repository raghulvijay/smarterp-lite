/**
 * AuditLogContext — records every CREATE/UPDATE/DELETE action in the app.
 *
 * Persists up to 200 entries in localStorage under "erp_audit_log".
 * Each entry shape: { id, timestamp, action, entity, entityId, details, user }
 * where action is one of 'CREATE' | 'UPDATE' | 'DELETE'.
 *
 * @returns {{
 *   log: Array<{id:string, timestamp:string, action:string, entity:string, entityId:string, details:string, user:string}>,
 *   addEntry: (entry: object) => void,
 *   clearLog: () => void
 * }}
 */
import { createContext, useCallback, useContext, useState } from "react";

const STORAGE_KEY = "erp_audit_log";
const MAX_ENTRIES = 200;

function loadLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const AuditLogContext = createContext();

export function AuditLogProvider({ children }) {
  const [log, setLog] = useState(loadLog);

  const addEntry = useCallback((entry) => {
    const newEntry = {
      id:        `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    setLog((prev) => {
      const updated = [newEntry, ...prev].slice(0, MAX_ENTRIES);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* quota */ }
      return updated;
    });
  }, []);

  const clearLog = useCallback(() => {
    setLog([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuditLogContext.Provider value={{ log, addEntry, clearLog }}>
      {children}
    </AuditLogContext.Provider>
  );
}

export const useAuditLog = () => useContext(AuditLogContext);
