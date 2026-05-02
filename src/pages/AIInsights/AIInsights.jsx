import { useState, useEffect, useCallback, useMemo } from "react";
import "./AIInsights.css";
import Breadcrumb from "../../components/common/Breadcrumb";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useAuditLog } from "../../context/AuditLogContext";
import { generateAIInsights, getAnomalyRootCause, generatePurchaseDraft, AI_MODE_LABEL, IS_GEMINI } from "../../api/aiApi";
import { generateInsights, getInsightSummary } from "../../utils/aiInsights";
import { detectAnomalies } from "../../utils/anomalyDetector";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const PRIORITY_META = {
  critical: { color: "#991b1b", iconBg: "rgba(220,38,38,0.15)",  dot: "#dc2626" },
  high:     { color: "#9a3412", iconBg: "rgba(249,115,22,0.15)", dot: "#f97316" },
  medium:   { color: "#854d0e", iconBg: "rgba(234,179,8,0.15)",  dot: "#eab308" },
  low:      { color: "#1d4ed8", iconBg: "rgba(59,130,246,0.15)", dot: "#3b82f6" },
};

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function SectionTitle({ icon, children }) {
  return (
    <div style={{
      fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.9375rem",
      color: "var(--text-primary)", marginBottom: 16,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <i className={`bi ${icon}`} style={{ color: "#4f46e5" }} />
      {children}
    </div>
  );
}

function AISkeleton() {
  return (
    <div className="d-flex flex-column gap-3">
      <div className="ai-skeleton" style={{ height: 18, width: "85%" }} />
      <div className="ai-skeleton" style={{ height: 18, width: "70%" }} />
      <div className="ai-skeleton" style={{ height: 18, width: "78%" }} />
    </div>
  );
}

// dot color: green=CREATE, blue=UPDATE, red=DELETE
const ACTION_DOT = { CREATE: "#16a34a", UPDATE: "#4f46e5", DELETE: "#dc2626" };
const ACTION_ICON = {
  CREATE: "bi-plus-circle",
  UPDATE: "bi-pencil",
  DELETE: "bi-trash3",
};

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s <  60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m <  60)  return `${m} minute${m !== 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h <  24)  return `${h} hour${h !== 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d !== 1 ? "s" : ""} ago`;
}

const ENTITY_FILTERS = ["All", "Product", "Order", "User"];

function AuditLogTab({ log, clearLog, isAdmin }) {
  const [entityFilter, setEntityFilter] = useState("All");

  const visible = entityFilter === "All"
    ? log
    : log.filter((e) => e.entity === entityFilter);

  if (log.length === 0) {
    return (
      <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
        <i className="bi bi-clock-history" style={{ fontSize: "2rem", display: "block", marginBottom: 10 }} />
        <p className="mb-0" style={{ fontWeight: 500 }}>No activity recorded yet</p>
        <p style={{ fontSize: "0.85rem", marginTop: 4 }}>
          Actions like creating products, updating orders, or managing users will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div className="d-flex gap-1">
          {ENTITY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setEntityFilter(f)}
              style={{
                border: entityFilter === f ? "2px solid #4f46e5" : "1.5px solid var(--border)",
                background: entityFilter === f ? "rgba(79,70,229,0.1)" : "var(--bg-card)",
                color: entityFilter === f ? "#4f46e5" : "var(--text-secondary)",
                borderRadius: 100, padding: "4px 12px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f}
              <span style={{
                marginLeft: 5,
                background: entityFilter === f ? "#4f46e5" : "var(--border)",
                color: entityFilter === f ? "white" : "var(--text-muted)",
                borderRadius: 100, padding: "0 6px", fontSize: "0.68rem",
              }}>
                {f === "All" ? log.length : log.filter((e) => e.entity === f).length}
              </span>
            </button>
          ))}
        </div>
        {isAdmin && (
          <button
            className="btn btn-sm"
            onClick={clearLog}
            style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "#dc2626", borderRadius: 8, fontWeight: 500 }}
          >
            <i className="bi bi-trash3 me-1" /> Clear Log
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-4" style={{ color: "var(--text-muted)" }}>
          <p className="mb-0">No {entityFilter.toLowerCase()} activity found.</p>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          {/* Vertical timeline line */}
          <div style={{
            position: "absolute", left: 11, top: 12, bottom: 12,
            width: 2, background: "var(--border)", zIndex: 0,
          }} />

          <div className="d-flex flex-column gap-0">
            {visible.map((entry, i) => {
              const dotColor = ACTION_DOT[entry.action]  ?? "#6b7280";
              const icon     = ACTION_ICON[entry.action] ?? "bi-activity";
              const isLast   = i === visible.length - 1;
              return (
                <div key={entry.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingBottom: isLast ? 0 : 20, position: "relative" }}>
                  {/* Dot */}
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0, zIndex: 1,
                    background: dotColor, border: `2px solid ${dotColor}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 0 0 3px ${dotColor}22`,
                  }}>
                    <i className={`bi ${icon}`} style={{ color: "white", fontSize: "0.65rem" }} />
                  </div>

                  {/* Content */}
                  <div style={{
                    flex: 1, minWidth: 0, background: "var(--bg-card)",
                    border: "1px solid var(--border)", borderRadius: 10,
                    padding: "10px 14px",
                  }}>
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                        {entry.details ?? entry.label ?? entry.action}
                      </span>
                      {entry.entity && (
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: dotColor, background: dotColor + "18", borderRadius: 4, padding: "1px 6px" }}>
                          {entry.entity}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {entry.user && <span><i className="bi bi-person me-1" />{entry.user}</span>}
                      <span title={new Date(entry.timestamp).toLocaleString()}>
                        <i className="bi bi-clock me-1" />{relativeTime(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const ANOMALY_PRIORITY_META = {
  critical: { border: "rgba(220,38,38,0.35)", bg: "rgba(220,38,38,0.07)", dot: "#dc2626" },
  high:     { border: "rgba(249,115,22,0.35)", bg: "rgba(249,115,22,0.07)", dot: "#f97316" },
  medium:   { border: "rgba(234,179,8,0.35)",  bg: "rgba(234,179,8,0.07)",  dot: "#eab308" },
};

function AnomalyTab({ orders, products }) {
  const anomalies = useMemo(() => detectAnomalies(orders, products), [orders, products]);
  const [analyses, setAnalyses]   = useState({});
  const [loading,  setLoading]    = useState({});
  const [expanded, setExpanded]   = useState({});

  async function loadAnalysis(anomaly) {
    if (analyses[anomaly.id] || loading[anomaly.id]) return;
    setLoading((p) => ({ ...p, [anomaly.id]: true }));
    try {
      const { analysis } = await getAnomalyRootCause({ anomaly, orders, products });
      setAnalyses((p) => ({ ...p, [anomaly.id]: analysis }));
    } finally {
      setLoading((p) => ({ ...p, [anomaly.id]: false }));
    }
  }

  if (anomalies.length === 0) {
    return (
      <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
        <i className="bi bi-shield-check" style={{ fontSize: "2.5rem", display: "block", marginBottom: 12, color: "#10b981" }} />
        <p className="mb-1" style={{ fontWeight: 600, fontSize: "1rem" }}>No anomalies detected</p>
        <p style={{ fontSize: "0.875rem" }}>All KPIs are within normal thresholds.</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {anomalies.map((a) => {
        const meta = ANOMALY_PRIORITY_META[a.priority] ?? ANOMALY_PRIORITY_META.medium;
        const isExp = expanded[a.id];
        return (
          <div key={a.id} style={{ border: `1.5px solid ${meta.border}`, background: meta.bg, borderRadius: 12, overflow: "hidden" }}>
            <div
              style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 14 }}
              onClick={() => setExpanded((p) => ({ ...p, [a.id]: !p[a.id] }))}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: meta.dot, flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                  <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                    <i className={`bi ${a.icon} me-2`} style={{ color: meta.dot }} />
                    {a.title}
                  </span>
                  <span className={`priority-badge ${a.priority}`}>
                    {a.priority.toUpperCase()}
                  </span>
                  <span style={{ background: "var(--table-stripe)", color: "var(--text-muted)", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600, marginLeft: "auto" }}>
                    {a.metric}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>{a.description}</p>
              </div>
              <i className={`bi bi-chevron-${isExp ? "up" : "down"}`} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 2 }} />
            </div>

            {isExp && (
              <div style={{ padding: "0 18px 16px 42px", borderTop: `1px solid ${meta.border}` }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", marginTop: 12 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                    Why this matters
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8375rem", color: "var(--text-secondary)" }}>{a.why}</p>
                </div>

                {analyses[a.id] && (
                  <div style={{ background: "var(--brand-soft)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", marginTop: 10 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                      <i className="bi bi-stars me-1" />AI Root Cause Analysis
                    </div>
                    <p style={{ margin: 0, fontSize: "0.8375rem", color: "var(--text-secondary)" }}>{analyses[a.id]}</p>
                  </div>
                )}

                <button
                  className="btn btn-sm mt-3"
                  onClick={() => loadAnalysis(a)}
                  disabled={loading[a.id] || !!analyses[a.id]}
                  style={{ border: "1.5px solid #7c3aed", color: "#7c3aed", background: "var(--bg-card)", borderRadius: 8, fontWeight: 600, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {loading[a.id]
                    ? <><span className="spinner-border spinner-border-sm" /> Analyzing…</>
                    : analyses[a.id]
                      ? <><i className="bi bi-check2" /> Analysis complete</>
                      : <><i className="bi bi-stars" /> {IS_GEMINI ? "Get AI Root Cause Analysis" : "Get Analysis (Mock)"}</>}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RestockTab({ orders, products }) {
  const [poDraft,    setPoDraft]    = useState(null);
  const [poLoading,  setPoLoading]  = useState(false);
  const [poError,    setPoError]    = useState(null);

  const restockData = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const salesMap = {};
    orders
      .filter((o) => o.status === "Completed" && new Date(o.orderDate).getTime() >= thirtyDaysAgo)
      .forEach((o) => {
        const key = o.productName;
        salesMap[key] = (salesMap[key] ?? 0) + (o.quantity ?? 1);
      });

    return products
      .map((p) => {
        const name = p.name || p.title;
        const sold = salesMap[name] ?? 0;
        const velocity = sold / 30;
        const daysToStockout = velocity > 0 ? Math.round(p.stock / velocity) : null;
        const suggestedOrder = Math.round(velocity * 30);
        return { id: p.id, name, stock: p.stock, minStock: p.minStock ?? 10, velocity: parseFloat(velocity.toFixed(2)), daysToStockout, suggestedOrder };
      })
      .filter((r) => r.velocity > 0 || r.stock <= (r.minStock ?? 10))
      .sort((a, b) => {
        const da = a.daysToStockout ?? 9999;
        const db = b.daysToStockout ?? 9999;
        return da - db;
      });
  }, [orders, products]);

  function rowColor(days) {
    if (days === null) return "var(--text-muted)";
    if (days <= 7) return "#dc2626";
    if (days <= 14) return "#d97706";
    return "#16a34a";
  }

  function rowBg(days) {
    if (days === null) return "transparent";
    if (days <= 7) return "rgba(220,38,38,0.07)";
    if (days <= 14) return "rgba(249,115,22,0.07)";
    return "transparent";
  }

  async function generatePO() {
    setPoLoading(true);
    setPoError(null);
    try {
      const items = restockData.filter((r) => r.suggestedOrder > 0).slice(0, 20);
      const { draft } = await generatePurchaseDraft({ restockItems: items });
      setPoDraft(draft);
    } catch (e) {
      setPoError(e.message || "Failed to generate draft");
    } finally {
      setPoLoading(false);
    }
  }

  if (restockData.length === 0) {
    return (
      <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
        <i className="bi bi-box-seam" style={{ fontSize: "2.5rem", display: "block", marginBottom: 12, color: "#10b981" }} />
        <p className="mb-0" style={{ fontWeight: 600 }}>No restock required</p>
        <p style={{ fontSize: "0.875rem", marginTop: 4 }}>All active products have sufficient stock levels.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
          Based on sales velocity over the last 30 days · {restockData.length} product{restockData.length !== 1 ? "s" : ""} tracked
        </p>
        <button
          className="btn btn-sm"
          onClick={generatePO}
          disabled={poLoading}
          style={{ border: "1.5px solid #7c3aed", color: "#7c3aed", background: "var(--bg-card)", borderRadius: 8, fontWeight: 600, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}
        >
          {poLoading
            ? <><span className="spinner-border spinner-border-sm" />Generating…</>
            : <><i className="bi bi-stars" />{IS_GEMINI ? "Generate PO Draft (AI)" : "Generate PO Draft (Mock)"}</>}
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8375rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              {["Product", "Current Stock", "Min Stock", "30d Sales", "Velocity (units/day)", "Days to Stockout", "Suggested Order"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: h === "Product" ? "left" : "right", fontWeight: 700, color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {restockData.map((r) => (
              <tr key={r.id} style={{ background: rowBg(r.daysToStockout), borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--text-primary)" }}>{r.name}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: r.stock === 0 ? "#dc2626" : r.stock <= r.minStock ? "#d97706" : "var(--text-primary)" }}>{r.stock === 0 ? "Out" : r.stock}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-muted)" }}>{r.minStock}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-muted)" }}>{Math.round(r.velocity * 30)}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--text-secondary)" }}>{r.velocity}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: rowColor(r.daysToStockout) }}>
                  {r.daysToStockout === null ? "—" : r.daysToStockout <= 7 ? `⚠ ${r.daysToStockout}d` : `${r.daysToStockout}d`}
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "#4f46e5" }}>{r.suggestedOrder || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex gap-4 mt-3 flex-wrap">
        {[
          { color: "#dc2626", label: "Critical (≤ 7 days)" },
          { color: "#d97706", label: "Warning (7–14 days)" },
          { color: "#16a34a", label: "OK (> 14 days)" },
        ].map((l) => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--text-muted)" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, flexShrink: 0, display: "inline-block" }} />
            {l.label}
          </span>
        ))}
      </div>

      {poError && (
        <p style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: 12 }}><i className="bi bi-exclamation-circle me-1" />{poError}</p>
      )}

      {poDraft && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#7c3aed", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="bi bi-stars" />AI-Generated Purchase Order Draft
          </div>
          <pre style={{
            background: "var(--brand-soft)", border: "1px solid var(--border)", borderRadius: 10,
            padding: "16px 18px", fontSize: "0.8125rem", color: "var(--text-primary)",
            whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontFamily: "monospace",
          }}>
            {poDraft}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(poDraft).then(() => {}).catch(() => {});
            }}
            style={{ marginTop: 8, background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 12px", fontSize: "0.78rem", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <i className="bi bi-clipboard me-1" />Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}

export default function AIInsights() {
  const { products, orders, users, loading, error, refetch } = useApp();
  const { isAdmin } = useAuth();
  const { log, clearLog } = useAuditLog();

  const [activeTab, setActiveTab] = useState("insights");
  const [aiData, setAiData]             = useState(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiError, setAiError]           = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const runGenerate = useCallback(async () => {
    if (!products.length && !orders.length) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateAIInsights({ products, orders, users });
      setAiData(result);
      setHasGenerated(true);
    } catch (e) {
      setAiError(e.message || "AI generation failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }, [products, orders, users]);

  // Auto-generate once when ERP data is ready
  useEffect(() => {
    if (!loading && !hasGenerated && products.length > 0) {
      runGenerate();
    }
  }, [loading, hasGenerated, products.length, runGenerate]);

  if (loading) return <Loader message="Loading ERP data..." />;
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />;

  // Rule-based insights (existing engine — always shown)
  const ruleInsights = generateInsights({ products, orders, users })
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const summary = getInsightSummary(ruleInsights);

  // Category revenue for chart
  const categoryRevData = Object.entries(
    orders
      .filter((o) => o.status === "Completed")
      .reduce((acc, o) => {
        const prod = products.find((p) => p.name === o.productName);
        if (prod) acc[prod.category] = (acc[prod.category] || 0) + o.totalAmount;
        return acc;
      }, {})
  )
    .map(([category, revenue]) => ({ category, revenue: Math.round(revenue) }))
    .sort((a, b) => b.revenue - a.revenue);

  const recommendations = aiData?.recommendations
    ?.slice()
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) ?? [];

  const actionPlan = aiData?.actionPlan ?? [];

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", boxShadow: "var(--shadow-md)" }}>
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>{label}</p>
        <p style={{ margin: "4px 0 0", fontSize: "0.9rem", fontWeight: 700, color: "#4f46e5" }}>
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "AI Insights" }]} />

      <PageHeader
        title="AI Insights"
        subtitle="SmartERP AI Assistant — AI-powered business recommendations from your ERP data"
      />

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className="d-flex gap-1 mb-4 flex-wrap" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {[
          { key: "insights",  label: "AI Insights",         icon: "bi-stars"          },
          ...(isAdmin ? [
            { key: "anomalies", label: "Anomaly Detection", icon: "bi-exclamation-diamond" },
            { key: "restock",   label: "Restock Planner",   icon: "bi-box-seam"        },
            { key: "log",       label: "Activity Log",      icon: "bi-clock-history"   },
          ] : []),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              border: "none", background: "none", cursor: "pointer",
              padding: "8px 16px", fontSize: "0.875rem", fontWeight: 600,
              color: activeTab === tab.key ? "#4f46e5" : "var(--text-muted)",
              borderBottom: activeTab === tab.key ? "2px solid #4f46e5" : "2px solid transparent",
              marginBottom: -1, transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <i className={`bi ${tab.icon}`} style={{ fontSize: "0.875rem" }} />
            {tab.label}
            {tab.key === "log" && log.length > 0 && (
              <span style={{ background: "#4f46e5", color: "white", borderRadius: 100, padding: "0px 6px", fontSize: "0.7rem", fontWeight: 700 }}>
                {log.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Activity Log tab ──────────────────────────────────────────────── */}
      {activeTab === "log" && isAdmin && (
        <AuditLogTab log={log} clearLog={clearLog} isAdmin={isAdmin} />
      )}

      {/* ── Anomaly Detection tab ─────────────────────────────────────────── */}
      {activeTab === "anomalies" && isAdmin && (
        <div>
          <div className="d-flex align-items-center gap-3 mb-4">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#dc2626,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="bi bi-exclamation-diamond" style={{ color: "white", fontSize: "1.2rem" }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>AI Anomaly Detection</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Rule-based analysis of 4 key business indicators</div>
            </div>
          </div>
          <AnomalyTab orders={orders} products={products} />
        </div>
      )}

      {/* ── Restock Planner tab ───────────────────────────────────────────── */}
      {activeTab === "restock" && isAdmin && (
        <div>
          <div className="d-flex align-items-center gap-3 mb-4">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="bi bi-box-seam" style={{ color: "white", fontSize: "1.2rem" }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>Predictive Restock Planner</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Sales velocity analysis · Days-to-stockout · Suggested reorder quantities</div>
            </div>
          </div>
          <RestockTab orders={orders} products={products} />
        </div>
      )}

      {activeTab === "insights" && <>

      {/* ── AI Assistant Header Card ───────────────────────────────────────── */}
      <div className="ai-header-card mb-4">
        <div className="ai-header-icon">
          <i className="bi bi-stars" style={{ color: "white", fontSize: "1.375rem" }} />
        </div>

        <div className="flex-1">
          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1rem", color: "#3730a3" }}>
              SmartERP AI Assistant
            </span>
            <span className="ai-mode-badge">
              <i className="bi bi-cpu" style={{ fontSize: "0.65rem" }} />
              {AI_MODE_LABEL}
            </span>
          </div>
          <div style={{ fontSize: "0.8125rem", color: "#6366f1" }}>
            Analyzes products, orders, users & revenue · Generates executive summary, recommendations & action plan
          </div>

          {/* Priority counters */}
          <div className="d-flex gap-2 mt-2 flex-wrap">
            {summary.critical > 0 && (
              <span className="priority-badge critical"><i className="bi bi-dot" />{summary.critical} Critical</span>
            )}
            {summary.high > 0 && (
              <span className="priority-badge high"><i className="bi bi-dot" />{summary.high} High</span>
            )}
            {summary.medium > 0 && (
              <span className="priority-badge medium"><i className="bi bi-dot" />{summary.medium} Medium</span>
            )}
            {summary.low > 0 && (
              <span className="priority-badge low"><i className="bi bi-dot" />{summary.low} Low</span>
            )}
          </div>
        </div>

        {/* Regenerate button — Admin only */}
        {isAdmin && (
          <button
            className="btn btn-brand"
            onClick={runGenerate}
            disabled={aiLoading}
            style={{ whiteSpace: "nowrap", flexShrink: 0 }}
          >
            {aiLoading
              ? <><span className="spinner-border spinner-border-sm me-2" />Generating...</>
              : <><i className="bi bi-arrow-clockwise me-2" />Regenerate AI Insights</>
            }
          </button>
        )}
      </div>

      {/* ── Main Content Grid ──────────────────────────────────────────────── */}
      <div className="row g-4">

        {/* ── Left Column ─────────────────────────────────────────────────── */}
        <div className="col-12 col-lg-7 d-flex flex-column gap-4">

          {/* Executive Summary */}
          <div className="ai-summary-card">
            <div className="ai-summary-label">
              <i className="bi bi-robot" />
              AI Executive Summary
            </div>
            {aiLoading ? (
              <AISkeleton />
            ) : aiError ? (
              <p style={{ color: "#dc2626", fontSize: "0.875rem", margin: 0 }}>{aiError}</p>
            ) : aiData ? (
              <p className="ai-summary-text">{aiData.summary}</p>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
                Generating executive summary…
              </p>
            )}
          </div>

          {/* AI Recommendations */}
          <div>
            <SectionTitle icon="bi-lightbulb">AI Recommendations</SectionTitle>

            {aiLoading ? (
              <div className="d-flex flex-column gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="ai-rec-card low" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="d-flex gap-3 align-items-start">
                      <div className="ai-skeleton" style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0 }} />
                      <div className="flex-1">
                        <div className="ai-skeleton mb-2" style={{ height: 14, width: "60%" }} />
                        <div className="ai-skeleton" style={{ height: 12, width: "80%" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {recommendations.map((rec, i) => {
                  const meta = PRIORITY_META[rec.priority] ?? PRIORITY_META.low;
                  return (
                    <div
                      key={rec.id}
                      className={`ai-rec-card ${rec.priority}`}
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <div className="d-flex gap-3 align-items-start">
                        <div className="ai-rec-icon" style={{ background: meta.iconBg }}>
                          <i className={`bi ${rec.icon}`} style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1 min-width-0">
                          <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                            <span className="ai-rec-title">{rec.title}</span>
                            <span className={`priority-badge ${rec.priority}`}>{rec.priority}</span>
                          </div>
                          <p className="ai-rec-desc">{rec.description}</p>
                          <div className="ai-rec-action">
                            <i className="bi bi-arrow-right-circle" />
                            {rec.action}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback: show rule-based insight cards */
              <div className="d-flex flex-column gap-3">
                {ruleInsights.map((insight, i) => {
                  const meta = PRIORITY_META[insight.priority] ?? PRIORITY_META.low;
                  return (
                    <div key={insight.id} className={`ai-rec-card ${insight.priority}`} style={{ animationDelay: `${i * 70}ms` }}>
                      <div className="d-flex gap-3 align-items-start">
                        <div className="ai-rec-icon" style={{ background: meta.iconBg }}>
                          <i className={`bi ${insight.icon}`} style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="ai-rec-title">{insight.title}</span>
                            <span className={`priority-badge ${insight.priority}`}>{insight.priority}</span>
                          </div>
                          <p className="ai-rec-desc">{insight.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI chat available via the floating assistant button (bottom-right) */}
          <div className="ai-chat-tip">
            <i className="bi bi-chat-dots-fill" style={{ fontSize: "1.1rem", flexShrink: 0 }} />
            <span>
              <strong>Ask the AI Assistant</strong> — click the floating{" "}
              <i className="bi bi-stars" /> button in the bottom-right corner to open the chat.
            </span>
          </div>
        </div>

        {/* ── Right Column ─────────────────────────────────────────────────── */}
        <div className="col-12 col-lg-5 d-flex flex-column gap-4">

          {/* Revenue by Category Chart */}
          {categoryRevData.length > 0 && (
            <div className="chart-wrap" style={{ animation: "fadeUp 0.4s ease both", animationDelay: "200ms" }}>
              <div className="chart-title">Revenue by Category</div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={categoryRevData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="category" axisLine={false} tickLine={false}
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false}
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    tickFormatter={(v) => `$${v / 1000}K`} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Key Business Metrics */}
          <div className="erp-card" style={{ animation: "fadeUp 0.4s ease both", animationDelay: "260ms" }}>
            <div className="erp-card-body">
              <SectionTitle icon="bi-bar-chart">Key Business Metrics</SectionTitle>
              <div className="d-flex flex-column gap-3">
                {[
                  { label: "Total Products",     value: products.length,                                                            suffix: "items",    icon: "bi-box-seam",          color: "#4f46e5" },
                  { label: "Completed Revenue",  value: `$${Math.round(orders.filter((o)=>o.status==="Completed").reduce((s,o)=>s+o.totalAmount,0)).toLocaleString()}`, icon: "bi-currency-dollar", color: "#16a34a" },
                  { label: "Active Users",       value: users.filter((u)=>u.status==="Active").length,                              suffix: "accounts", icon: "bi-people",            color: "#7c3aed" },
                  { label: "Low Stock Products", value: products.filter((p)=>p.stock>0&&p.stock<=10).length,                        suffix: "items",    icon: "bi-exclamation-triangle", color: "#d97706" },
                  { label: "Cancellation Rate",  value: `${orders.length?((orders.filter((o)=>o.status==="Cancelled").length/orders.length)*100).toFixed(1):0}%`, icon: "bi-graph-down", color: "#ef4444" },
                ].map((m) => (
                  <div key={m.label} className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <i className={`bi ${m.icon}`} style={{ color: m.color, fontSize: "0.875rem", width: 16, textAlign: "center" }} />
                      <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{m.label}</span>
                    </div>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 700, fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                      {m.value}{m.suffix ? ` ${m.suffix}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Admin Action Plan */}
          {isAdmin && (
            <div className="ai-action-plan">
              <SectionTitle icon="bi-list-check">Admin Action Plan</SectionTitle>

              {aiLoading ? (
                <div className="d-flex flex-column gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="d-flex gap-3">
                      <div className="ai-skeleton" style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }} />
                      <div className="flex-1">
                        <div className="ai-skeleton mb-1" style={{ height: 12, width: "55%" }} />
                        <div className="ai-skeleton" style={{ height: 11, width: "75%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : actionPlan.length > 0 ? (
                actionPlan.map((step) => (
                  <div key={step.step} className="ai-plan-step">
                    <div className="ai-step-num">{step.step}</div>
                    <div>
                      <div className="ai-step-title">{step.title}</div>
                      <div className="ai-step-desc">{step.description}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
                  Action plan will appear after AI analysis completes.
                </p>
              )}

            </div>
          )}
        </div>
      </div>

      </>}
    </div>
  );
}
