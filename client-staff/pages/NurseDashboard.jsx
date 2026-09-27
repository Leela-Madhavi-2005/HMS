import { useEffect, useState } from "react";
import { FaUserPlus, FaHospital, FaNotesMedical, FaClock } from "react-icons/fa";
import { FiActivity, FiUser } from "react-icons/fi";
import StatCard from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/api";

export default function NurseDashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activePatients: 3, loggedVitals: 12, shiftHours: "08:00 - 16:00" });

  useEffect(() => {
    // Simulated load delay
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page-container">
      <div className="dashboard-shell">
        <div className="dashboard-hero" style={{ background: "linear-gradient(135deg, #0d9488 0%, #115e59 100%)" }}>
          <div>
            <p className="eyebrow">Nurse care ward</p>
            <h1>Welcome, {currentUser?.name || "Care Nurse"}</h1>
            <p>Monitor ward updates, log daily vitals, and assist attending doctors.</p>
          </div>
          <div className="hero-actions">
            <button className="pill-button" onClick={() => alert("Current Shift: Ward A Nurse-In-Charge")}>Shift Status</button>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={<FiActivity />} title="Assigned Patients" value={stats.activePatients} loading={loading} gradient="gradient-1" />
          <StatCard icon={<FaNotesMedical />} title="Vitals Logged Today" value={stats.loggedVitals} loading={loading} gradient="gradient-2" />
          <StatCard icon={<FaClock />} title="Shift Schedule" value={stats.shiftHours} loading={loading} gradient="gradient-3" />
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card dashboard-card-large">
            <div className="section-header">
              <div>
                <p className="eyebrow">Assigned Care Queue</p>
                <h3>Active Patients in Ward</h3>
              </div>
              <span className="status-pill status-active">Ward A Room 102</span>
            </div>
            <div className="detail-list" style={{ marginTop: "16px" }}>
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, color: "white" }}>John Doe</h4>
                  <span className="status-pill status-warning">Stable</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  Bed: 102 · Age: 32 · Blood Group: O+
                </p>
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <button className="secondary-button" style={{ fontSize: "0.8rem", padding: "6px 12px" }} onClick={() => alert("Logging temperature: 98.6°F, BP: 120/80...")}>Log Vitals</button>
                  <button className="secondary-button" style={{ fontSize: "0.8rem", padding: "6px 12px" }} onClick={() => alert("IV fluids, antibiotics, next check in 2 hours.")}>Add Nurse Notes</button>
                </div>
              </div>

              <div style={{ padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, color: "white" }}>Jane Smith</h4>
                  <span className="status-pill status-active">Recovering</span>
                </div>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  Bed: 202 · Age: 28 · Blood Group: AB-
                </p>
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <button className="secondary-button" style={{ fontSize: "0.8rem", padding: "6px 12px" }} onClick={() => alert("Logging temperature: 99.1°F, BP: 118/76...")}>Log Vitals</button>
                  <button className="secondary-button" style={{ fontSize: "0.8rem", padding: "6px 12px" }} onClick={() => alert("Patient resting post-op. Vitals stable.")}>Add Nurse Notes</button>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Announcements</p>
                <h3>Attending Duty Alerts</h3>
              </div>
            </div>
            <div className="detail-list">
              <div className="detail-item detail-item-stack">
                <FaHospital />
                <div>
                  <strong>ICU Ward Update</strong>
                  <p>ICU Bed 103 under maintenance until 6:00 PM.</p>
                </div>
              </div>
              <div className="detail-item detail-item-stack">
                <FiUser />
                <div>
                  <strong>Shift Handover</strong>
                  <p>Attending Nurse Rina Patel starts handover at 3:45 PM.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
