import { useState, useEffect } from "react";
import { FiShield, FiRefreshCw, FiFilter } from "react-icons/fi";
import api from "../api/api";

const ACTION_COLORS = {
  login:   { bg: "rgba(16,185,129,0.12)", color: "#059669" },
  logout:  { bg: "rgba(107,114,128,0.12)", color: "#4B5563" },
  create:  { bg: "rgba(59,130,246,0.12)",  color: "#1D4ED8" },
  update:  { bg: "rgba(245,158,11,0.12)",  color: "#B45309" },
  delete:  { bg: "rgba(239,68,68,0.12)",   color: "#DC2626" },
  default: { bg: "rgba(99,102,241,0.12)",  color: "#4338CA" },
};

function getActionStyle(action = "") {
  const key = Object.keys(ACTION_COLORS).find((k) => action.toLowerCase().includes(k));
  return ACTION_COLORS[key] || ACTION_COLORS.default;
}

export default function AuditLog() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("");

  async function fetchLogs() {
    try {
      setLoading(true);
      const data = await api.get("/auditlogs");
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter((log) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.userId?.name?.toLowerCase().includes(q) ||
      log.userId?.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FiShield style={{ color: "#6366F1" }} /> Audit Log
          </h1>
          <p>Track all system actions — who did what and when</p>
        </div>
        <button className="btn-icon" onClick={fetchLogs} style={{ background: "#6366F1", display: "flex", alignItems: "center", gap: "6px" }}>
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", maxWidth: "400px" }}>
        <FiFilter style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="Filter by user, action, or details..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            flex: 1, padding: "9px 14px",
            border: "1.5px solid var(--card-border, #E5E7EB)",
            borderRadius: "8px", fontSize: "0.88rem",
            background: "var(--card-bg, #fff)",
            color: "var(--text-primary, #111827)",
            outline: "none",
          }}
        />
        {filter && (
          <button
            onClick={() => setFilter("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}
          >✕</button>
        )}
      </div>

      {/* Stats strip */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
        {[
          { label: "Total Events", value: logs.length, color: "#6366F1" },
          { label: "Today",        value: logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString()).length, color: "#0A58A3" },
          { label: "Shown",        value: filtered.length, color: "#00A89E" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "var(--card-bg, #fff)",
            border: "1.5px solid var(--card-border, #E5E7EB)",
            borderRadius: "10px", padding: "12px 20px",
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <span style={{ fontSize: "1.4rem", fontWeight: "800", color: s.color }}>{s.value}</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Log Table */}
      <div className="crud-table-wrapper">
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <div className="login-spinner" style={{ margin: "0 auto", borderTopColor: "#6366F1" }} />
            <p style={{ marginTop: "12px", color: "var(--text-muted)" }}>Loading audit logs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="no-data-msg" style={{ padding: "48px", textAlign: "center" }}>
            <FiShield size={40} style={{ color: "var(--card-border)", marginBottom: "12px" }} />
            <p>{filter ? "No logs match your filter." : "No audit logs recorded yet."}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="crud-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, idx) => {
                  const actionStyle = getActionStyle(log.action);
                  const userName = log.userId?.name || log.userId?.email || "System";
                  const userRole = log.userId?.role || "—";
                  const ts = new Date(log.createdAt);
                  return (
                    <tr key={log._id}>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{idx + 1}</td>
                      <td style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                          {ts.toLocaleDateString("en-IN")}
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                          {ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ fontWeight: "600" }}>{userName}</td>
                      <td>
                        <span className={`role-badge role-${userRole.toLowerCase()}`} style={{ fontSize: "0.72rem" }}>
                          {userRole}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: "inline-block",
                          background: actionStyle.bg,
                          color: actionStyle.color,
                          padding: "3px 10px",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: "700",
                        }}>{log.action}</span>
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "220px" }}>
                        {log.details || "—"}
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                        {log.ipAddress || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
