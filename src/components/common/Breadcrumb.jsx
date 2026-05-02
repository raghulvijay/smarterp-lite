import { Link } from "react-router-dom";

export default function Breadcrumb({ items }) {
  return (
    <nav className="erp-breadcrumb" aria-label="breadcrumb">
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <i className="bi bi-house-door" />
        <span>Home</span>
      </Link>
      {items.map((item, i) => (
        <span key={i} className="d-flex align-items-center gap-2">
          <span className="separator">/</span>
          {item.href ? (
            <Link to={item.href}>{item.label}</Link>
          ) : (
            <span className="current">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
