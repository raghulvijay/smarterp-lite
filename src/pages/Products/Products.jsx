import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DataGrid, {
  Column,
  Paging,
  Pager,
  SearchPanel,
  HeaderFilter,
  Scrolling,
  Editing,
  ColumnChooser,
  ColumnFixing,
  StateStoring,
  Lookup,
  Selection,
} from "devextreme-react/data-grid";
import Breadcrumb    from "../../components/common/Breadcrumb";
import PageHeader    from "../../components/common/PageHeader";
import ModalForm     from "../../components/common/ModalForm";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SkeletonTable from "../../components/common/SkeletonTable";
import ErrorMessage  from "../../components/common/ErrorMessage";
import StatusBadge   from "../../components/common/StatusBadge";
import BulkActionBar from "../../components/common/BulkActionBar";
import { useApp }      from "../../context/AppContext";
import { useAuth }     from "../../context/AuthContext";
import { useToast }    from "../../context/ToastContext";
import { useCurrency } from "../../context/CurrencyContext";
import { exportToCsv } from "../../utils/exportCsv";
import useKeyboardShortcuts from "../../hooks/useKeyboardShortcuts";
import useFilterPresets     from "../../hooks/useFilterPresets";

const CAT_PALETTE = [
  { color: "#0891b2", bg: "rgba(8,145,178,0.1)"  },
  { color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  { color: "#d97706", bg: "rgba(217,119,6,0.1)"  },
  { color: "#16a34a", bg: "rgba(22,163,74,0.1)"  },
  { color: "#db2777", bg: "rgba(219,39,119,0.1)" },
  { color: "#ea580c", bg: "rgba(234,88,12,0.1)"  },
];

function getCatMeta(category, allCategories) {
  if (!category || category === "All") return { color: "#4f46e5", bg: "rgba(79,70,229,0.1)" };
  const idx = allCategories.indexOf(category);
  return CAT_PALETTE[idx % CAT_PALETTE.length] ?? CAT_PALETTE[0];
}

const BASE_CATEGORY_OPTIONS = [
  { value: "Electronics", label: "Electronics" },
  { value: "Furniture",   label: "Furniture"   },
  { value: "Accessories", label: "Accessories" },
  { value: "Stationery",  label: "Stationery"  },
];

const STATUS_OPTIONS = [
  { value: "Active",   label: "Active"   },
  { value: "Inactive", label: "Inactive" },
];

export default function Products() {
  const { products, loading, error, refetch, addProduct, editProduct, removeProduct } = useApp();
  const { isAdmin }   = useAuth();
  const { showToast } = useToast();
  const { fmt }       = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const gridRef = useRef(null);

  /* ── URL highlight param ─────────────────────────────── */
  const urlHighlight = searchParams.get("highlight");

  useEffect(() => {
    if (!urlHighlight) return;
    const navTimer = setTimeout(() => {
      gridRef.current?.instance?.navigateToRow(Number(urlHighlight));
    }, 400);
    const cleanTimer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("highlight");
        return next;
      }, { replace: true });
    }, 2800);
    return () => { clearTimeout(navTimer); clearTimeout(cleanTimer); };
  }, [urlHighlight, setSearchParams]);

  const onRowPrepared = useCallback((e) => {
    if (e.rowType !== "data" || !urlHighlight || e.key !== Number(urlHighlight)) return;
    const cells = Array.from(e.rowElement.querySelectorAll("td"));
    cells.forEach((td) => {
      td.style.transition = "background-color 0.4s ease";
      td.style.backgroundColor = "rgba(79, 70, 229, 0.18)";
    });
    setTimeout(() => { cells.forEach((td) => { td.style.backgroundColor = ""; }); }, 2000);
  }, [urlHighlight]);

  /* ── Local state ─────────────────────────────────────── */
  const [modal,         setModal]        = useState({ show: false, item: null });
  const [confirm,       setConfirm]      = useState({ show: false, item: null });
  const [saving,        setSaving]       = useState(false);
  const [deleting,      setDeleting]     = useState(false);
  const [activeCategory, setCategory]    = useState("All");
  const [restockFilter,  setRestockFilter] = useState(false);
  const [selectedIds,    setSelectedIds]  = useState([]);

  /* ── Preset state ────────────────────────────────────── */
  const { presets, savePreset, deletePreset } = useFilterPresets("erp_products_presets");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presetName,    setPresetName]    = useState("");

  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) return;
    savePreset(presetName, { activeCategory });
    showToast(`Preset "${presetName.trim()}" saved`, "success");
    setPresetName("");
    setShowSaveInput(false);
  }, [presetName, activeCategory, savePreset, showToast]);

  const applyPreset = useCallback((filters) => {
    setCategory(filters.activeCategory || "All");
  }, []);

  /* ── Keyboard shortcuts ──────────────────────────────── */
  const openAdd    = useCallback(() => setModal({ show: true, item: null }), []);
  const closeModal = useCallback(() => setModal({ show: false, item: null }), []);

  useKeyboardShortcuts(useMemo(() => ({
    "ctrl+n": () => { if (isAdmin) openAdd(); },
  }), [isAdmin, openAdd]));

  /* ── Filtered list ───────────────────────────────────── */
  const filtered = useMemo(() => {
    let result = activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);
    if (restockFilter) result = result.filter((p) => p.stock <= (p.minStock ?? 10));
    return result;
  }, [products, activeCategory, restockFilter]);

  /* ── Selection ────────────────────────────────────────── */
  const onSelectionChanged = useCallback(({ selectedRowKeys }) => {
    setSelectedIds(selectedRowKeys);
  }, []);

  /* ── Bulk actions ─────────────────────────────────────── */
  const bulkExport = useCallback(() => {
    const rows = filtered.filter((p) => selectedIds.includes(p.id));
    exportToCsv("products-selected.csv", rows.map(({ id, name, category, price, stock, status }) => ({ id, name, category, price, stock, status })));
    showToast(`Exported ${rows.length} product(s)`, "success");
  }, [filtered, selectedIds, showToast]);

  const bulkDelete = useCallback(async () => {
    if (!isAdmin) return;
    try {
      await Promise.all(selectedIds.map((id) => removeProduct(id)));
      showToast(`Deleted ${selectedIds.length} product(s)`, "info");
      setSelectedIds([]);
      gridRef.current?.instance?.clearSelection();
    } catch {
      showToast("Bulk delete failed", "error");
    }
  }, [isAdmin, selectedIds, removeProduct, showToast]);

  const bulkCategoryUpdate = useCallback(async (category) => {
    if (!isAdmin) return;
    try {
      await Promise.all(
        selectedIds.map((id) => {
          const p = products.find((x) => x.id === id);
          return p ? editProduct(id, { ...p, category }) : Promise.resolve();
        })
      );
      showToast(`${selectedIds.length} product(s) → ${category}`, "success");
      setSelectedIds([]);
      gridRef.current?.instance?.clearSelection();
    } catch {
      showToast("Category update failed", "error");
    }
  }, [isAdmin, selectedIds, products, editProduct, showToast]);

  // Dynamic categories from actual product data + base options merged
  const allCategories = useMemo(() => {
    const fromProducts = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
    const base = BASE_CATEGORY_OPTIONS.map((o) => o.value);
    return [...new Set([...base, ...fromProducts])];
  }, [products]);

  const categoryOptions = useMemo(() =>
    allCategories.map((c) => ({ value: c, label: c })),
  [allCategories]);

  const bulkActions = isAdmin ? [
    ...categoryOptions.map((c) => ({ label: `→ ${c.label}`, icon: "bi-tag", onClick: () => bulkCategoryUpdate(c.value) })),
    { label: "Export",        icon: "bi-download",  onClick: bulkExport },
    { label: "Delete",        icon: "bi-trash3",    onClick: bulkDelete, danger: true },
  ] : [
    { label: "Export", icon: "bi-download", onClick: bulkExport },
  ];

  /* ── Inline editing handlers ─────────────────────────── */
  const onRowUpdated  = useCallback(({ data }) => {
    editProduct(data.id, { ...data, price: +data.price, stock: +data.stock });
    showToast(`"${data.name}" updated successfully`, "success");
  }, [editProduct, showToast]);

  const onRowInserted = useCallback(({ data }) => {
    addProduct({ ...data, price: +data.price, stock: +data.stock });
    showToast(`"${data.name}" added`, "success");
  }, [addProduct, showToast]);

  const onRowRemoved  = useCallback(({ key }) => {
    removeProduct(key);
    showToast("Product deleted", "info");
  }, [removeProduct, showToast]);

  /* ── Modal submit ────────────────────────────────────── */
  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      if (modal.item) {
        await editProduct(modal.item.id, { ...values, price: +values.price, stock: +values.stock, minStock: +values.minStock || 10 });
        showToast(`"${values.name}" updated`, "success");
      } else {
        await addProduct({ ...values, price: +values.price, stock: +values.stock, minStock: +values.minStock || 10 });
        showToast(`"${values.name}" added`, "success");
      }
      closeModal();
    } catch {
      showToast("Save failed. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const name = confirm.item?.name;
      await removeProduct(confirm.item.id);
      showToast(`"${name}" deleted`, "info");
      setConfirm({ show: false, item: null });
    } catch {
      showToast("Delete failed. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const activeCount    = products.filter((p) => p.status === "Active").length;
  const lowStockCount  = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outCount       = products.filter((p) => p.stock === 0).length;
  const restockCount   = products.filter((p) => p.stock <= (p.minStock ?? 10)).length;

  const FIELDS = [
    { name: "name",     label: "Product Name", required: true,  col: 12 },
    { name: "category", label: "Category",     required: true,  col: 6,
      type: "combobox", options: categoryOptions, placeholder: "Select or type a category" },
    { name: "price",    label: "Price ($)",  required: true, type: "number", min: 0.01, step: "0.01", col: 6 },
    { name: "stock",    label: "Stock Qty",  required: true, type: "number", min: 0,    step: "1",    col: 6 },
    { name: "minStock", label: "Restock At", required: false, type: "number", min: 1, step: "1", col: 6 },
    { name: "status",   label: "Status",     required: true,  col: 6,
      type: "select", options: STATUS_OPTIONS },
  ];

  if (loading) return <SkeletonTable preset="products" rows={8} />;
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div>
      <Breadcrumb items={[{ label: "Products" }]} />

      <PageHeader
        title="Products"
        subtitle={`${products.length} total · ${activeCount} active`}
      >
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-sm"
            style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: 8, fontWeight: 500 }}
            onClick={() => exportToCsv("products.csv", filtered.map(({ id, name, category, price, stock, status }) => ({ id, name, category, price, stock, status })))}
            title="Download current view as CSV"
          >
            <i className="bi bi-download me-1" /> Export CSV
          </button>
          {isAdmin && (
            <button className="btn btn-brand" onClick={openAdd} title="Add Product (Ctrl+N)">
              <i className="bi bi-plus-lg me-1" /> Add Product
            </button>
          )}
        </div>
      </PageHeader>

      {/* ── Quick Stats ──────────────────────────────────── */}
      <div className="d-flex gap-3 mb-3 flex-wrap">
        {[
          { label: "Total",        value: products.length, color: "#4f46e5", bg: "rgba(79,70,229,0.1)"  },
          { label: "Active",       value: activeCount,     color: "#16a34a", bg: "rgba(22,163,74,0.1)"  },
          { label: "Low Stock",    value: lowStockCount,   color: "#d97706", bg: "rgba(215,119,6,0.1)"  },
          { label: "Out",          value: outCount,        color: "#dc2626", bg: "rgba(220,38,38,0.1)"  },
          { label: "Needs Restock",value: restockCount,    color: "#f97316", bg: "rgba(249,115,22,0.1)" },
        ].map((s) => (
          <div key={s.label} className="d-flex align-items-center gap-2 px-3 py-2" style={{ background: s.bg, borderRadius: 8, fontSize: "0.875rem" }}>
            <span style={{ fontWeight: 700, color: s.color, fontSize: "1rem" }}>{s.value}</span>
            <span style={{ color: s.color, fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

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

      {/* ── Category pills + Restock pill + Save Filter ─── */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        {["All", ...allCategories].map((cat) => {
          const count    = cat === "All" ? products.length : products.filter((p) => p.category === cat).length;
          const meta     = getCatMeta(cat, allCategories);
          const isActive = activeCategory === cat && !restockFilter;
          return (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setRestockFilter(false); }}
              style={{
                border: isActive ? `2px solid ${meta.color}` : "1.5px solid var(--border)",
                background: isActive ? meta.bg : "var(--bg-card)",
                color: isActive ? meta.color : "var(--text-secondary)",
                borderRadius: 100, padding: "5px 14px",
                fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s ease", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {cat}
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

        {/* Needs Restock pill */}
        <button
          onClick={() => { setRestockFilter((v) => !v); setCategory("All"); }}
          style={{
            border: restockFilter ? "2px solid #9a3412" : "1.5px solid var(--border)",
            background: restockFilter ? "rgba(249,115,22,0.1)" : "var(--bg-card)",
            color: restockFilter ? "#9a3412" : "var(--text-secondary)",
            borderRadius: 100, padding: "5px 14px",
            fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
            transition: "all 0.15s ease", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <i className="bi bi-arrow-repeat" style={{ fontSize: "0.75rem" }} />
          Needs Restock
          <span style={{
            background: restockFilter ? "#9a3412" : "var(--border)",
            color: restockFilter ? "white" : "var(--text-muted)",
            borderRadius: 100, padding: "1px 7px", fontSize: "0.7rem",
          }}>
            {restockCount}
          </span>
        </button>

        {/* Save Filter */}
        <div className="ms-auto">
          {showSaveInput ? (
            <div className="d-flex align-items-center gap-2">
              <input
                autoFocus type="text" className="form-control form-control-sm"
                placeholder="Preset name…" value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSavePreset(); if (e.key === "Escape") setShowSaveInput(false); }}
                style={{ width: 150 }}
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
              title="Save current category filter as a preset"
            >
              <i className="bi bi-bookmark-plus me-1" /> Save Filter
            </button>
          )}
        </div>
      </div>

      {/* ── Restock alert banner ─────────────────────────── */}
      {restockCount > 0 && restockFilter && (
        <div className="d-flex align-items-center gap-2 mb-3 p-3" style={{
          background: "rgba(234,88,12,0.1)", border: "1px solid rgba(234,88,12,0.3)", borderRadius: 10, fontSize: "0.875rem",
        }}>
          <i className="bi bi-arrow-repeat" style={{ color: "#ea580c" }} />
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
            <strong>{restockCount} product(s)</strong> are at or below their restock threshold.
          </span>
        </div>
      )}

      {/* ── Inline-editable DataGrid ──────────────────────── */}
      {isAdmin && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>
          <i className="bi bi-pencil-square me-1" />
          Click any cell to edit inline. Select rows for bulk actions.
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
          onRowUpdated={onRowUpdated}
          onRowInserted={onRowInserted}
          onRowRemoved={onRowRemoved}
          onRowPrepared={onRowPrepared}
          onSelectionChanged={onSelectionChanged}
          repaintChangesOnly={true}
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
          <SearchPanel visible placeholder="Search products..." width={240} />
          <HeaderFilter visible />
          <Scrolling mode="virtual" rowRenderingMode="virtual" />
          <Paging defaultPageSize={20} />
          <Pager showPageSizeSelector allowedPageSizes={[5, 8, 15, 25]} showInfo infoText="Showing {0}-{1} of {2} records" />
          <ColumnChooser enabled mode="select" />
          <ColumnFixing enabled />
          <StateStoring enabled type="localStorage" storageKey="erp-products-grid" />

          <Editing mode="cell" allowUpdating={isAdmin} allowAdding={false} allowDeleting={false} />

          <Column dataField="id" caption="ID" width={80} alignment="center" allowEditing={false} fixed fixedPosition="left" />
          <Column dataField="name" caption="Product" minWidth={140} />
          <Column dataField="category" caption="Category" width={130}>
            <Lookup dataSource={categoryOptions} valueExpr="value" displayExpr="label" />
          </Column>
          <Column
            dataField="price" caption="Price" width={120} alignment="right"
            dataType="number"
            cellRender={({ value }) => <span style={{ fontWeight: 600 }}>{fmt(Number(value))}</span>}
          />
          <Column
            dataField="stock" caption="Stock" width={90} alignment="center" dataType="number"
            cellRender={({ value, data }) => {
              const threshold = data.minStock ?? 10;
              const needsRestock = value <= threshold;
              return (
                <span style={{ color: value === 0 ? "#dc2626" : needsRestock ? "#d97706" : "#16a34a", fontWeight: 600 }}>
                  {value === 0 ? "Out" : value}
                  {needsRestock && value > 0 && <i className="bi bi-arrow-repeat ms-1" style={{ fontSize: "0.65rem" }} />}
                </span>
              );
            }}
          />
          <Column dataField="minStock" caption="Restock At" width={100} alignment="center" dataType="number"
            cellRender={({ value }) => <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{value ?? 10}</span>}
          />
          <Column dataField="status" caption="Status" width={110} cellRender={({ value }) => <StatusBadge status={value} />}>
            <Lookup dataSource={STATUS_OPTIONS} valueExpr="value" displayExpr="label" />
          </Column>
          <Column
            caption="Actions" width={isAdmin ? 80 : 90} alignment="center"
            allowReordering={false} allowHiding={false} allowEditing={false}
            cellRender={({ data: row }) => (
              <div className="d-flex align-items-center justify-content-center">
                {isAdmin ? (
                  <button
                    className="btn btn-sm"
                    title="Delete"
                    onClick={() => setConfirm({ show: true, item: row })}
                    style={{ width: 30, height: 30, padding: 0, borderRadius: 6, background: "rgba(220,38,38,0.1)", border: "none", color: "#dc2626" }}
                  >
                    <i className="bi bi-trash3" style={{ fontSize: "0.8rem" }} />
                  </button>
                ) : (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>View only</span>
                )}
              </div>
            )}
          />
        </DataGrid>
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
          <i className="bi bi-box-seam" style={{ fontSize: "2.5rem", display: "block", marginBottom: 12 }} />
          <p className="mb-0" style={{ fontWeight: 500 }}>
            {restockFilter ? "No products need restocking" : `No products in ${activeCategory}`}
          </p>
          <button className="btn btn-sm mt-3" onClick={() => { setCategory("All"); setRestockFilter(false); }}
            style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: 8, padding: "6px 16px" }}>
            Show All
          </button>
        </div>
      )}

      {/* ── Bulk Action Bar ───────────────────────────────── */}
      <BulkActionBar
        count={selectedIds.length}
        onClear={() => { setSelectedIds([]); gridRef.current?.instance?.clearSelection(); }}
        actions={bulkActions}
      />

      <ModalForm
        show={modal.show}
        onHide={closeModal}
        onSubmit={handleSubmit}
        title={modal.item ? "Edit Product" : "Add New Product"}
        fields={FIELDS}
        initialValues={modal.item}
        loading={saving}
      />

      <ConfirmDialog
        show={confirm.show}
        onHide={() => setConfirm({ show: false, item: null })}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirm.item?.name}"? This cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}
