import { useState, useMemo } from "react";
import { Modal } from "react-bootstrap";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useAuditLog } from "../../context/AuditLogContext";
import { exportToCsv } from "../../utils/exportCsv";

const DATASETS = [
  { key: "products", label: "Products",       icon: "bi-box-seam"  },
  { key: "orders",   label: "Orders",         icon: "bi-receipt"   },
  { key: "users",    label: "Users",          icon: "bi-people"    },
  { key: "audit",    label: "Audit Log",      icon: "bi-clock-history" },
  { key: "summary",  label: "Dashboard Summary", icon: "bi-grid-1x2" },
];

const FORMATS = [
  { key: "csv",  label: "CSV",         icon: "bi-filetype-csv" },
  { key: "json", label: "JSON",        icon: "bi-filetype-json" },
  { key: "html", label: "HTML Report", icon: "bi-filetype-html" },
];

const PRODUCT_COLS   = ["id","name","category","price","stock","minStock","description"];
const ORDER_COLS     = ["id","customerName","productName","quantity","unitPrice","totalAmount","status","orderDate"];
const USER_COLS      = ["id","firstName","lastName","email","role"];
const AUDIT_COLS     = ["id","timestamp","action","entity","entityId","details","user"];

function getColumns(ds) {
  if (ds === "products") return PRODUCT_COLS;
  if (ds === "orders")   return ORDER_COLS;
  if (ds === "users")    return USER_COLS;
  if (ds === "audit")    return AUDIT_COLS;
  return [];
}

