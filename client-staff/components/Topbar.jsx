import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiLogOut, FiBell, FiX, FiCheckCircle } from "react-icons/fi";
import useSocket from "../hooks/useSocket";

export default function Topbar({ onMenuToggle }) {
  const { currentUser, userRole, userData, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, clearNotifications } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName =
    userData?.name ||
    userData?.displayName ||
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "User";

  const displayRole = userRole
    ? userRole.charAt(0).toUpperCase() + userRole.slice(1)
    : "";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuToggle}>
          <FiMenu />
        </button>
        <div className="topbar-greeting">
          <h2>
            Welcome back, <span>{displayName}</span>
          </h2>
          <p>Here's what's happening today</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* Notification Bell */}
        <div ref={bellRef} style={{ position: "relative" }}>
          <button
            className="topbar-notification-btn"
            title="Notifications"
            onClick={() => setShowNotifications((v) => !v)}
            style={{ position: "relative" }}
          >
            <FiBell />
            {notifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#EF4444",
                  display: "block",
                  border: "2px solid var(--topbar-bg, #fff)",
                }}
              />
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              right: 0,
              width: "340px",
              background: "var(--card-bg, #fff)",
              border: "1.5px solid var(--card-border, #E5E7EB)",
              borderRadius: "14px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
              zIndex: 9999,
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                borderBottom: "1px solid var(--card-border, #E5E7EB)",
              }}>
                <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-primary, #111827)" }}>
                  🔔 Notifications
                  {notifications.length > 0 && (
                    <span style={{
                      marginLeft: "8px",
                      background: "#EF4444",
                      color: "#fff",
                      borderRadius: "10px",
                      padding: "1px 7px",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                    }}>{notifications.length}</span>
                  )}
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => { clearNotifications(); setShowNotifications(false); }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#0A58A3",
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FiCheckCircle size={13} /> Clear all
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted, #9CA3AF)" }}>
                    <FiBell size={28} style={{ marginBottom: "8px", opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: "0.88rem" }}>No new notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--card-border, #F3F4F6)",
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                        cursor: n.appointmentId ? "pointer" : "default",
                      }}
                      onClick={() => {
                        if (n.appointmentId) {
                          navigate(`/consultation/${n.appointmentId}`);
                          setShowNotifications(false);
                        }
                      }}
                    >
                      <span style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: "#3B82F6", flexShrink: 0, marginTop: "6px",
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 3px", fontSize: "0.84rem", color: "var(--text-primary, #111827)", lineHeight: 1.4 }}>
                          {n.message}
                        </p>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted, #9CA3AF)" }}>
                          {new Date(n.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="topbar-user">
          <div className="topbar-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="topbar-user-info">
            <p className="topbar-user-name">{displayName}</p>
            <span className={`role-badge role-${userRole?.toLowerCase()}`}>
              {displayRole}
            </span>
          </div>
        </div>

        <button className="topbar-logout-btn" onClick={handleLogout}>
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
