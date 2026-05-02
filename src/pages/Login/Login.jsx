import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

const DEMO_CREDS = [
  { role: "Admin",  email: "admin@smarterp.com",  password: "admin123"  },
  { role: "Viewer", email: "viewer@smarterp.com", password: "viewer123" },
];

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim())    { setError("Email is required.");    return; }
    if (!password.trim()) { setError("Password is required."); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError("");
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <i className="bi bi-layers" />
          </div>
          <div>
            <div className="login-title">SmartERP Lite</div>
          </div>
        </div>
        <p className="login-subtitle">Sign in to your workspace</p>

        {/* Error */}
        {error && (
          <div className="login-error">
            <i className="bi bi-exclamation-circle-fill" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label">Email address</label>
            <div className="input-group">
              <span className="input-group-text login-input-icon">
                <i className="bi bi-envelope" />
              </span>
              <input
                type="email"
                className="form-control login-input"
                placeholder="you@smarterp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text login-input-icon">
                <i className="bi bi-lock" />
              </span>
              <input
                type={showPw ? "text" : "password"}
                className="form-control login-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-group-text login-input-icon"
                onClick={() => setShowPw((v) => !v)}
                style={{ cursor: "pointer" }}
              >
                <i className={`bi bi-eye${showPw ? "-slash" : ""}`} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-brand w-100"
            disabled={loading}
            style={{ padding: "10px", fontSize: "0.9375rem", borderRadius: 10 }}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Signing in...</>
            ) : (
              <><i className="bi bi-box-arrow-in-right me-2" />Sign In</>
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="login-demo">
          <div className="login-demo-title">
            <i className="bi bi-info-circle" />
            Demo Credentials — click to fill
          </div>
          {DEMO_CREDS.map((c) => (
            <div
              key={c.role}
              className="login-demo-row"
              onClick={() => fillDemo(c)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fillDemo(c)}
            >
              <div className="d-flex align-items-center gap-2">
                <span
                  style={{
                    padding: "2px 8px", borderRadius: 100, fontSize: "0.7rem", fontWeight: 700,
                    background: c.role === "Admin" ? "rgba(79,70,229,0.1)" : "rgba(107,114,128,0.1)",
                    color: c.role === "Admin" ? "#4f46e5" : "#6b7280",
                  }}
                >
                  {c.role}
                </span>
                <span className="login-demo-creds">{c.email}</span>
              </div>
              <span className="login-demo-creds" style={{ color: "var(--brand)" }}>
                {c.password}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
