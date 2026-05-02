function SkeletonCell({ widthPct = 75 }) {
  return (
    <td style={{ padding: "13px 14px" }}>
      <div
        className="skeleton-block"
        style={{ height: 13, width: `${widthPct}%`, borderRadius: 6 }}
      />
    </td>
  );
}

function SkeletonRow({ colWidths }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      {colWidths.map((w, i) => (
        <SkeletonCell key={i} widthPct={w} />
      ))}
    </tr>
  );
}

// Each page passes a colWidths array so skeletons mimic the real column shapes
const PRESETS = {
  products: [20, 55, 30, 22, 18, 22, 28],
  orders:   [25, 40, 40, 15, 25, 25, 28],
  users:    [25, 40, 55, 22, 22],
};

export default function SkeletonTable({ preset = "products", rows = 8 }) {
  const colWidths = PRESETS[preset] || PRESETS.products;

  return (
    <div className="erp-datagrid-wrap" style={{ overflow: "hidden" }}>
      {/* Fake toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        padding: "10px 14px", borderBottom: "1px solid var(--border)",
      }}>
        <div className="skeleton-block" style={{ height: 32, width: 200, borderRadius: 8 }} />
      </div>

      {/* Fake header row */}
      <div style={{ borderBottom: "2px solid var(--border)", padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--table-stripe)" }}>
              {colWidths.map((w, i) => (
                <th key={i} style={{ padding: "11px 14px" }}>
                  <div
                    className="skeleton-block"
                    style={{ height: 10, width: `${Math.max(w - 15, 30)}%`, borderRadius: 4, opacity: 0.6 }}
                  />
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* Data rows */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <SkeletonRow
              key={i}
              colWidths={colWidths.map((w) => w + (i % 3 === 0 ? 10 : i % 2 === 0 ? -10 : 0))}
            />
          ))}
        </tbody>
      </table>

      {/* Fake pager */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderTop: "1px solid var(--border)",
      }}>
        <div className="skeleton-block" style={{ height: 14, width: 180, borderRadius: 6 }} />
        <div className="skeleton-block" style={{ height: 28, width: 120, borderRadius: 8 }} />
      </div>
    </div>
  );
}
