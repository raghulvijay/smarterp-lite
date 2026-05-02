import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, LabelList,
} from "recharts";

import Breadcrumb   from "../../components/common/Breadcrumb";
import SummaryCard  from "../../components/common/SummaryCard";
import Loader       from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import { useApp }      from "../../context/AppContext";
import { useAuth }     from "../../context/AuthContext";
import { useAuditLog } from "../../context/AuditLogContext";
import { useCurrency } from "../../context/CurrencyContext";
import { generateInsights } from "../../utils/aiInsights";
import { computeRevenue, getDailySparkline, pctChange } from "../../utils/revenueUtils";

const PIE_COLORS   = ["#f59e0b", "#4f46e5", "#10b981", "#ef4444"];
const STATUS_ORDER = ["Pending", "Processing", "Completed", "Cancelled"];

const DATE_RANGES = [
  { label: "7 days",    value: "7d"  },
  { label: "30 days",   value: "30d" },
  { label: "3 months",  value: "3m"  },
  { label: "6 months",  value: "6m"  },
  { label: "This year", value: "ytd" },
];

const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", boxShadow: "var(--shadow-md)" }}>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: "0.9rem", fontWeight: 700, color: "#4f46e5" }}>${payload[0].value.toLocaleString()}</p>
    </div>
  );
};

