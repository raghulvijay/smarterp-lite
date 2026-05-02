import { Dropdown } from "react-bootstrap";
import { useRole } from "../../context/RoleContext";

export default function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <Dropdown>
      <Dropdown.Toggle as="button" className="role-badge">
        <i className={`bi bi-${role === "Admin" ? "shield-check" : "eye"}`} />
        {role}
        <i className="bi bi-chevron-down ms-1" style={{ fontSize: "0.7rem" }} />
      </Dropdown.Toggle>
      <Dropdown.Menu align="end" style={{ minWidth: 180 }}>
        <Dropdown.Header style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>
          Switch Role
        </Dropdown.Header>
        <Dropdown.Item onClick={() => setRole("Admin")} active={role === "Admin"}>
          <i className="bi bi-shield-check me-2 text-primary" />
          Admin
          <small className="d-block text-muted" style={{ fontSize: "0.75rem" }}>Full access</small>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => setRole("Viewer")} active={role === "Viewer"}>
          <i className="bi bi-eye me-2 text-secondary" />
          Viewer
          <small className="d-block text-muted" style={{ fontSize: "0.75rem" }}>Read-only</small>
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
