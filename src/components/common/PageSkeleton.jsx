export default function PageSkeleton() {
  return (
    <div style={{ padding: "24px 28px", animation: "pulse 1.5s ease-in-out infinite" }}>
      {/* Breadcrumb */}
      <div className="skeleton-block" style={{ height: 12, width: 160, borderRadius: 6, marginBottom: 24 }} />
      {/* Title */}
      <div className="skeleton-block" style={{ height: 28, width: 240, borderRadius: 8, marginBottom: 8 }} />
      <div className="skeleton-block" style={{ height: 14, width: 320, borderRadius: 6, marginBottom: 32 }} />
      {/* KPI row */}
      <div className="d-flex gap-3 mb-4 flex-wrap">
        {[140, 140, 140, 140].map((w, i) => (
          <div key={i} className="skeleton-block" style={{ height: 88, width: w, borderRadius: 12, flex: "1 1 130px" }} />
        ))}
      </div>
      {/* Main content */}
      <div className="skeleton-block" style={{ height: 260, borderRadius: 12, marginBottom: 16 }} />
      <div className="d-flex gap-3">
        <div className="skeleton-block" style={{ height: 200, borderRadius: 12, flex: 2 }} />
        <div className="skeleton-block" style={{ height: 200, borderRadius: 12, flex: 1 }} />
      </div>
    </div>
  );
}
