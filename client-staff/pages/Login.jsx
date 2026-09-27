import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff, FiBriefcase, FiUser, FiPhone, FiCheckCircle } from "react-icons/fi";
import logoImg from "../assets/logo.png";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("General");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("admin"); // default role selector
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!isRegister || selectedRole !== "admin") {
        // If not registering or registering non-admin, email is standard
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          setError("Please enter a valid email address (e.g. name@domain.com)");
          setLoading(false);
          return;
        }
      }

      if (isRegister) {
        const payload = {
          name,
          email: email.trim(),
          password,
          role: selectedRole,
          phone
        };
        if (selectedRole === "doctor") {
          payload.specialization = specialization;
        }
        await register(payload);
        setSuccess(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        await login(email.trim(), password, selectedRole);
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Authentication error details:", err);
      setError(err.response?.data?.message || err.message || "Authentication failed. Check details and try again.");
    } finally {
      setLoading(false);
    }
  }

  const toggleAuthMode = () => {
    setError("");
    setIsRegister(!isRegister);
  };

  return (
    <div className="login-page">
      {/* Animated background shapes */}
      <div className="login-bg">
        <div className="login-bg-shape login-bg-shape-1"></div>
        <div className="login-bg-shape login-bg-shape-2"></div>
        <div className="login-bg-shape login-bg-shape-3"></div>
      </div>

      <div className="login-card">
        {/* Brand */}
        <div className="login-brand" style={{ marginTop: "16px" }}>
          <div className="login-logo" style={{ display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", width: "120px", height: "120px", background: "none", boxShadow: "none", borderRadius: "0", margin: "0 auto var(--space-md) auto" }}>
            <img src={logoImg} alt="Logo" style={{ width: "120px", height: "120px", borderRadius: "12px", objectFit: "contain" }} />
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", marginBottom: "8px", color: "#ffffff" }}>
            <span style={{ color: "#0A58A3" }}>Medi</span><span style={{ color: "#00A89E" }}>Care</span> Staff Portal
          </div>
          <p>{isRegister ? "Create a new authorized staff account" : "Sign in using your authorized staff credentials"}</p>
        </div>

        {/* Success registration alert */}
        {success ? (
          <div style={{
            textAlign: "center",
            padding: "24px 16px",
            background: "rgba(22, 163, 74, 0.12)",
            border: "1px solid rgba(22, 163, 74, 0.25)",
            borderRadius: "10px",
            color: "#86efac",
            marginBottom: "20px"
          }}>
            <FiCheckCircle size={36} style={{ marginBottom: "8px" }} />
            <h4 style={{ margin: "0 0 4px 0", color: "#ffffff" }}>Registration Successful!</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.9 }}>Preparing your staff workspace...</p>
          </div>
        ) : (
          <>
            {/* Error message */}
            {error && (
              <div className="login-error">
                <span>⚠️</span>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form">
              {/* Role selection dropdown */}
              <div className="form-group">
                <label htmlFor="login-role">Staff Role</label>
                <div className="input-wrapper">
                  <FiBriefcase className="input-icon" />
                  <select
                    id="login-role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 42px",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "10px",
                      color: "white",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="admin" style={{ color: "black" }}>Administrator</option>
                    <option value="doctor" style={{ color: "black" }}>Doctor</option>
                    <option value="receptionist" style={{ color: "black" }}>Receptionist</option>
                    <option value="nurse" style={{ color: "black" }}>Nurse</option>
                    <option value="pharmacist" style={{ color: "black" }}>Pharmacist</option>
                    <option value="lab_technician" style={{ color: "black" }}>Lab Technician</option>
                  </select>
                </div>
              </div>

              {isRegister && (
                <>
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
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <div className="input-wrapper">
                      <FiPhone className="input-icon" />
                      <input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  {selectedRole === "doctor" && (
                    <div className="form-group">
                      <label htmlFor="specialization">Medical Specialization</label>
                      <div className="input-wrapper">
                        <FiBriefcase className="input-icon" />
                        <select
                          id="specialization"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 14px 12px 42px",
                            background: "rgba(255, 255, 255, 0.06)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "10px",
                            color: "white",
                            outline: "none",
                            cursor: "pointer"
                          }}
                        >
                          <option value="General" style={{ color: "black" }}>General</option>
                          <option value="Cardiology" style={{ color: "black" }}>Cardiology</option>
                          <option value="Neurology" style={{ color: "black" }}>Neurology</option>
                          <option value="Orthopedics" style={{ color: "black" }}>Orthopedics</option>
                          <option value="Dermatology" style={{ color: "black" }}>Dermatology</option>
                          <option value="Pediatrics" style={{ color: "black" }}>Pediatrics</option>
                          <option value="Oncology" style={{ color: "black" }}>Oncology</option>
                          <option value="Urology" style={{ color: "black" }}>Urology</option>
                          <option value="Gynecology" style={{ color: "black" }}>Gynecology</option>
                          <option value="ENT" style={{ color: "black" }}>ENT</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

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
                    autoComplete="email"
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
                    autoComplete="new-password"
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
                    {isRegister ? "Register Account" : "Access Portal"}
                  </>
                )}
              </button>
            </form>

            {/* Registration toggle option */}
            <div style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "0.9rem",
              color: "rgba(255, 255, 255, 0.7)"
            }}>
              {isRegister ? (
                <>
                  Already registered?{" "}
                  <button
                    onClick={toggleAuthMode}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#7dd3fc",
                      fontWeight: "700",
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline"
                    }}
                  >
                    Sign In here
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={toggleAuthMode}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#7dd3fc",
                      fontWeight: "700",
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline"
                    }}
                  >
                    Register here
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
