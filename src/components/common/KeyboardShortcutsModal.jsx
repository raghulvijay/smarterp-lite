import { Modal } from "react-bootstrap";

const SHORTCUTS = [
  { keys: ["Ctrl", "K"],  description: "Open global search" },
  { keys: ["Ctrl", "N"],  description: "Add new record (Products / Users page)" },
  { keys: ["?"],          description: "Show this shortcuts guide" },
  { keys: ["Esc"],        description: "Close any open dialog or search" },
];

function Keys({ keys }) {
  return (
    <span className="kbd-shortcut">
      {keys.map((k, i) => (
        <span key={k}>
          <span className="kbd-key">{k}</span>
          {i < keys.length - 1 && (
            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", margin: "0 2px" }}>+</span>
          )}
        </span>
      ))}
    </span>
  );
}

export default function KeyboardShortcutsModal({ show, onHide }) {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "1rem" }}>
          <i className="bi bi-keyboard me-2" />
          Keyboard Shortcuts
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: "16px 20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {SHORTCUTS.map(({ keys, description }) => (
              <tr key={description} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 0", width: 1, whiteSpace: "nowrap", paddingRight: 16 }}>
                  <Keys keys={keys} />
                </td>
                <td style={{ padding: "10px 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  {description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal.Body>
    </Modal>
  );
}
