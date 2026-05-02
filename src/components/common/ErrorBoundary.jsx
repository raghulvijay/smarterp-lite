import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error } = this.state;

    return (
      <div style={{
        minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 20px",
      }}>
        <div style={{
          maxWidth: 520, width: "100%",
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "36px 40px", boxShadow: "var(--shadow-lg)",
          textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: "rgba(220,38,38,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <i className="bi bi-exclamation-triangle" style={{ color: "#dc2626", fontSize: "1.5rem" }} />
          </div>

          <h2 style={{ fontWeight: 700, fontSize: "1.25rem", color: "var(--text-primary)", marginBottom: 8 }}>
            Something went wrong
          </h2>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 24 }}>
            {error?.message || "An unexpected error occurred in this part of the application."}
          </p>

          {import.meta.env.DEV && error?.stack && (
            <details style={{ textAlign: "left", marginBottom: 24 }}>
              <summary style={{
                fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)",
                cursor: "pointer", marginBottom: 8,
              }}>
                Stack trace (dev mode)
              </summary>
              <pre style={{
                background: "var(--table-stripe)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "12px", fontSize: "0.72rem",
                color: "var(--text-secondary)", overflow: "auto", maxHeight: 200,
                whiteSpace: "pre-wrap", wordBreak: "break-all",
              }}>
                {error.stack}
              </pre>
            </details>
          )}

          <div className="d-flex gap-3 justify-content-center">
            <button
              onClick={() => this.reset()}
              className="btn btn-brand"
            >
              <i className="bi bi-arrow-clockwise me-2" />
              Try Again
            </button>
            <Link to="/" className="btn" style={{ border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: 8, fontWeight: 500 }}>
              <i className="bi bi-house me-2" />
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
