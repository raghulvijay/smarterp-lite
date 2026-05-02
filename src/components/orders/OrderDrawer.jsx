import { Offcanvas } from "react-bootstrap";
import { useState } from "react";

const ALL_STATUSES = ["Pending", "Processing", "Completed", "Cancelled"];

const STATUS_TIMELINE = { Pending: 0, Processing: 1, Completed: 2, Cancelled: -1 };

const STATUS_META = {
  Pending:    { color: "#9a3412", bg: "rgba(249,115,22,0.12)" },
  Processing: { color: "#854d0e", bg: "rgba(234,179,8,0.12)"  },
  Completed:  { color: "#166534", bg: "rgba(22,163,74,0.12)"  },
  Cancelled:  { color: "#991b1b", bg: "rgba(220,38,38,0.12)"  },
};

const IMG_BASE = "https://cdn.dummyjson.com/product-images";

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function OrderDrawer({ show, onHide, order, isAdmin, onStatusChange, onOpenInvoice }) {
  const [changing, setChanging] = useState(false);

  if (!order) return null;

  const stepIdx    = STATUS_TIMELINE[order.status] ?? -1;
  const isCancelled = order.status === "Cancelled";
  const meta        = STATUS_META[order.status] ?? STATUS_META.Pending;

  // Simulated timeline entries
  const timelineSteps = isCancelled
    ? [
        { label: "Order Placed",   date: fmt(order.orderDate),         icon: "bi-bag-check",   done: true  },
        { label: "Order Cancelled", date: addDays(order.orderDate, 1), icon: "bi-x-circle",    done: true, danger: true },
      ]
    : [
        { label: "Order Placed",      date: fmt(order.orderDate),        icon: "bi-bag-check",    done: true              },
        { label: "Processing Started", date: addDays(order.orderDate, 1), icon: "bi-gear",         done: stepIdx >= 1      },
        { label: "Completed",          date: addDays(order.orderDate, 3), icon: "bi-check-circle", done: stepIdx >= 2      },
      ];

  const handleStatusChange = async (newStatus) => {
    if (!isAdmin || newStatus === order.status) return;
    setChanging(true);
    try { await onStatusChange(order.id, newStatus); }
    finally { setChanging(false); }
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end" style={{ width: 480, maxWidth: "95vw" }}>
      <Offcanvas.Header style={{ borderBottom: "1px solid var(--border)", padding: "16px 20px" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--text-primary)" }}>{order.id}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
            {new Date(order.orderDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
        <span style={{
          marginLeft: "auto", marginRight: 12,
          background: meta.bg, color: meta.color,
          borderRadius: 100, padding: "4px 12px", fontSize: "0.8125rem", fontWeight: 700,
        }}>
          {order.status}
        </span>
        <button onClick={onHide} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem", padding: 4 }}>
          <i className="bi bi-x-lg" />
        </button>
      </Offcanvas.Header>

      <Offcanvas.Body style={{ padding: 0, overflowY: "auto" }}>

        {/* ── Product ─────────────────────────────────── */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Product</div>
          <div className="d-flex gap-3 align-items-start">
            {order.productId && (
              <img
                src={`${IMG_BASE}/${order.productId}/1.webp`}
                alt={order.productName}
                onError={(e) => { e.target.style.display = "none"; }}
                style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)", marginBottom: 4 }}>{order.productName}</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Qty: <strong style={{ color: "var(--text-primary)" }}>{order.quantity}</strong></span>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Unit: <strong style={{ color: "var(--text-primary)" }}>${Number(order.unitPrice).toFixed(2)}</strong></span>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Total: <strong style={{ color: "#16a34a" }}>${Number(order.totalAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Customer ─────────────────────────────────── */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Customer</div>
          <div className="d-flex align-items-center gap-3">
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0,
            }}>
              {order.customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)" }}>{order.customerName}</div>
              {order.customerEmail && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}><i className="bi bi-envelope me-1" />{order.customerEmail}</div>}
              {order.customerPhone && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 1 }}><i className="bi bi-telephone me-1" />{order.customerPhone}</div>}
            </div>
          </div>
        </div>

        {/* ── Timeline ─────────────────────────────────── */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Order Timeline</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {timelineSteps.map((step, i) => {
              const isLast = i === timelineSteps.length - 1;
              const dotColor = step.danger ? "#dc2626" : step.done ? "#4f46e5" : "#d1d5db";
              return (
                <div key={step.label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  {/* Dot + line */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 24 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                      background: step.done ? dotColor : "var(--bg-card)",
                      border: `2px solid ${dotColor}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: step.done && !step.danger ? "0 0 0 3px rgba(79,70,229,0.15)" : "none",
                    }}>
                      <i className={`bi ${step.icon}`} style={{ fontSize: "0.7rem", color: step.done ? "white" : dotColor }} />
                    </div>
                    {!isLast && <div style={{ width: 2, height: 28, background: step.done ? dotColor : "var(--border)", marginTop: 3 }} />}
                  </div>
                  {/* Text */}
                  <div style={{ paddingBottom: isLast ? 0 : 20, paddingTop: 2 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: step.done ? "var(--text-primary)" : "var(--text-muted)" }}>{step.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 1 }}>{step.done ? step.date : "Pending"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────── */}
        <div style={{ padding: "16px 20px" }}>
          {isAdmin && (
            <>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Change Status</div>
              <div className="d-flex gap-2 flex-wrap mb-4">
                {ALL_STATUSES.map((s) => {
                  const m       = STATUS_META[s];
                  const isActive = order.status === s;
                  return (
                    <button
                      key={s}
                      disabled={isActive || changing}
                      onClick={() => handleStatusChange(s)}
                      style={{
                        border: isActive ? `2px solid ${m.color}` : "1.5px solid var(--border)",
                        background: isActive ? m.bg : "var(--bg-card)",
                        color: isActive ? m.color : "var(--text-secondary)",
                        borderRadius: 8, padding: "6px 14px",
                        fontSize: "0.8125rem", fontWeight: 600, cursor: isActive ? "default" : "pointer",
                        opacity: changing && !isActive ? 0.5 : 1, transition: "all 0.15s",
                      }}
                    >
                      {changing && !isActive ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                      {s}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* View Invoice + Close */}
          <div className="d-flex gap-2">
            {onOpenInvoice && (
              <button
                className="btn btn-sm btn-brand"
                onClick={() => { onOpenInvoice(order); onHide(); }}
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <i className="bi bi-receipt" /> View Invoice
              </button>
            )}
            <button
              className="btn btn-sm"
              onClick={onHide}
              style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: 8, fontWeight: 500 }}
            >
              Close
            </button>
          </div>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
