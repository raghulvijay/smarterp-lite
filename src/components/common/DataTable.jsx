import DataGrid, {
  Column,
  Paging,
  Pager,
  SearchPanel,
  FilterRow,
  HeaderFilter,
  Scrolling,
  ColumnChooser,
  ColumnFixing,
  StateStoring,
} from "devextreme-react/data-grid";
import StatusBadge from "./StatusBadge";

export default function DataTable({
  data,
  columns,
  onEdit,
  onDelete,
  isAdmin,
  keyField = "id",
  pageSize = 8,
  storageKey,
}) {
  return (
    <div className="erp-datagrid-wrap">
      <DataGrid
        dataSource={data}
        keyExpr={keyField}
        showBorders={false}
        showRowLines={true}
        showColumnLines={false}
        rowAlternationEnabled={false}
        wordWrapEnabled={false}
        hoverStateEnabled={true}
        height="auto"
        allowColumnReordering={true}
        allowColumnResizing={true}
        onCellPrepared={(e) => {
          if (document.documentElement.getAttribute("data-theme") !== "dark") return;
          const bg = { header: "#0f172a", filter: "#162032", data: "#1e293b" }[e.rowType] ?? "#1e293b";
          e.cellElement.style.backgroundColor = bg;
          e.cellElement.style.color = e.rowType === "header" ? "#94a3b8" : "#f1f5f9";
          e.cellElement.style.borderBottomColor = "#334155";
          e.cellElement.style.borderRightColor = "#334155";
        }}
      >
        <SearchPanel visible placeholder="Search records..." width={240} />
        <FilterRow visible={false} />
        <HeaderFilter visible />
        <Scrolling mode="standard" />
        <Paging defaultPageSize={pageSize} />
        <Pager
          showPageSizeSelector
          allowedPageSizes={[5, 8, 15, 25]}
          showInfo
          infoText="Showing {0}-{1} of {2} records"
        />
        <ColumnChooser enabled mode="select" />
        <ColumnFixing enabled />
        {storageKey && (
          <StateStoring enabled type="localStorage" storageKey={storageKey} />
        )}

        {columns.map((col, index) =>
          col.dataField === "status" ? (
            <Column
              key={col.dataField}
              dataField={col.dataField}
              caption={col.caption || col.dataField}
              cellRender={({ value }) => <StatusBadge status={value} />}
              width={col.width}
              alignment={col.alignment || "left"}
              fixed={index === 0}
              fixedPosition={index === 0 ? "left" : undefined}
            />
          ) : (
            <Column
              key={col.dataField}
              dataField={col.dataField}
              caption={col.caption || col.dataField}
              width={col.width}
              alignment={col.alignment || "left"}
              format={col.format}
              dataType={col.dataType}
              cellRender={col.cellRender}
              fixed={index === 0}
              fixedPosition={index === 0 ? "left" : undefined}
            />
          )
        )}

        {(onEdit || onDelete) && (
          <Column
            caption="Actions"
            width={120}
            alignment="center"
            allowReordering={false}
            allowHiding={false}
            cellRender={({ data: row }) => (
              <div className="d-flex align-items-center justify-content-center gap-1">
                {onEdit && isAdmin && (
                  <button
                    className="btn btn-sm"
                    title="Edit"
                    onClick={() => onEdit(row)}
                    style={{
                      width: 30, height: 30, padding: 0, borderRadius: 6,
                      background: "rgba(79,70,229,0.1)", border: "none", color: "#4f46e5",
                    }}
                  >
                    <i className="bi bi-pencil" style={{ fontSize: "0.8rem" }} />
                  </button>
                )}
                {onDelete && isAdmin && (
                  <button
                    className="btn btn-sm"
                    title="Delete"
                    onClick={() => onDelete(row)}
                    style={{
                      width: 30, height: 30, padding: 0, borderRadius: 6,
                      background: "rgba(220,38,38,0.1)", border: "none", color: "#dc2626",
                    }}
                  >
                    <i className="bi bi-trash3" style={{ fontSize: "0.8rem" }} />
                  </button>
                )}
                {!isAdmin && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>View only</span>
                )}
              </div>
            )}
          />
        )}
      </DataGrid>
    </div>
  );
}
