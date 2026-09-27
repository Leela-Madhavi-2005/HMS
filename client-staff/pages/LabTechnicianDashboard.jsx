import { useEffect, useState } from "react";
import { FaMicroscope, FaVials, FaClock } from "react-icons/fa";
import { FiPlus, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";

export default function LabTechnicianDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTests: 18, pendingTests: 2, completedToday: 8 });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page-container">
      <div className="dashboard-shell">
        <div className="dashboard-hero" style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}>
          <div>
            <p className="eyebrow">Diagnostic services</p>
            <h1>Welcome, {currentUser?.name || "Lab Tech"}</h1>
            <p>Process pending lab order requests, record test outcomes, and upload radiology/lab PDFs.</p>
          </div>
          <div className="hero-actions">
            <button className="pill-button pill-button-primary" onClick={() => navigate("/labs")}>
              <FiPlus /> Laboratory Desk
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={<FaVials />} title="Pending Lab Requests" value={stats.pendingTests} loading={loading} gradient="gradient-1" />
          <StatCard icon={<FaMicroscope />} title="Completed Today" value={stats.completedToday} loading={loading} gradient="gradient-2" />
          <StatCard icon={<FaClock />} title="Active Equipment Status" value="All Calibrated" loading={loading} gradient="gradient-3" />
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card dashboard-card-large">
            <div className="section-header">
              <div>
                <p className="eyebrow">Lab tests list</p>
                <h3>Pending Diagnostic Orders</h3>
              </div>
              <span className="status-pill status-active" style={{ background: "rgba(3, 105, 161, 0.2)", color: "#38bdf8" }}>Queue active</span>
            </div>
            <div className="detail-list" style={{ marginTop: "16px" }}>
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, color: "white" }}>John Doe</h4>
                  <span className="status-pill status-warning">Pending Blood Test</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  Requested test: CBC (Complete Blood Count) · Ordered by: Dr. Maya Chen
                </p>
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <button className="secondary-button" style={{ fontSize: "0.8rem", padding: "6px 12px", borderColor: "#38bdf8", color: "#38bdf8" }} onClick={() => navigate("/labs")}>
                    Log Results <FiArrowRight style={{ marginLeft: "4px" }} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Radiology upload status</p>
                <h3>Radiology Equipment logs</h3>
              </div>
            </div>
            <div className="detail-list">
              <div className="detail-item detail-item-stack">
                <FaMicroscope />
                <div>
                  <strong>MRI Unit B</strong>
                  <p>Calibration completed. Online for bookings.</p>
                </div>
              </div>
              <div className="detail-item detail-item-stack">
                <FaClock />
                <div>
                  <strong>X-Ray room 3</strong>
                  <p>Decontamination shift complete. Available.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
