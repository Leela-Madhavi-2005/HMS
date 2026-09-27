import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FiHome,
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiGrid,
  FiActivity,
  FiPackage,
  FiShield,
  FiX,
} from "react-icons/fi";
import { FaUserMd } from "react-icons/fa";
import logoImg from "../assets/logo.png";

const navItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: <FiHome />,
    roles: ["admin", "doctor", "receptionist", "nurse", "pharmacist", "lab_technician"],
  },
  {
    path: "/doctors",
    label: "Doctors",
    icon: <FaUserMd />,
    roles: ["admin", "receptionist", "doctor", "nurse", "pharmacist", "lab_technician"],
  },
  {
    path: "/patients",
    label: "Patients",
    icon: <FiUserPlus />,
    roles: ["admin", "doctor", "receptionist", "nurse", "pharmacist", "lab_technician"],
  },
  {
    path: "/appointments",
    label: "Appointments",
    icon: <FiCalendar />,
    roles: ["admin", "doctor", "receptionist"],
  },
  {
    path: "/prescriptions",
    label: "Prescriptions",
    icon: <FiFileText />,
    roles: ["admin", "doctor"],
  },
  {
    path: "/bills",
    label: "Bills",
    icon: <FiDollarSign />,
    roles: ["admin", "receptionist"],
  },
  {
    path: "/wards",
    label: "Wards & Beds",
    icon: <FiGrid />,
    roles: ["admin", "receptionist", "nurse"],
  },
  {
    path: "/labs",
    label: "Laboratory",
    icon: <FiActivity />,
    roles: ["admin", "doctor", "lab_technician"],
  },
  {
    path: "/pharmacy",
    label: "Pharmacy Stock",
    icon: <FiPackage />,
    roles: ["admin", "pharmacist"],
  },
  {
    path: "/employees",
    label: "Employees & HR",
    icon: <FiUsers />,
    roles: ["admin"],
  },
  {
    path: "/audit-log",
    label: "Audit Log",
    icon: <FiShield />,
    roles: ["admin"],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { userRole } = useAuth();

  const filteredItems = navItems.filter(
    (item) => item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        {/* Logo / Brand */}
        <div className="sidebar-brand">
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={logoImg} alt="Logo" style={{ height: "35px", width: "auto", objectFit: "contain" }} />
            <div style={{ fontSize: "1.4rem", fontWeight: "800", margin: 0, lineHeight: 1 }}>
              <span className="medi-text" style={{ color: "#0A58A3" }}>Medi</span><span className="care-text" style={{ color: "#00A89E" }}>Care</span>
              <p style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>
                Staff Portal
              </p>
            </div>
          </Link>
          <button className="sidebar-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
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
          <p>© 2026 <span style={{ color: "#0A58A3", fontWeight: "600" }}>Medi</span><span style={{ color: "#00A89E", fontWeight: "600" }}>Care</span> HMS</p>
        </div>
      </aside>
    </>
  );
}
