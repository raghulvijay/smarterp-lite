export default function ErrorMessage({ message, onRetry }) {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center gap-3 py-5"
      style={{ minHeight: 240 }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          background: "rgba(220,38,38,0.12)",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i className="bi bi-wifi-off" style={{ fontSize: "1.5rem", color: "#dc2626" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <p className="mb-1 fw-semibold" style={{ color: "var(--text-primary)" }}>Something went wrong</p>
        <p className="mb-0 small" style={{ color: "var(--text-muted)" }}>{message}</p>
      </div>
      {onRetry && (
        <button className="btn btn-sm btn-brand" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise me-1" />
          Try Again
        </button>
      )}
    </div>
  );
}
