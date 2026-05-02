import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb    from "../../components/common/Breadcrumb";
import PageHeader    from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useAuth }   from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useAuditLog } from "../../context/AuditLogContext";
import { useSettings, DEFAULT_SETTINGS } from "../../hooks/useSettings";

const TECH_STACK = [
  { name: "React 18",        why: "Concurrent rendering, hooks"            },
  { name: "Vite 5",          why: "Sub-second HMR, fast builds"            },
  { name: "Bootstrap 5",     why: "Utility-first responsive layout"         },
  { name: "DevExtreme",      why: "Enterprise DataGrid with Excel features" },
  { name: "Recharts",        why: "Declarative React chart components"      },
  { name: "@dnd-kit",        why: "Accessible drag-and-drop for Kanban"     },
  { name: "react-grid-layout", why: "Drag-to-rearrange dashboard widgets"  },
  { name: "driver.js",       why: "Lightweight zero-dependency tour"        },
  { name: "Gemini AI",       why: "Natural-language ERP insights"          },
];

function Section({ title, icon, children }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <i className={`bi ${icon}`} style={{ color: "#4f46e5", fontSize: "1.05rem" }} />
        <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>{title}</span>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <div>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
        {hint && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 1 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 100, cursor: "pointer", transition: "background 0.2s",
        background: value ? "#4f46e5" : "#d1d5db", position: "relative",
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18,
        borderRadius: "50%", background: "white", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </div>
  );
}

