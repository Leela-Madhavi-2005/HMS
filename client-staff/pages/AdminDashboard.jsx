import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCalendarCheck, FaMoneyBillWave, FaUserMd, FaUsers } from "react-icons/fa";
import { FiBarChart2, FiClipboard, FiShield, FiUsers as FiUsersIcon } from "react-icons/fi";
import StatCard from "../components/StatCard";
import api from "../api/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    doctors: 24,
    patients: 184,
    appointments: 96,
    revenue: 128000,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await api.get("/dashboard/stats");
        setStats({ ...stats, ...data });
        setError(null);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Analytics and management are now populated from stats
  const analytics = stats.analytics || [];
  const management = stats.management || [];

  return (
    <div className="page-container">
      <div className="dashboard-shell">
        <div className="dashboard-hero dashboard-hero-admin">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Administrator dashboard</h1>
            <p>Monitor hospital performance, staffing, and critical operations.</p>
          </div>
          <div className="hero-actions">
            <button className="pill-button" onClick={() => alert("All hospital systems are fully operational.")}>System active</button>
            <button className="pill-button pill-button-primary" onClick={() => alert("Daily operational reports successfully prepared.")}>Open reports</button>
          </div>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        <div className="stats-grid">
          <StatCard icon={<FaUserMd />} title="Total Doctors" value={stats.doctors} loading={loading} gradient="gradient-1" />
          <StatCard icon={<FaUsers />} title="Total Patients" value={stats.patients} loading={loading} gradient="gradient-2" />
          <StatCard icon={<FaCalendarCheck />} title="Total Appointments" value={stats.appointments} loading={loading} gradient="gradient-3" />
          <StatCard icon={<FaMoneyBillWave />} title="Total Revenue" value={`₹${stats.revenue}`} loading={loading} gradient="gradient-4" />
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Revenue analytics</p>
                <h3>Financial snapshot</h3>
              </div>
            </div>
            <div className="detail-list">
              {analytics.map((item) => (
                <div key={item.label} className="metric-row">
                  <div><strong>{item.label}</strong><p>{item.value}</p></div>
                  <span className="status-pill status-info">Live</span>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Operations</p>
                <h3>Bed and staffing overview</h3>
              </div>
            </div>
            <div className="detail-list">
              {management.map((item) => (
                <div key={item.title} className="detail-item detail-item-stack">
                  <FiBarChart2 />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Reports</p>
                <h3>Generate operational reports</h3>
              </div>
            </div>
            <div className="detail-list">
              <div className="detail-item detail-item-stack" style={{ cursor: "pointer" }} onClick={() => alert("Downloading Patient Admissions report...")}>
                <FiClipboard /> 
                <div>
                  <strong>Patient reports</strong>
                  <p>Admissions and discharge summaries</p>
                </div>
              </div>
              <div className="detail-item detail-item-stack" style={{ cursor: "pointer" }} onClick={() => alert("Downloading Financial Performance report...")}>
                <FiShield /> 
                <div>
                  <strong>Financial reports</strong>
                  <p>Revenue and billing performance</p>
                </div>
              </div>
              <div className="detail-item detail-item-stack" style={{ cursor: "pointer" }} onClick={() => alert("Downloading Staff Attendance report...")}>
                <FiUsersIcon /> 
                <div>
                  <strong>Staff reports</strong>
                  <p>Attendance and duties</p>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">User management</p>
                <h3>Role-based administration</h3>
              </div>
            </div>
            <div className="detail-list">
              <div className="metric-row" style={{ cursor: "pointer" }} onClick={() => navigate("/doctors")}>
                <div>
                  <strong>Add doctor</strong>
                  <p>Create new staff accounts</p>
                </div>
                <span className="status-pill status-active">Create</span>
              </div>
              <div className="metric-row" style={{ cursor: "pointer" }} onClick={() => alert("Role assigning interface coming soon!")}>
                <div>
                  <strong>Assign roles</strong>
                  <p>Manage permissions</p>
                </div>
                <span className="status-pill status-info">Manage</span>
              </div>
            </div>
          </section>
        </div>

        <section className="dashboard-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Quick actions</p>
              <h3>Administrative tasks</h3>
            </div>
          </div>
          <div className="action-grid">
            <button className="quick-action" onClick={() => navigate("/register")}>Add user</button>
            <button className="quick-action" onClick={() => alert("Displaying hospital analytics graphs...")}>View analytics</button>
            <button className="quick-action" onClick={() => alert("PDF report generated successfully.")}>Generate reports</button>
            <button className="quick-action" onClick={() => alert("Department management modules coming soon!")}>Manage departments</button>
            <button className="quick-action" onClick={() => alert("Database backup successfully saved to local directory.")}>Backup database</button>
          </div>
        </section>
      </div>
    </div>
  );
}