function downloadBlob(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function buildHTMLReport({ dataset, rows, columns, label }) {
  const header = columns.map((c) => `<th>${c}</th>`).join("");
  const body = rows.map((row) =>
    `<tr>${columns.map((c) => `<td>${row[c] ?? ""}</td>`).join("")}</tr>`
  ).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>SmartERP Export — ${label}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 40px; color: #1f2937; }
  h1 { font-size: 1.5rem; margin-bottom: 4px; }
  p { color: #6b7280; font-size: 0.875rem; margin-top: 0; }
  table { border-collapse: collapse; width: 100%; font-size: 0.8125rem; }
  th { background: #f3f4f6; padding: 8px 12px; text-align: left; font-weight: 700; border-bottom: 2px solid #e5e7eb; }
  td { padding: 7px 12px; border-bottom: 1px solid #f3f4f6; }
  tr:hover td { background: #f9fafb; }
</style></head>
<body>
<h1>SmartERP — ${label} Export</h1>
<p>Generated ${new Date().toLocaleString()} · ${rows.length} records</p>
<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>
</body></html>`;
}

function buildDashboardHTML({ products, orders, users, log }) {
  const totalRevenue = orders.filter((o) => o.status === "Completed").reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const pending = orders.filter((o) => o.status === "Pending").length;
  const cancelled = orders.filter((o) => o.status === "Cancelled").length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>SmartERP Dashboard Summary</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 40px; color: #1f2937; }
  h1 { font-size: 1.5rem; }
  .grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin: 24px 0; }
  .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; }
  .card .val { font-size: 1.75rem; font-weight: 700; color: #4f46e5; }
  .card .lbl { font-size: 0.8rem; color: #6b7280; margin-top: 4px; }
  table { border-collapse: collapse; width: 100%; font-size: 0.8125rem; margin-top: 16px; }
  th { background: #f3f4f6; padding: 8px 12px; text-align: left; }
  td { padding: 7px 12px; border-bottom: 1px solid #f3f4f6; }
</style></head>
<body>
<h1>SmartERP Dashboard Summary</h1>
<p style="color:#6b7280">Generated ${new Date().toLocaleString()}</p>
<div class="grid">
  <div class="card"><div class="val">${products.length}</div><div class="lbl">Total Products</div></div>
  <div class="card"><div class="val">${orders.length}</div><div class="lbl">Total Orders</div></div>
  <div class="card"><div class="val">${users.length}</div><div class="lbl">Total Users</div></div>
  <div class="card"><div class="val">$${(totalRevenue / 1000).toFixed(1)}K</div><div class="lbl">Completed Revenue</div></div>
  <div class="card"><div class="val">${pending}</div><div class="lbl">Pending Orders</div></div>
  <div class="card"><div class="val">${cancelled}</div><div class="lbl">Cancelled Orders</div></div>
  <div class="card"><div class="val">${outOfStock}</div><div class="lbl">Out of Stock</div></div>
  <div class="card"><div class="val">${log.length}</div><div class="lbl">Audit Entries</div></div>
</div>
<h2 style="font-size:1.1rem;margin-top:32px">Recent Activity</h2>
<table>
  <thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>Details</th><th>User</th></tr></thead>
  <tbody>${log.slice(0, 20).map((e) =>
    `<tr><td>${new Date(e.timestamp).toLocaleString()}</td><td>${e.action}</td><td>${e.entity}</td><td>${e.details ?? ""}</td><td>${e.user ?? ""}</td></tr>`
  ).join("")}</tbody>
</table>
</body></html>`;
}

export default function ExportCenterModal({ show, onHide }) {
  const { products, orders, users } = useApp();
  const { isAdmin }                 = useAuth();
  const { log, addEntry }           = useAuditLog();
  const { currentUser }             = useAuth();

  const [dataset,  setDataset]  = useState("products");
  const [format,   setFormat]   = useState("csv");
  const [selectedCols, setSelectedCols] = useState(null);
  const [exporting, setExporting]       = useState(false);

  const defaultCols = useMemo(() => getColumns(dataset), [dataset]);
  const cols = selectedCols ?? defaultCols;

  function toggleCol(c) {
    const base = selectedCols ?? defaultCols;
    if (base.includes(c)) {
      if (base.length === 1) return;
      setSelectedCols(base.filter((x) => x !== c));
    } else {
      setSelectedCols([...base, c]);
    }
  }

  function getRawRows() {
    if (dataset === "products") return products;
    if (dataset === "orders")   return orders;
    if (dataset === "users")    return users;
    if (dataset === "audit")    return log;
    return [];
  }

  function pickCols(rows, keys) {
    return rows.map((r) => Object.fromEntries(keys.map((k) => [k, r[k] ?? ""])));
  }

  async function doExport() {
    setExporting(true);
    try {
      const ds = DATASETS.find((d) => d.key === dataset);
      const ts = new Date().toISOString().slice(0, 10);

      if (dataset === "summary") {
        const html = buildDashboardHTML({ products, orders, users, log });
        downloadBlob(`SmartERP_Summary_${ts}.html`, html, "text/html");
        addEntry({ action: "CREATE", entity: "Export", entityId: `export-${Date.now()}`, details: "Dashboard Summary exported as HTML", user: currentUser?.name });
        onHide();
        return;
      }

      const rows = getRawRows();
      const filename = `SmartERP_${ds.label.replace(/ /g, "_")}_${ts}`;

      if (format === "csv") {
        exportToCsv(`${filename}.csv`, pickCols(rows, cols));
      } else if (format === "json") {
        const data = JSON.stringify(pickCols(rows, cols), null, 2);
        downloadBlob(`${filename}.json`, data, "application/json");
      } else if (format === "html") {
        const html = buildHTMLReport({ dataset, rows: pickCols(rows, cols), columns: cols, label: ds.label });
        downloadBlob(`${filename}.html`, html, "text/html");
      }

      addEntry({ action: "CREATE", entity: "Export", entityId: `export-${Date.now()}`, details: `${ds.label} exported as ${format.toUpperCase()} (${rows.length} rows)`, user: currentUser?.name });
      onHide();
    } finally {
      setExporting(false);
    }
  }

  const rowCount = dataset === "summary" ? null : getRawRows().length;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--text-primary)" }}>
            <i className="bi bi-download me-2" style={{ color: "#4f46e5" }} />
            Smart Export Center
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
            Export any dataset as CSV, JSON, or an HTML report
          </div>
        </div>
        <button onClick={onHide} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem" }}>
          <i className="bi bi-x-lg" />
        </button>
      </Modal.Header>

      <Modal.Body style={{ padding: "20px 24px" }}>
        <div className="row g-4">
          {/* Step 1 — Dataset */}
          <div className="col-12 col-md-4">
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              1 · Dataset
            </div>
            <div className="d-flex flex-column gap-2">
              {DATASETS.filter((d) => d.key !== "audit" || isAdmin).map((d) => (
                <button
                  key={d.key}
                  onClick={() => { setDataset(d.key); setSelectedCols(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    border: dataset === d.key ? "2px solid #4f46e5" : "1.5px solid var(--border)",
                    background: dataset === d.key ? "rgba(79,70,229,0.1)" : "var(--bg-card)",
                    color: dataset === d.key ? "#4f46e5" : "var(--text-secondary)",
                    borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                    fontSize: "0.8125rem", fontWeight: 600, transition: "all 0.12s", textAlign: "left",
                  }}
                >
                  <i className={`bi ${d.icon}`} />
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Format */}
          <div className="col-12 col-md-4">
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              2 · Format
            </div>
            <div className="d-flex flex-column gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFormat(f.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    border: format === f.key ? "2px solid #4f46e5" : "1.5px solid var(--border)",
                    background: format === f.key ? "rgba(79,70,229,0.1)" : "var(--bg-card)",
                    color: format === f.key ? "#4f46e5" : "var(--text-secondary)",
                    borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                    fontSize: "0.8125rem", fontWeight: 600, transition: "all 0.12s", textAlign: "left",
                  }}
                >
                  <i className={`bi ${f.icon}`} />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3 — Columns */}
          <div className="col-12 col-md-4">
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              3 · Columns
            </div>
            {dataset === "summary" ? (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                Dashboard Summary generates a full HTML page with all KPIs — column selection not applicable.
              </p>
            ) : (
              <div className="d-flex flex-column gap-1">
                {defaultCols.map((c) => {
                  const checked = cols.includes(c);
                  return (
                    <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.8125rem", color: "var(--text-secondary)", padding: "3px 0" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCol(c)}
                        style={{ accentColor: "#4f46e5", width: 14, height: 14 }}
                      />
                      {c}
                    </label>
                  );
                })}
                <button
                  onClick={() => setSelectedCols(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#4f46e5", fontSize: "0.75rem", fontWeight: 600, textAlign: "left", padding: "4px 0", marginTop: 4 }}
                >
                  Reset to all columns
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {rowCount != null ? (
            <><i className="bi bi-database me-1" />{rowCount} records · {cols.length} column{cols.length !== 1 ? "s" : ""}</>
          ) : (
            <><i className="bi bi-grid-1x2 me-1" />Full dashboard summary</>
          )}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm" onClick={onHide} style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: 8, fontWeight: 500 }}>
            Cancel
          </button>
          <button className="btn btn-sm btn-brand" onClick={doExport} disabled={exporting} style={{ gap: 6, display: "flex", alignItems: "center" }}>
            {exporting ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-download" />}
            {exporting ? "Exporting…" : "Export"}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
