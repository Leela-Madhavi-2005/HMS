import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff, FiArrowLeft, FiPhone } from "react-icons/fi";
import logoImg from "../assets/logo.png";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const selectedRole = "patient";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, loginWithPhone } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!identifier.trim()) {
        setError("Please enter your email or mobile number");
        setLoading(false);
        return;
      }
      await login(identifier.trim(), password, selectedRole);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error details:", err);
      setError(err.response?.data?.message || err.message || "Login failed. Check details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Animated background shapes */}
      <div className="login-bg">
        <div className="login-bg-shape login-bg-shape-1"></div>
        <div className="login-bg-shape login-bg-shape-2"></div>
        <div className="login-bg-shape login-bg-shape-3"></div>
      </div>

      <div className="login-card">
        {/* Back Link */}
        <Link to="/" className="back-home-link" style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "#38bdf8",
          fontSize: "0.9rem",
          fontWeight: "700",
          marginBottom: "16px",
          width: "fit-content",
          transition: "color var(--transition-fast)",
          textShadow: "0 0 12px rgba(56, 189, 248, 0.6)",
          letterSpacing: "0.3px"
        }}>
          <FiArrowLeft /> Back to Home
        </Link>

        {/* Brand */}
        <div className="login-brand">
          <Link to="/" style={{ display: "inline-block" }}>
            <div className="login-logo" style={{ display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", width: "120px", height: "120px", background: "none", boxShadow: "none", borderRadius: "0", margin: "0 auto var(--space-md) auto" }}>
              <img src={logoImg} alt="Logo" style={{ width: "120px", height: "120px", borderRadius: "12px", objectFit: "contain" }} />
            </div>
          </Link>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px", color: "#ffffff" }}>
            <span style={{ color: "#0A58A3" }}>Medi</span><span style={{ color: "#00A89E" }}>Care</span> Patient Portal
          </div>
          <p>Sign in to your patient account</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="login-error">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="identifier">Email or Mobile Number</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                id="identifier"
                type="text"
                placeholder="Enter email or mobile number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <div className="login-spinner"></div>
            ) : (
              <>
                <FiLogIn />
                Access Portal
              </>
            )}
          </button>
        </form>

        <div className="login-footer" style={{ marginTop: "24px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Don't have an account? <Link to="/register" style={{ color: "var(--color-primary-light)", fontWeight: "600" }}>Register here</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
