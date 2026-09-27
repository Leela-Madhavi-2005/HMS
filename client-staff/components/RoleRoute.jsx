import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RoleRoute({ allowedRoles, children }) {
  const { userRole } = useAuth();

  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="access-denied">
        <div className="access-denied-card">
          <div className="access-denied-icon">🔒</div>
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
          <p className="access-denied-role">
            Your role: <span>{userRole || "Unknown"}</span>
          </p>
        </div>
      </div>
    );
  }

  return children;
}
