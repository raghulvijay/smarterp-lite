import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { useCurrency } from "../../context/CurrencyContext";

function CurrencySelector() {
  const { code, currencies, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="theme-toggle"
        title="Currency"
        onClick={() => setOpen((o) => !o)}
        style={{ fontSize: "0.8rem", fontWeight: 700, gap: 3, width: "auto", padding: "0 9px" }}
      >
        {code}
        <i className="bi bi-chevron-down" style={{ fontSize: "0.55rem" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 2000, minWidth: 180, overflow: "hidden",
        }}>
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => { setCurrency(c.code); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "9px 14px",
                background: code === c.code ? "var(--table-stripe)" : "transparent",
                border: "none", cursor: "pointer",
                fontSize: "0.8125rem", color: "var(--text-primary)", textAlign: "left",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => { if (c.code !== code) e.currentTarget.style.background = "var(--table-stripe)"; }}
              onMouseLeave={(e) => { if (c.code !== code) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontWeight: 700, width: 26, flexShrink: 0, color: "#4f46e5" }}>{c.symbol}</span>
              <span>{c.label}</span>
              {code === c.code && <i className="bi bi-check2 ms-auto" style={{ color: "#4f46e5" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationsDropdown({ products, orders }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("erp_dismissed_alerts") || "[]"); } catch { return []; }
  });
  const ref = useRef(null);

  const dismiss = (key) => {
    const next = [...dismissed, key];
    setDismissed(next);
    localStorage.setItem("erp_dismissed_alerts", JSON.stringify(next));
  };

  const allAlerts = [];
  const outOfStock  = products.filter((p) => p.stock === 0);
  const lowStock    = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const needRestock = products.filter((p) => p.stock <= (p.minStock ?? 10) && p.stock > 10);
  const pending     = orders.filter((o) => o.status === "Pending");
  const cancelled   = orders.filter((o) => o.status === "Cancelled");

  if (outOfStock.length)
    allAlerts.push({ key: "out-of-stock", icon: "bi-exclamation-circle-fill", color: "#dc2626", bg: "rgba(220,38,38,0.12)",
      text: `${outOfStock.length} product(s) are out of stock`, sub: outOfStock.map((p) => p.name).slice(0, 2).join(", ") });
  if (needRestock.length)
    allAlerts.push({ key: "needs-restock", icon: "bi-arrow-repeat", color: "#f97316", bg: "rgba(249,115,22,0.12)",
      text: `${needRestock.length} product(s) need restocking`, sub: needRestock.map((p) => `${p.name} (${p.stock} left)`).slice(0, 2).join(", ") });
  if (lowStock.length)
    allAlerts.push({ key: "low-stock", icon: "bi-exclamation-triangle-fill", color: "#d97706", bg: "rgba(217,119,6,0.12)",
      text: `${lowStock.length} product(s) with low stock`, sub: lowStock.map((p) => `${p.name} (${p.stock} left)`).slice(0, 2).join(", ") });
  if (pending.length)
    allAlerts.push({ key: "pending-orders", icon: "bi-clock-fill", color: "#4f46e5", bg: "rgba(79,70,229,0.12)",
      text: `${pending.length} order(s) pending review`, sub: pending.map((o) => o.id).slice(0, 2).join(", ") });
  if (cancelled.length)
    allAlerts.push({ key: "cancelled-orders", icon: "bi-x-circle-fill", color: "#6b7280", bg: "rgba(107,114,128,0.12)",
      text: `${cancelled.length} cancelled order(s)`, sub: "Review cancellation reasons" });

  const alerts = allAlerts.filter((a) => !dismissed.includes(a.key));

  const count = alerts.length;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="theme-toggle"
        title="Notifications"
        style={{ position: "relative" }}
        onClick={() => setOpen((o) => !o)}
        aria-label={`${count} notifications`}
      >
        <i className="bi bi-bell" />
        {count > 0 && (
          <span style={{
            position: "absolute", top: 5, right: 5,
            width: 8, height: 8, borderRadius: "50%",
            background: "#ef4444", border: "2px solid var(--header-bg)",
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 320, background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 2000,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px 12px",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
              Notifications
            </div>
            {count > 0 && (
              <span style={{ background: "#ef4444", color: "white", borderRadius: 100, padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700 }}>
                {count} new
              </span>
            )}
          </div>

          {/* Alert list */}
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {alerts.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                <i className="bi bi-check-circle" style={{ fontSize: "1.5rem", display: "block", marginBottom: 8, color: "#10b981" }} />
                All clear — no alerts right now!
              </div>
            ) : alerts.map((a, i) => (
              <div key={a.key} style={{
                display: "flex", gap: 12, padding: "12px 16px",
                borderBottom: i < alerts.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "default",
                transition: "background 0.15s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--table-stripe)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 8, background: a.bg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <i className={`bi ${a.icon}`} style={{ color: a.color, fontSize: "0.95rem" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{a.text}</div>
                  {a.sub && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.sub}</div>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(a.key); }}
                  title="Dismiss"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px 4px", flexShrink: 0, fontSize: "0.8rem", alignSelf: "flex-start" }}
                >
                  <i className="bi bi-x" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Alerts are generated from live ERP data
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header({ onToggleSidebar, sidebarOpen, onOpenSearch, onOpenExport, onStartTour }) {
  const { currentUser, role, isAdmin, logout } = useAuth();
  const { products, orders } = useApp();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const initials = currentUser?.initials ?? "??";
  const name     = currentUser?.name ?? "User";

  return (
    <header className="erp-header">
      {/* Hamburger — mobile only */}
      <button
        className="sidebar-hamburger d-flex d-md-none"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        aria-expanded={sidebarOpen}
      >
        <i className={`bi ${sidebarOpen ? "bi-x-lg" : "bi-list"}`} />
      </button>

      {/* Left: page context label */}
      <div className="header-title">
        <span className="d-none d-sm-inline" style={{
          fontSize: "0.75rem", fontWeight: 400,
          color: "var(--text-muted)", letterSpacing: "0.05em",
        }}>
          ENTERPRISE RESOURCE PLATFORM
        </span>
      </div>

      <div className="header-controls">
        {/* Global Search button */}
        {onOpenSearch && (
          <button
            data-tour="search-btn"
            className="theme-toggle d-none d-sm-flex"
            title="Search (Ctrl+K)"
            onClick={onOpenSearch}
            aria-label="Open global search"
            style={{ gap: 6, width: "auto", padding: "0 10px", fontSize: "0.8rem", color: "var(--text-muted)" }}
          >
            <i className="bi bi-search" style={{ fontSize: "0.875rem" }} />
            <span className="d-none d-lg-inline" style={{ fontSize: "0.8rem" }}>Search</span>
            <span className="d-none d-lg-inline" style={{
              fontSize: "0.7rem", padding: "1px 5px", borderRadius: 4,
              background: "var(--table-stripe)", border: "1px solid var(--border)",
            }}>⌘K</span>
          </button>
        )}

        {onOpenExport && (
          <button
            data-tour="export-btn"
            className="theme-toggle d-none d-sm-flex"
            title="Export Center"
            onClick={onOpenExport}
            aria-label="Open export center"
            style={{ gap: 6, width: "auto", padding: "0 10px", fontSize: "0.8rem", color: "var(--text-muted)" }}
          >
            <i className="bi bi-download" style={{ fontSize: "0.875rem" }} />
            <span className="d-none d-lg-inline" style={{ fontSize: "0.8rem" }}>Export</span>
          </button>
        )}

        <CurrencySelector />

        <NotificationsDropdown products={products ?? []} orders={orders ?? []} />

        <div className="d-none d-sm-block" style={{ width: 1, height: 24, background: "var(--border)" }} />

        {/* User dropdown */}
        <Dropdown align="end">
          <Dropdown.Toggle
            as="div"
            bsPrefix="user-toggle"
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: isAdmin
                ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
                : "linear-gradient(135deg, #0ea5e9, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: "0.8125rem",
              fontFamily: "var(--font-heading)", flexShrink: 0, userSelect: "none",
            }}>
              {initials}
            </div>

            {/* Name + role (hidden on small screens) */}
            <div className="d-none d-md-block" style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{role}</div>
            </div>

            <i className="bi bi-chevron-down d-none d-sm-inline" style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginLeft: 2 }} />
          </Dropdown.Toggle>

          <Dropdown.Menu style={{ minWidth: 200, padding: "6px" }}>
            {/* User info header */}
            <div style={{
              padding: "10px 12px 12px",
              borderBottom: "1px solid var(--border)",
              marginBottom: 4,
            }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {name}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
                {currentUser?.email}
              </div>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6,
                padding: "2px 8px", borderRadius: 100, fontSize: "0.7rem", fontWeight: 700,
                background: isAdmin ? "rgba(79,70,229,0.1)" : "rgba(107,114,128,0.1)",
                color: isAdmin ? "#4f46e5" : "#6b7280",
              }}>
                <i className={`bi bi-${isAdmin ? "shield-check" : "eye"}`} />
                {role}
              </span>
            </div>

            {onStartTour && (
              <Dropdown.Item
                onClick={() => { onStartTour(); }}
                style={{ borderRadius: 6, color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}
              >
                <i className="bi bi-compass me-2" style={{ color: "#7c3aed" }} />Take Tour
              </Dropdown.Item>
            )}

            <Dropdown.Divider style={{ margin: "4px 0" }} />

            <Dropdown.Item
              onClick={handleLogout}
              disabled={loggingOut}
              style={{ borderRadius: 6, color: "#dc2626", fontWeight: 500, fontSize: "0.875rem" }}
            >
              {loggingOut
                ? <><span className="spinner-border spinner-border-sm me-2" />Signing out...</>
                : <><i className="bi bi-box-arrow-right me-2" />Sign Out</>
              }
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
}
