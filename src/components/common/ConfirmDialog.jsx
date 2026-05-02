import { Modal, Button } from "react-bootstrap";

export default function ConfirmDialog({ show, onHide, onConfirm, title, message, confirmLabel = "Delete", loading }) {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "1rem" }}>{title || "Confirm Action"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex align-items-start gap-3">
          <div
            style={{
              width: 40, height: 40, borderRadius: 10, background: "rgba(220,38,38,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <i className="bi bi-exclamation-triangle" style={{ color: "#dc2626", fontSize: "1.125rem" }} />
          </div>
          <p className="mb-0 small" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {message || "Are you sure you want to proceed? This action cannot be undone."}
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" size="sm" onClick={onHide} disabled={loading}>Cancel</Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onConfirm}
          disabled={loading}
          style={{ minWidth: 80 }}
        >
          {loading ? <span className="spinner-border spinner-border-sm" /> : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
