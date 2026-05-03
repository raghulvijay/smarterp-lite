import { Modal } from "react-bootstrap";
import { useCurrency } from "../../context/CurrencyContext";

const GST_RATE = 0.18;

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function InvoiceModal({ show, onHide, order }) {
  const { fmt } = useCurrency();
  if (!order) return null;

  const subtotal  = order.totalAmount;
  const gst       = parseFloat((subtotal * GST_RATE).toFixed(2));
  const total     = parseFloat((subtotal + gst).toFixed(2));
  const issueDate = new Date(order.orderDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const dueDate   = addDays(order.orderDate, 30);

  const handlePrint = () => {
    const prev = document.title;
    document.title = `Invoice-${order.id}`;
    window.print();
    document.title = prev;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="invoice-modal no-print-outside">
      <Modal.Header className="no-print" style={{ borderBottom: "1px solid var(--border)", padding: "14px 24px" }}>
        <Modal.Title style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
          <i className="bi bi-receipt me-2" style={{ color: "#4f46e5" }} />
          Invoice — {order.id}
        </Modal.Title>
        <div className="d-flex gap-2 ms-auto flex-wrap">
          <button
            className="btn btn-sm"
            onClick={handlePrint}
            style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-primary)", borderRadius: 7, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}
          >
            <i className="bi bi-printer" /> Print
          </button>
          <button
            className="btn btn-sm btn-brand"
            onClick={handlePrint}
            style={{ display: "flex", alignItems: "center", gap: 5 }}
            title="Opens browser print dialog — choose 'Save as PDF'"
          >
            <i className="bi bi-file-earmark-pdf" /> Download PDF
          </button>
          <button
            className="btn btn-sm"
            onClick={onHide}
            style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-muted)", borderRadius: 7 }}
          >
            <i className="bi bi-x" />
          </button>
        </div>
      </Modal.Header>

      <Modal.Body style={{ padding: 0 }}>
        <div id="invoice-print-area" className="invoice-body">

          {/* ── Gradient header (screen only) ── */}
          <div className="invoice-header-screen" style={{
            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
            padding: "28px 36px", color: "white",
          }}>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.01em" }}>SmartERP Lite</div>
                <div style={{ fontSize: "0.8125rem", opacity: 0.75, marginTop: 2 }}>123 Business Park, Suite 400</div>
                <div style={{ fontSize: "0.8125rem", opacity: 0.75 }}>San Francisco, CA 94105 · USA</div>
                <div style={{ fontSize: "0.8125rem", opacity: 0.75 }}>billing@smarterplite.com</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: "1.375rem", letterSpacing: "0.05em" }}>INVOICE</div>
                <div style={{ fontSize: "0.9375rem", marginTop: 4, opacity: 0.9 }}>{order.id}</div>
              </div>
            </div>
          </div>

          {/* ── Print-only header (B&W) ── */}
          <div className="invoice-header-print" style={{ display: "none", padding: "0 0 20px", borderBottom: "2px solid #000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.375rem" }}>SmartERP Lite</div>
                <div style={{ fontSize: "0.8125rem", color: "#555", marginTop: 2 }}>123 Business Park, Suite 400</div>
                <div style={{ fontSize: "0.8125rem", color: "#555" }}>San Francisco, CA 94105 · USA</div>
                <div style={{ fontSize: "0.8125rem", color: "#555" }}>billing@smarterplite.com</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: "1.375rem", letterSpacing: "0.05em" }}>INVOICE</div>
                <div style={{ fontSize: "0.9rem", marginTop: 4 }}>{order.id}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "24px 36px" }}>

            {/* Dates + Bill To */}
            <div className="row g-4 mb-4">
              <div className="col-sm-5">
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Bill To
                </div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{order.customerName}</div>
                {order.customerEmail && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 3 }}>
                    <i className="bi bi-envelope me-1" />{order.customerEmail}
                  </div>
                )}
                {order.customerPhone && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
                    <i className="bi bi-telephone me-1" />{order.customerPhone}
                  </div>
                )}
              </div>
              <div className="col-sm-4">
                {[
                  { label: "Issue Date", value: issueDate },
                  { label: "Due Date",   value: dueDate   },
                ].map((r) => (
                  <div key={r.label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>{r.label}</div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", marginTop: 2 }}>{r.value}</div>
                  </div>
                ))}
              </div>
              <div className="col-sm-3" style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Status</div>
                <span style={{
                  display: "inline-block", padding: "4px 14px", borderRadius: 100,
                  fontSize: "0.8125rem", fontWeight: 700,
                  background: order.status === "Completed" ? "rgba(22,163,74,0.12)" : order.status === "Cancelled" ? "rgba(220,38,38,0.12)" : "rgba(234,179,8,0.12)",
                  color:      order.status === "Completed" ? "#166534" : order.status === "Cancelled" ? "#991b1b" : "#854d0e",
                }}>
                  {order.status}
                </span>
              </div>
            </div>

            {/* Line items */}
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflowX: "auto", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "var(--table-stripe)" }}>
                    {["Description", "Qty", "Unit Price", "Amount"].map((h, i) => (
                      <th key={h} style={{
                        padding: "10px 16px",
                        textAlign: i === 0 ? "left" : i === 1 ? "center" : "right",
                        fontWeight: 700, color: "var(--text-muted)", fontSize: "0.72rem",
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        width: i === 1 ? 80 : i === 2 ? 110 : i === 3 ? 120 : "auto",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", color: "var(--text-primary)", fontWeight: 500 }}>{order.productName}</td>
                    <td style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--text-secondary)" }}>{order.quantity}</td>
                    <td style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", textAlign: "right", color: "var(--text-secondary)" }}>{fmt(Number(order.unitPrice))}</td>
                    <td style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", textAlign: "right", fontWeight: 600, color: "var(--text-primary)" }}>
                      {fmt(subtotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", maxWidth: 270 }}>
                {[
                  { label: "Subtotal",                               value: fmt(subtotal) },
                  { label: `GST (${(GST_RATE * 100).toFixed(0)}%)`, value: fmt(gst) },
                ].map((row) => (
                  <div key={row.label} className="d-flex justify-content-between" style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 6 }}>
                    <span>{row.label}</span><span style={{ fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ borderTop: "2px solid var(--border)", marginTop: 8, paddingTop: 10 }} className="d-flex justify-content-between">
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>Grand Total</span>
                  <span style={{ fontWeight: 800, fontSize: "1.125rem", color: "#16a34a" }}>
                    {fmt(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--border)", textAlign: "center" }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: 4 }}>
                Thank you for your business!
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Payment due within 30 days · Questions? Contact support@smarterplite.com
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
