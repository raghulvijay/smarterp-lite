export default function BulkActionBar({ count, onClear, actions }) {
  if (count === 0) return null;

  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      display: "flex", alignItems: "center", gap: 8,
      background: "var(--text-primary)", color: "var(--bg-card)",
      borderRadius: 12, padding: "10px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
      zIndex: 1050, animation: "fadeUp 0.2s ease",
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: "0.875rem", fontWeight: 600, marginRight: 4 }}>
        {count} selected
      </span>
      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)" }} />
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          title={a.label}
          style={{
            background: a.danger ? "#ef4444" : "rgba(255,255,255,0.15)",
            color: "white",
            border: "none",
            borderRadius: 7,
            padding: "5px 12px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = a.danger ? "#dc2626" : "rgba(255,255,255,0.25)"}
          onMouseLeave={(e) => e.currentTarget.style.background = a.danger ? "#ef4444" : "rgba(255,255,255,0.15)"}
        >
          {a.icon && <i className={`bi ${a.icon}`} style={{ fontSize: "0.8rem" }} />}
          {a.label}
        </button>
      ))}
      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)" }} />
      <button
        onClick={onClear}
        style={{
          background: "transparent", color: "rgba(255,255,255,0.7)",
          border: "none", cursor: "pointer", padding: "4px 6px",
          borderRadius: 6, fontSize: "0.875rem",
        }}
        title="Clear selection"
      >
        <i className="bi bi-x-lg" />
      </button>
    </div>
  );
}
