import { memo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ALL_NAV = [
  { to: "/",            icon: "bi-grid-1x2", label: "Dashboard",   adminOnly: false, tour: "dashboard-link" },
  { to: "/products",    icon: "bi-box-seam", label: "Products",    adminOnly: false, tour: "products-link"  },
  { to: "/orders",      icon: "bi-receipt",  label: "Orders",      adminOnly: false, tour: "orders-link"    },
  { to: "/users",       icon: "bi-people",   label: "Users",       adminOnly: true,  tour: "users-link"     },
  { to: "/ai-insights", icon: "bi-stars",    label: "AI Insights", adminOnly: false, tour: "ai-link"        },
];

const NavItem = memo(function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      data-tour={item.tour}
      className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
    >
      <i className={`bi ${item.icon}`} />
      <span>{item.label}</span>
    </NavLink>
  );
});

const Sidebar = memo(function Sidebar({ isOpen, onClose }) {
  const { isAdmin, role } = useAuth();

  const navItems = ALL_NAV.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className={`erp-sidebar${isOpen ? " open" : ""}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <i className="bi bi-layers" />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">SmartERP</span>
          <span className="sidebar-brand-tagline">Lite Edition v1.0</span>
        </div>

        {/* Mobile close button */}
        <button
          className="sidebar-mobile-close d-md-none"
          onClick={onClose}
          aria-label="Close menu"
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      {/* Bottom: Settings + Role footer */}
      <div style={{ marginTop: "auto" }}>
        {isAdmin && (
          <div style={{ padding: "0 8px 6px" }}>
            <NavLink
              to="/settings"
              data-tour="settings-link"
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              style={{ fontSize: "0.8125rem" }}
            >
              <i className="bi bi-gear" />
              <span>Settings</span>
            </NavLink>
          </div>
        )}

        <div className="sidebar-footer">
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px", borderRadius: 8,
              background: isAdmin ? "rgba(79,70,229,0.12)" : "rgba(255,255,255,0.05)",
            }}
          >
            <i
              className={`bi bi-${isAdmin ? "shield-check" : "eye"}`}
              style={{ color: isAdmin ? "#a5b4fc" : "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}
            />
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: isAdmin ? "#a5b4fc" : "rgba(255,255,255,0.5)" }}>
                {role} Access
              </div>
              <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)" }}>
                {isAdmin ? "Full permissions" : "Read-only"}
              </div>
            </div>
          </div>
          <div className="sidebar-version">SmartERP Lite © 2024</div>
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