function SelectPill({ options, value, onChange }) {
  return (
    <div className="d-flex gap-1 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            border: value === o.value ? "2px solid #4f46e5" : "1.5px solid var(--border)",
            background: value === o.value ? "var(--brand-soft)" : "var(--bg-card)",
            color: value === o.value ? "#4f46e5" : "var(--text-secondary)",
            borderRadius: 8, padding: "5px 14px", cursor: "pointer",
            fontSize: "0.8125rem", fontWeight: 600, transition: "all 0.12s",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Settings() {
  const { isAdmin } = useAuth();
  const navigate    = useNavigate();
  const { code: currencyCode, currencies, setCurrency } = useCurrency();
  const { clearLog } = useAuditLog();
  const { settings, setSettings, exportSettings, importSettings } = useSettings();
  const fileRef = useRef(null);
  const [confirm, setConfirm] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);

  // Ping DummyJSON — must be before any early return (hooks must not be conditional)
  useEffect(() => {
    fetch("https://dummyjson.com/products?limit=1")
      .then((r) => setApiStatus(r.ok ? "online" : "error"))
      .catch(() => setApiStatus("offline"));
  }, []);

  if (!isAdmin) { navigate("/", { replace: true }); return null; }

  // Keep currency context in sync with settings
  const handleCurrencyChange = (code) => {
    setSettings({ currency: code });
    setCurrency(code);
  };

  const clearAuditLog = () => {
    setConfirm({
      title: "Clear Audit Log",
      message: "This will permanently delete all activity log entries. This cannot be undone.",
      onConfirm: () => { clearLog(); setConfirm(null); },
    });
  };

  const resetDashboard = () => {
    setConfirm({
      title: "Reset Dashboard Layout",
      message: "This will restore the default dashboard widget arrangement.",
      onConfirm: () => { localStorage.removeItem("erp_dashboard_layouts_v3"); setConfirm(null); },
    });
  };

  const clearFilters = () => {
    setConfirm({
      title: "Clear All Saved Filters",
      message: "This will remove all saved filter presets from all pages.",
      onConfirm: () => {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("erp_filter_") || k.startsWith("erp_presets_"))
          .forEach((k) => localStorage.removeItem(k));
        setConfirm(null);
      },
    });
  };

  const appNameStyle = {
    border: "1.5px solid var(--border)", borderRadius: 8,
    padding: "6px 12px", background: "var(--bg-card)",
    color: "var(--text-primary)", fontSize: "0.875rem", outline: "none",
    width: 200,
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Settings" }]} />
      <PageHeader title="Settings & Preferences" subtitle="Customize SmartERP Lite to your workflow" />

      {/* ── General ── */}
      <Section title="General" icon="bi-sliders">
        <Row label="App Name" hint="Displayed in the sidebar brand">
          <input
            style={appNameStyle}
            value={settings.appName}
            onChange={(e) => setSettings({ appName: e.target.value })}
            onBlur={(e) => { if (!e.target.value.trim()) setSettings({ appName: DEFAULT_SETTINGS.appName }); }}
          />
        </Row>
        <Row label="Default Currency" hint="Affects all price displays across the app">
          <SelectPill
            options={currencies.map((c) => ({ value: c.code, label: c.code }))}
            value={currencyCode}
            onChange={handleCurrencyChange}
          />
        </Row>
        <Row label="Date Format" hint="How dates appear throughout the app">
          <SelectPill
            options={[
              { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
              { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
              { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
            ]}
            value={settings.dateFormat}
            onChange={(v) => setSettings({ dateFormat: v })}
          />
        </Row>
      </Section>

      {/* ── Notifications ── */}
      <Section title="Notifications" icon="bi-bell">
        <Row label="Low stock alerts" hint="Show notifications when product stock falls below threshold">
          <Toggle value={settings.alertLowStock} onChange={(v) => setSettings({ alertLowStock: v })} />
        </Row>
        <Row label="Pending order alerts" hint="Show notifications for orders awaiting action">
          <Toggle value={settings.alertPendingOrders} onChange={(v) => setSettings({ alertPendingOrders: v })} />
        </Row>
        <Row label="Default restock threshold" hint="Global fallback when a product has no individual threshold">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number" min={1} max={1000}
              value={settings.restockThreshold}
              onChange={(e) => setSettings({ restockThreshold: Math.max(1, Number(e.target.value)) })}
              style={{ ...appNameStyle, width: 80, textAlign: "center" }}
            />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>units</span>
          </div>
        </Row>
      </Section>

      {/* ── Data ── */}
      <Section title="Data Management" icon="bi-database">
        <div className="d-flex flex-column gap-3">
          {[
            { label: "Clear Audit Log",          icon: "bi-trash3",     color: "#dc2626", onClick: clearAuditLog,  hint: "Permanently removes all activity log entries" },
            { label: "Reset Dashboard Layout",   icon: "bi-layout-wtf", color: "#d97706", onClick: resetDashboard, hint: "Restores default widget arrangement" },
            { label: "Clear All Saved Filters",  icon: "bi-funnel",     color: "#6b7280", onClick: clearFilters,   hint: "Removes saved filter presets from all pages" },
          ].map((action) => (
            <div key={action.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{action.label}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{action.hint}</div>
              </div>
              <button
                onClick={action.onClick}
                style={{ border: `1.5px solid ${action.color}22`, background: action.color + "10", color: action.color, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, flexShrink: 0 }}
              >
                <i className={`bi ${action.icon} me-1`} />{action.label}
              </button>
            </div>
          ))}

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Settings File</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 12 }}>Export or import all preferences as a JSON file</div>
            <div className="d-flex gap-2">
              <button onClick={exportSettings} style={{ border: "1.5px solid #4f46e5", background: "var(--brand-soft)", color: "#4f46e5", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600 }}>
                <i className="bi bi-download me-1" />Export Settings
              </button>
              <button onClick={() => fileRef.current?.click()} style={{ border: "1.5px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600 }}>
                <i className="bi bi-upload me-1" />Import Settings
              </button>
              <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importSettings(f); e.target.value = ""; }} />
            </div>
          </div>
        </div>
      </Section>

      {/* ── About ── */}
      <Section title="About" icon="bi-info-circle">
        <div className="row g-3">
          <div className="col-12 col-md-5">
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>App Info</div>
            {[
              { label: "Version",   value: "1.0.0" },
              { label: "Build",     value: "Phase 5 — Production Ready" },
              { label: "Author",    value: "SmartERP Lite" },
              { label: "API",
                value: (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: apiStatus === "online" ? "#10b981" : apiStatus === "offline" ? "#ef4444" : "#d1d5db", flexShrink: 0 }} />
                    {apiStatus === "online" ? "DummyJSON API — Online" : apiStatus === "offline" ? "DummyJSON API — Offline" : "Checking…"}
                  </span>
                )
              },
            ].map((r) => (
              <div key={r.label} className="d-flex justify-content-between" style={{ fontSize: "0.85rem", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)" }}>{r.label}</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="col-12 col-md-7">
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Tech Stack</div>
            <div className="d-flex flex-column gap-1">
              {TECH_STACK.map((t) => (
                <div key={t.name} className="d-flex align-items-center gap-2" style={{ fontSize: "0.8125rem", padding: "4px 0" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", minWidth: 130 }}>{t.name}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{t.why}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {confirm && (
        <ConfirmDialog
          show={!!confirm}
          title={confirm.title}
          message={confirm.message}
          confirmLabel="Confirm"
          onConfirm={confirm.onConfirm}
          onHide={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
