import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiMail, FiLock, FiUser, FiArrowLeft, FiPhone, FiEye, FiEyeOff, FiUserPlus } from "react-icons/fi";
import logoImg from "../assets/logo.png";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Register user
      await register({
        name,
        email,
        phone,
        password,
        role: "patient",
        age: 30, // Default for now to bypass backend requirement if age is not in the form
        gender: "Not Specified" // Default
      }); 
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || err.message || "Registration failed. Try again.");
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

      <div className="login-card" style={{ maxWidth: "500px" }}>
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
            <div className="login-logo" style={{ display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", width: "100px", height: "100px", background: "none", boxShadow: "none", borderRadius: "0", margin: "0 auto var(--space-md) auto" }}>
              <img src={logoImg} alt="Logo" style={{ width: "100px", height: "100px", borderRadius: "12px", objectFit: "contain" }} />
            </div>
          </Link>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px", color: "#ffffff" }}>
            <span style={{ color: "#0A58A3" }}>Medi</span><span style={{ color: "#00A89E" }}>Care</span> Registration
          </div>
          <p>Create your patient account</p>
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
            <label htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Mobile Number</label>
            <div className="input-wrapper">
              <FiPhone className="input-icon" />
              <input
                id="phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
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
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                <FiUserPlus />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="login-footer" style={{ marginTop: "24px" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Already have an account? <Link to="/login" style={{ color: "var(--color-primary-light)", fontWeight: "600" }}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