export default function Dashboard() {
  const { products, orders, users, loading, error, refetch,
          totalRevenue, pendingOrders, inactiveUsers, restockProducts } = useApp();
  const { isAdmin }  = useAuth();
  const { log }      = useAuditLog();
  const { fmt }      = useCurrency();
  const navigate     = useNavigate();

  const [dateRange, setDateRange] = useState("6m");

  const chartData = useMemo(() => computeRevenue(orders, dateRange), [orders, dateRange]);

  const orderStatusData = useMemo(() =>
    STATUS_ORDER
      .map((s) => ({ name: s, value: orders.filter((o) => o.status === s).length }))
      .filter((d) => d.value > 0),
  [orders]);

  const top5Products = useMemo(() => {
    const map = {};
    orders.filter((o) => o.status === "Completed").forEach((o) => {
      if (!map[o.productName]) map[o.productName] = { name: o.productName, revenue: 0 };
      map[o.productName].revenue += o.totalAmount;
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(({ name, revenue }) => {
        const prod = products.find((p) => (p.name || p.title) === name);
        return {
          name:     name.length > 22 ? name.slice(0, 22) + "…" : name,
          fullName: name,
          revenue:  Math.round(revenue),
          id:       prod?.id ?? null,
        };
      });
  }, [orders, products]);

  const sparklines = useMemo(() => {
    const rev  = getDailySparkline(orders, "revenue", 7);
    const ord  = getDailySparkline(orders, "orders",  7);
    const pend = getDailySparkline(orders, "pending", 7);
    const prodArr = Array.from({ length: 7 }, (_, i) => Math.max(0, products.length - (6 - i) * 0.3));
    const userArr = Array.from({ length: 7 }, (_, i) => Math.max(0, users.length   - (6 - i) * 0.2));
    return { rev, ord, pend, prod: prodArr, user: userArr };
  }, [orders, products, users]);

  const completionRate = orders.length
    ? Math.round((orders.filter((o) => o.status === "Completed").length / orders.length) * 100)
    : 0;

  const insights      = generateInsights({ products, orders, users });
  const outOfStockCnt = products.filter((p) => p.stock === 0).length;
  const urgentParts   = [];
  if (outOfStockCnt > 0) urgentParts.push(`${outOfStockCnt} out-of-stock product(s)`);
  if (pendingOrders > 0) urgentParts.push(`${pendingOrders} pending order(s)`);
  const aiSummary = urgentParts.length > 0
    ? `${urgentParts.join(" and ")} need immediate attention.`
    : `Business looks healthy with $${(totalRevenue / 1000).toFixed(1)}K in completed revenue.`;

  if (loading) return <Loader message="Loading dashboard..." />;
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />;

  const kpiCards = [
    { icon: "bi-box-seam",        label: "Total Products",  value: products.length,   color: "indigo", delay: 0,   sparkline: sparklines.prod, sparklinePct: pctChange(sparklines.prod) },
    { icon: "bi-receipt",         label: "Total Orders",    value: orders.length,     color: "blue",   delay: 60,  sparkline: sparklines.ord,  sparklinePct: pctChange(sparklines.ord)  },
    { icon: "bi-people",          label: "Total Users",     value: users.length,      color: "violet", delay: 120, sparkline: sparklines.user, sparklinePct: pctChange(sparklines.user) },
    { icon: "bi-currency-dollar", label: "Revenue",         value: fmt(totalRevenue), color: "green",  delay: 180, sparkline: sparklines.rev,  sparklinePct: pctChange(sparklines.rev)  },
    { icon: "bi-hourglass-split", label: "Pending Orders",  value: pendingOrders,     color: "amber",  delay: 240, sparkline: sparklines.pend, sparklinePct: pctChange(sparklines.pend) },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard" }]} />

      <div className="mb-4">
        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.5rem", color: "var(--text-primary)", margin: "0 0 2px" }}>
          Dashboard
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div data-tour="kpi-cards" className="row g-3 mb-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="col-6 col-sm-4 col-xl">
            <SummaryCard
              icon={card.icon}
              label={card.label}
              value={card.value}
              color={card.color}
              animDelay={card.delay}
              sparkline={card.sparkline}
              sparklinePct={card.sparklinePct}
            />
          </div>
        ))}
      </div>

      {/* ── Revenue Chart + Order Status ───────────────────────────── */}
      <div className="row g-3 mb-3">
        <div className="col-lg-8">
          <div data-tour="revenue-chart" className="chart-wrap" style={{ height: 320 }}>
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div className="chart-title mb-0">Revenue Trend</div>
              <div className="d-flex gap-1 flex-wrap">
                {DATE_RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setDateRange(r.value)}
                    style={{
                      border: dateRange === r.value ? "2px solid #4f46e5" : "1px solid var(--border)",
                      background: dateRange === r.value ? "rgba(79,70,229,0.1)" : "var(--bg-card)",
                      color: dateRange === r.value ? "#4f46e5" : "var(--text-secondary)",
                      borderRadius: 100, padding: "3px 10px",
                      fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} style={{ cursor: "pointer" }}
                onClick={(e) => { const item = e?.activePayload?.[0]?.payload; if (item?.key) navigate(`/orders?month=${item.key}`); }}
              >
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-body)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + "K" : v}`} />
                <RTooltip content={<RevenueTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fill="url(#revGrad)"
                  dot={{ fill: "#4f46e5", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={600} />
              </AreaChart>
            </ResponsiveContainer>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", marginTop: 4, marginBottom: 0 }}>
              Click a data point to drill into that period's orders
            </p>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="chart-wrap" style={{ height: 320, display: "flex", flexDirection: "column" }}>
            <div className="chart-title">Order Status</div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderStatusData} cx="50%" cy="44%" innerRadius={48} outerRadius={72}
                    paddingAngle={3} dataKey="value" style={{ cursor: "pointer" }}
                    onClick={(slice) => { if (slice?.name) navigate(`/orders?status=${slice.name.toLowerCase()}`); }}
                  >
                    {orderStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <RTooltip formatter={(v) => [`${v} orders`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", padding: "4px 0 6px" }}>
              {orderStatusData.map((entry, i) => (
                <span key={entry.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0, display: "inline-block" }} />
                  {entry.name}
                </span>
              ))}
            </div>
            <div className="d-flex justify-content-between pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              {[
                { label: "Completion", val: `${completionRate}%`, color: "var(--text-primary)" },
                { label: "Total",      val: orders.length,        color: "var(--text-primary)" },
                { label: "Inactive",   val: inactiveUsers,        color: "#ef4444" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "var(--font-heading)", color }}>{val}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{label}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", marginTop: 6, marginBottom: 0 }}>
              Click a slice to filter orders by status
            </p>
          </div>
        </div>
      </div>

      {/* ── AI Summary ─────────────────────────────────────────────── */}
      <div className="erp-card mb-3">
        <div className="erp-card-body" style={{ padding: "16px 20px" }}>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="bi bi-stars" style={{ color: "white", fontSize: "1.1rem" }} />
            </div>
            <div className="flex-1">
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                  Today's AI Recommendation
                </span>
                {urgentParts.length > 0 && (
                  <span style={{ background: "rgba(220,38,38,0.12)", color: "#991b1b", borderRadius: 100, padding: "2px 8px", fontSize: "0.68rem", fontWeight: 700 }}>
                    <i className="bi bi-exclamation-circle me-1" style={{ fontSize: "0.6rem" }} />Action Required
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0 0 8px" }}>
                {aiSummary}{" "}
                <Link to="/ai-insights" style={{ color: "#4f46e5", fontWeight: 500 }}>View full insights →</Link>
              </p>
              {restockProducts?.length > 0 && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9a3412", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <i className="bi bi-arrow-repeat" />
                    Restock Alerts ({restockProducts.length})
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {restockProducts.slice(0, 4).map((p) => (
                      <Link key={p.id} to="/products" style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
                        borderRadius: 6, padding: "2px 8px",
                        fontSize: "0.75rem", fontWeight: 600, color: "#9a3412", textDecoration: "none",
                      }}>
                        <i className="bi bi-box-seam" style={{ fontSize: "0.65rem" }} />
                        {p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name}
                        <span style={{ color: p.stock === 0 ? "#dc2626" : "#d97706", fontSize: "0.7rem" }}>
                          ({p.stock === 0 ? "Out" : p.stock})
                        </span>
                      </Link>
                    ))}
                    {restockProducts.length > 4 && (
                      <Link to="/products" style={{ fontSize: "0.75rem", color: "#9a3412", fontWeight: 600, textDecoration: "none", alignSelf: "center" }}>
                        +{restockProducts.length - 4} more →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top 5 Products + Quick Links ───────────────────────────── */}
      <div className="row g-3 mb-3">
        <div className="col-lg-7">
          <div className="chart-wrap" style={{ height: 320 }}>
            <div className="chart-title">Top 5 Products by Revenue</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={top5Products} margin={{ top: 4, right: 60, left: 4, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false}
                  tick={{ fill: "var(--text-secondary)", fontSize: 11, fontFamily: "var(--font-body)" }} />
                <RTooltip formatter={(v) => [`$${v.toLocaleString()}`, "Revenue"]}
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.8rem" }} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 4, 4, 0]} style={{ cursor: "pointer" }}
                  onClick={(item) => { if (item.id) navigate(`/products?highlight=${item.id}`); }}
                >
                  <LabelList dataKey="revenue" position="right"
                    formatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + "K" : v}`}
                    style={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", marginTop: 4, marginBottom: 0 }}>
              Click a bar to highlight that product
            </p>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="row g-3 h-100 align-content-start">
            {[
              { to: "/products",    icon: "bi-box-seam",  label: "Products",    sub: `${products.length} items`,    color: "rgba(79,70,229,0.12)",  ic: "#4f46e5" },
              { to: "/orders",      icon: "bi-receipt",   label: "Orders",      sub: `${pendingOrders} pending`,    color: "rgba(217,119,6,0.12)",  ic: "#d97706" },
              { to: "/users",       icon: "bi-people",    label: "Users",       sub: `${users.length} accounts`,    color: "rgba(22,163,74,0.12)",  ic: "#16a34a" },
              { to: "/ai-insights", icon: "bi-stars",     label: "AI Insights", sub: `${insights.length} insights`, color: "rgba(124,58,237,0.12)", ic: "#7c3aed" },
            ].map((q, i) => (
              <div key={q.to} className="col-6">
                <Link to={q.to} className="d-flex align-items-center gap-3 p-3 text-decoration-none"
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: 12, boxShadow: "var(--shadow-sm)",
                    transition: "all 0.2s ease", animation: "fadeUp 0.4s ease both",
                    animationDelay: `${i * 50 + 200}ms`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: q.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className={`bi ${q.icon}`} style={{ color: q.ic, fontSize: "1.05rem" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{q.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{q.sub}</div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Activity ────────────────────────────────────────── */}
      <div className="erp-card">
        <div className="erp-card-body" style={{ padding: "16px 20px" }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <i className="bi bi-clock-history" style={{ color: "#4f46e5" }} />
              Recent Activity
            </div>
            {log.length > 0 && (
              <Link to="/ai-insights" style={{ fontSize: "0.8rem", color: "#4f46e5", fontWeight: 500, textDecoration: "none" }}>
                View all {log.length} →
              </Link>
            )}
          </div>
          {log.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)" }}>
              <i className="bi bi-clock-history" style={{ fontSize: "1.75rem", display: "block", marginBottom: 8, opacity: 0.4 }} />
              <span style={{ fontSize: "0.8125rem" }}>No activity yet — edits to products, orders, and users will appear here.</span>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {log.slice(0, 5).map((entry) => {
                const ACTION_COLOR = { CREATE: "#16a34a", UPDATE: "#4f46e5", DELETE: "#dc2626" };
                const ACTION_ICON  = { CREATE: "bi-plus-circle", UPDATE: "bi-pencil", DELETE: "bi-trash3" };
                const color = ACTION_COLOR[entry.action] ?? "#6b7280";
                const icon  = ACTION_ICON[entry.action]  ?? "bi-activity";
                return (
                  <div key={entry.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", background: "var(--table-stripe)", borderRadius: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className={`bi ${icon}`} style={{ color, fontSize: "0.8rem" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.details ?? entry.label ?? entry.action}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 1 }}>
                        {entry.entity} · {new Date(entry.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
