export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="d-flex align-items-center gap-2">{children}</div>}
    </div>
  );
}
