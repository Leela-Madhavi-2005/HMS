import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiHome, FiUser, FiX } from "react-icons/fi";
import logoImg from "../assets/logo.png";

// Hospital cross SVG — same size as other sidebar icons
const HospitalCrossIcon = () => (
  <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="35" y="10" width="30" height="80" rx="9" fill="currentColor" />
    <rect x="10" y="35" width="80" height="30" rx="9" fill="currentColor" />
    <path d="M 22 50 L 36 50 L 44 28 L 56 72 L 64 50 L 78 50" stroke="#00A89E" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const navItems = [
  {
    path: "/medicare",
    label: "MediCare",
    icon: <HospitalCrossIcon />,
    roles: ["admin", "doctor", "receptionist", "patient"],
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: <FiHome />,
    roles: ["admin", "doctor", "receptionist", "patient"],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { userRole } = useAuth();

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        {/* Logo / Brand */}
        <div className="sidebar-brand">
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <img src={logoImg} alt="Logo" style={{ height: "45px", width: "auto", objectFit: "contain" }} />
            <div style={{ fontSize: "1.4rem", fontWeight: "800", margin: 0, lineHeight: 1 }}>
              <span className="medi-text" style={{ color: "#0A58A3" }}>Medi</span><span className="care-text" style={{ color: "#00A89E" }}>Care</span>
              <p style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                Multispeciality Hospital
              </p>
            </div>
          </Link>
          <button className="sidebar-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
              }
              onClick={onClose}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <p>© 2026 <span style={{ color: "#0A58A3", fontWeight: "600" }}>Medi</span><span style={{ color: "#00A89E", fontWeight: "600" }}>Care</span></p>
        </div>
      </aside>
    </>
  );
}
