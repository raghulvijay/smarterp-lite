import { useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import DataGrid, {
  Column, Paging, Pager, SearchPanel,
  HeaderFilter, Scrolling, ColumnChooser, ColumnFixing,
  StateStoring, Selection,
} from "devextreme-react/data-grid";
import Breadcrumb     from "../../components/common/Breadcrumb";
import PageHeader     from "../../components/common/PageHeader";
import SkeletonTable  from "../../components/common/SkeletonTable";
import ErrorMessage   from "../../components/common/ErrorMessage";
import BulkActionBar  from "../../components/common/BulkActionBar";
import KanbanBoard    from "../../components/orders/KanbanBoard";
import InvoiceModal   from "../../components/orders/InvoiceModal";
import OrderDrawer    from "../../components/orders/OrderDrawer";
import StatusBadge    from "../../components/common/StatusBadge";
import { useApp }      from "../../context/AppContext";
import { useAuth }     from "../../context/AuthContext";
import { useToast }    from "../../context/ToastContext";
import { useCurrency } from "../../context/CurrencyContext";
import { exportToCsv } from "../../utils/exportCsv";
import useFilterPresets from "../../hooks/useFilterPresets";

const ALL_STATUSES = ["All", "Pending", "Processing", "Completed", "Cancelled"];

const STATUS_META = {
  All:        { color: "#4f46e5", bg: "rgba(79,70,229,0.1)"  },
  Pending:    { color: "#9a3412", bg: "rgba(249,115,22,0.1)" },
  Processing: { color: "#854d0e", bg: "rgba(234,179,8,0.1)"  },
  Completed:  { color: "#1d4ed8", bg: "rgba(59,130,246,0.1)" },
  Cancelled:  { color: "#991b1b", bg: "rgba(220,38,38,0.1)"  },
};

const VIEW_KEY = "erp_orders_view";

function formatMonthLabel(key) {
  if (!key) return "";
  const [y, m] = key.split("-");
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

export default function Orders() {
  const { orders, loading, error, refetch, pendingOrders, updateOrder, bulkUpdateOrders } = useApp();
  const { isAdmin }    = useAuth();
  const { showToast }  = useToast();
  const { fmt }        = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const gridRef = useRef(null);

  /* ── URL-driven filters ─────────────────────────────── */
  const urlMonth  = searchParams.get("month");
  const urlStatus = searchParams.get("status");

  /* ── Local state ──────────────────────────────────────  */
  const [activeFilter, setActiveFilter] = useState(() => {
    if (urlStatus) {
      const cap = urlStatus.charAt(0).toUpperCase() + urlStatus.slice(1);
      if (ALL_STATUSES.includes(cap)) return cap;
    }
    return "All";
  });
  const [search,      setSearch]      = useState("");
  const [viewMode,    setViewMode]    = useState(() => localStorage.getItem(VIEW_KEY) || "list");
  const [selectedIds, setSelectedIds] = useState([]);
  const [drawer,      setDrawer]      = useState({ show: false, order: null });
  const [invoice,     setInvoice]     = useState({ show: false, order: null });

  /* ── Preset state ─────────────────────────────────────── */
  const { presets, savePreset, deletePreset } = useFilterPresets("erp_orders_presets");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presetName,    setPresetName]    = useState("");

  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) return;
    savePreset(presetName, { search, activeFilter });
    showToast(`Preset "${presetName.trim()}" saved`, "success");
    setPresetName("");
    setShowSaveInput(false);
  }, [presetName, search, activeFilter, savePreset, showToast]);

  const applyPreset = useCallback((filters) => {
    setSearch(filters.search || "");
    setActiveFilter(filters.activeFilter || "All");
  }, []);

  const clearMonthFilter = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("month");
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  /* ── Derived list ─────────────────────────────────────── */
  const filtered = useMemo(() => {
    let result = orders;
    if (activeFilter !== "All") result = result.filter((o) => o.status === activeFilter);
    if (urlMonth)               result = result.filter((o) => o.orderDate.startsWith(urlMonth));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) => o.customerName.toLowerCase().includes(q) ||
               o.productName.toLowerCase().includes(q)  ||
               o.id.toLowerCase().includes(q),
      );
    }
    return result;
  }, [orders, activeFilter, urlMonth, search]);

  const totalRevenue = orders
    .filter((o) => o.status === "Completed")
    .reduce((s, o) => s + o.totalAmount, 0);

  /* ── View mode toggle ─────────────────────────────────── */
  const switchView = (mode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_KEY, mode);
    setSelectedIds([]);
  };

  /* ── Selection ────────────────────────────────────────── */
  const onSelectionChanged = useCallback(({ selectedRowKeys }) => {
    setSelectedIds(selectedRowKeys);
  }, []);

  /* ── Bulk actions ─────────────────────────────────────── */
  const bulkChangeStatus = async (status) => {
    try {
      await bulkUpdateOrders(selectedIds, status);
      showToast(`${selectedIds.length} order(s) → ${status}`, "success");
      setSelectedIds([]);
      gridRef.current?.instance?.clearSelection();
    } catch {
      showToast("Bulk update failed", "error");
    }
  };

  const bulkExport = () => {
    const rows = filtered.filter((o) => selectedIds.includes(o.id));
    exportToCsv("orders-selected.csv", rows.map(({ id, customerName, productName, quantity, totalAmount, orderDate, status }) =>
      ({ id, customerName, productName, quantity, totalAmount, orderDate, status })));
    showToast(`Exported ${rows.length} order(s)`, "success");
  };

  /* ── Order status change (drawer + kanban) ────────────── */
  const handleStatusChange = async (id, status) => {
    try {
      const updated = await updateOrder(id, status);
      showToast(`Order ${id} → ${status}`, "success");
      // Update drawer if open for this order
      if (drawer.show && drawer.order?.id === id) {
        setDrawer((prev) => ({ ...prev, order: updated }));
      }
    } catch {
      showToast("Status update failed", "error");
    }
  };

  const bulkActions = isAdmin ? [
    { label: "Mark Pending",    icon: "bi-clock",         onClick: () => bulkChangeStatus("Pending") },
    { label: "Mark Processing", icon: "bi-gear",          onClick: () => bulkChangeStatus("Processing") },
    { label: "Mark Completed",  icon: "bi-check-circle",  onClick: () => bulkChangeStatus("Completed") },
    { label: "Mark Cancelled",  icon: "bi-x-circle",      onClick: () => bulkChangeStatus("Cancelled"), danger: true },
    { label: "Export",          icon: "bi-download",      onClick: bulkExport },
  ] : [
    { label: "Export", icon: "bi-download", onClick: bulkExport },
  ];

  if (loading) return <SkeletonTable preset="orders" rows={8} />;
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div>
      <Breadcrumb items={[{ label: "Orders" }]} />

      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total orders · $${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })} completed revenue`}
      >
        <div className="d-flex gap-2 flex-wrap align-items-center">
          {/* View toggle */}
          <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            {[
              { mode: "list",   icon: "bi-list-ul",       title: "List view" },
              { mode: "kanban", icon: "bi-kanban",         title: "Kanban view" },
            ].map(({ mode, icon, title }) => (
              <button
                key={mode}
                title={title}
                onClick={() => switchView(mode)}
                style={{
                  border: "none", padding: "6px 12px",
                  background: viewMode === mode ? "#4f46e5" : "var(--bg-card)",
                  color: viewMode === mode ? "white" : "var(--text-muted)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <i className={`bi ${icon}`} />
              </button>
            ))}
          </div>

          <button
            className="btn btn-sm"
            style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: 8, fontWeight: 500 }}
            onClick={() => exportToCsv("orders.csv", filtered.map(({ id, customerName, productName, quantity, totalAmount, orderDate, status }) => ({ id, customerName, productName, quantity, totalAmount, orderDate, status })))}
            title="Download current view as CSV"
          >
            <i className="bi bi-download me-1" /> Export CSV
          </button>
        </div>
      </PageHeader>

      {/* ── Month drill-down chip ────────────────────────── */}
      {urlMonth && (
        <div className="d-flex align-items-center gap-2 mb-3">
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Filtered by:</span>
          <button className="filter-drill-chip" onClick={clearMonthFilter} title="Clear month filter">
            <i className="bi bi-calendar3 me-1" style={{ fontSize: "0.7rem" }} />
            {formatMonthLabel(urlMonth)}
            <i className="bi bi-x ms-1" style={{ fontSize: "0.7rem" }} />
          </button>
        </div>
      )}

      {/* ── Saved preset chips ───────────────────────────── */}
      {presets.length > 0 && (
        <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Presets:</span>
          {presets.map((p) => (
            <button key={p.name} className="preset-chip" onClick={() => applyPreset(p.filters)}>
              <i className="bi bi-bookmark-fill me-1" style={{ fontSize: "0.65rem" }} />
              {p.name}
              <span className="preset-chip-remove" onClick={(e) => { e.stopPropagation(); deletePreset(p.name); }}>✕</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Status filter pills ──────────────────────────── */}
      <div className="d-flex status-filter-row gap-2 mb-3 flex-wrap">
        {ALL_STATUSES.map((s) => {
          const count    = s === "All" ? orders.length : orders.filter((o) => o.status === s).length;
          const meta     = STATUS_META[s];
          const isActive = activeFilter === s;
          return (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              style={{
                border: isActive ? `2px solid ${meta.color}` : "1.5px solid var(--border)",
                background: isActive ? meta.bg : "var(--bg-card)",
                color: isActive ? meta.color : "var(--text-secondary)",
                borderRadius: 100, padding: "5px 14px",
                fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s ease", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {s}
              <span style={{
                background: isActive ? meta.color : "var(--border)",
                color: isActive ? "white" : "var(--text-muted)",
                borderRadius: 100, padding: "1px 7px", fontSize: "0.7rem",
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search + Save Filter ─────────────────────────── */}
      {viewMode === "list" && (
        <div className="d-flex gap-2 mb-4 flex-wrap align-items-center">
          <div className="orders-search" style={{ maxWidth: 360, flex: "1 1 240px" }}>
            <div className="input-group">
              <span className="input-group-text" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRight: "none" }}>
                <i className="bi bi-search" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by customer, product, or order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ borderLeft: "none" }}
              />
              {search && (
                <button className="btn" onClick={() => setSearch("")} style={{ border: "1px solid var(--border)", borderLeft: "none", background: "var(--bg-card)", color: "var(--text-muted)" }}>
                  <i className="bi bi-x" />
                </button>
              )}
            </div>
          </div>

          {showSaveInput ? (
            <div className="d-flex align-items-center gap-2">
              <input
                autoFocus type="text" className="form-control form-control-sm"
                placeholder="Preset name…" value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSavePreset(); if (e.key === "Escape") setShowSaveInput(false); }}
                style={{ width: 160 }}
              />
              <button className="btn btn-sm btn-brand" onClick={handleSavePreset}>Save</button>
              <button className="btn btn-sm" onClick={() => setShowSaveInput(false)} style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)" }}>
                <i className="bi bi-x" />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-sm"
              onClick={() => setShowSaveInput(true)}
              style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: 8, fontWeight: 500, whiteSpace: "nowrap" }}
              title="Save current filters as a preset"
            >
              <i className="bi bi-bookmark-plus me-1" /> Save Filter
            </button>
          )}
        </div>
      )}

      {/* ── Pending banner ───────────────────────────────── */}
      {pendingOrders > 0 && activeFilter === "All" && !urlMonth && (
        <div className="d-flex align-items-center gap-2 mb-3 p-3" style={{
          background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.3)", borderRadius: 10, fontSize: "0.875rem",
        }}>
          <i className="bi bi-clock-history" style={{ color: "#d97706" }} />
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
            <strong>{pendingOrders} order(s)</strong> are pending and require attention.
          </span>
        </div>
      )}

      {/* ── List view ─────────────────────────────────────── */}
      {viewMode === "list" && (
        <>
          {isAdmin && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>
              <i className="bi bi-check2-square me-1" />
              Select rows for bulk actions. Click a row to view details.
            </p>
          )}
          <div className="erp-datagrid-wrap">
            <DataGrid
              ref={gridRef}
              dataSource={filtered}
              keyExpr="id"
              showBorders={false}
              showRowLines={true}
              showColumnLines={false}
              rowAlternationEnabled={false}
              hoverStateEnabled={true}
              height="auto"
              allowColumnReordering={true}
              allowColumnResizing={true}
              onSelectionChanged={onSelectionChanged}
              onRowClick={({ data }) => setDrawer({ show: true, order: data })}
              onCellPrepared={(e) => {
                if (document.documentElement.getAttribute("data-theme") !== "dark") return;
                const bg = { header: "#0f172a", filter: "#162032", data: "#1e293b" }[e.rowType] ?? "#1e293b";
                e.cellElement.style.backgroundColor = bg;
                e.cellElement.style.color = e.rowType === "header" ? "#94a3b8" : "#f1f5f9";
                e.cellElement.style.borderBottomColor = "#334155";
                e.cellElement.style.borderRightColor = "#334155";
              }}
            >
              <Selection mode="multiple" showCheckBoxesMode="always" />
              <SearchPanel visible placeholder="Search records..." width={240} />
              <HeaderFilter visible />
              <Scrolling mode="virtual" rowRenderingMode="virtual" />
              <Paging defaultPageSize={20} />
              <Pager showPageSizeSelector allowedPageSizes={[5, 10, 15, 25]} showInfo infoText="Showing {0}-{1} of {2} records" />
              <ColumnChooser enabled mode="select" />
              <ColumnFixing enabled />
              <StateStoring enabled type="localStorage" storageKey="erp-orders-grid" />

              <Column
                dataField="id" caption="Order ID" width={120} fixed fixedPosition="left"
                cellRender={({ value, data: row }) => (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDrawer({ show: true, order: row }); }}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#4f46e5", fontWeight: 700, fontSize: "0.875rem", textDecoration: "underline", textDecorationStyle: "dotted" }}
                  >
                    {value}
                  </button>
                )}
              />
              <Column dataField="customerName" caption="Customer"  width={160} />
              <Column dataField="productName"  caption="Product" />
              <Column dataField="quantity"     caption="Qty"       width={70}  alignment="center" />
              <Column
                dataField="totalAmount" caption="Total" width={130} alignment="right"
                cellRender={({ value }) => (
                  <span style={{ fontWeight: 600, color: "#16a34a" }}>
                    {fmt(Number(value))}
                  </span>
                )}
              />
              <Column
                dataField="orderDate" caption="Date" width={120} dataType="date"
                cellRender={({ value }) =>
                  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                }
              />
              <Column
                dataField="status" caption="Status" width={130}
                cellRender={({ value }) => <StatusBadge status={value} />}
              />
              <Column
                caption="" width={90} alignment="center" allowReordering={false} allowHiding={false}
                cellRender={({ data: row }) => (
                  <div className="d-flex gap-1 align-items-center justify-content-center">
                    <button
                      title="View details"
                      onClick={(e) => { e.stopPropagation(); setDrawer({ show: true, order: row }); }}
                      style={{ width: 28, height: 28, padding: 0, borderRadius: 6, background: "rgba(79,70,229,0.1)", border: "none", color: "#4f46e5", cursor: "pointer" }}
                    >
                      <i className="bi bi-eye" style={{ fontSize: "0.8rem" }} />
                    </button>
                    <button
                      title="Print invoice"
                      onClick={(e) => { e.stopPropagation(); setInvoice({ show: true, order: row }); }}
                      style={{ width: 28, height: 28, padding: 0, borderRadius: 6, background: "rgba(22,163,74,0.1)", border: "none", color: "#16a34a", cursor: "pointer" }}
                    >
                      <i className="bi bi-receipt" style={{ fontSize: "0.8rem" }} />
                    </button>
                  </div>
                )}
              />
            </DataGrid>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
              <i className="bi bi-inbox" style={{ fontSize: "2.5rem", display: "block", marginBottom: 12 }} />
              <p className="mb-0" style={{ fontWeight: 500 }}>No orders match your filters</p>
              <button
                className="btn btn-sm mt-3"
                onClick={() => { setActiveFilter("All"); setSearch(""); clearMonthFilter(); }}
                style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: 8, padding: "6px 16px" }}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Kanban view ───────────────────────────────────── */}
      {viewMode === "kanban" && (
        <div>
          {!isAdmin && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 10 }}>
              <i className="bi bi-eye me-1" /> Viewer mode — drag-and-drop is disabled.
            </p>
          )}
          <KanbanBoard
            orders={filtered}
            isAdmin={isAdmin}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      {/* ── Bulk Action Bar ───────────────────────────────── */}
      <BulkActionBar
        count={selectedIds.length}
        onClear={() => { setSelectedIds([]); gridRef.current?.instance?.clearSelection(); }}
        actions={bulkActions}
      />

      {/* ── Order Drawer ──────────────────────────────────── */}
      <OrderDrawer
        show={drawer.show}
        onHide={() => setDrawer({ show: false, order: null })}
        order={drawer.order}
        isAdmin={isAdmin}
        onStatusChange={handleStatusChange}
        onOpenInvoice={(order) => setInvoice({ show: true, order })}
      />

      {/* ── Invoice Modal ─────────────────────────────────── */}
      <InvoiceModal
        show={invoice.show}
        onHide={() => setInvoice({ show: false, order: null })}
        order={invoice.order}
      />
    </div>
  );
}
