import { useEffect, useState } from "react";
import { FaBoxes, FaBriefcaseMedical, FaClock } from "react-icons/fa";
import { FiDollarSign, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/api";
import useSocket from "../hooks/useSocket";

export default function PharmacistDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalDrugs: 142, salesToday: 1450, lowStock: 4 });
  const [prescriptions, setPrescriptions] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  async function fetchPrescriptions() {
    try {
      setLoading(true);
      const data = await api.get("/prescriptions");
      setPrescriptions(data);
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDispense(rxId, rxMedicines, patientName) {
    if (!window.confirm(`Are you sure you want to dispense medicines for ${patientName}?`)) return;
    try {
      await api.delete(`/prescriptions/${rxId}`);
      alert(`Medicines dispensed successfully to ${patientName}: ${rxMedicines}. Pharmacy stock updated.`);
      fetchPrescriptions();
    } catch (err) {
      console.error("Dispensing failed:", err);
      alert("Failed to dispense prescription.");
    }
  }

  useEffect(() => {
    if (socket) {
      const handleReload = () => {
        fetchPrescriptions();
      };
      socket.on("prescription:created", handleReload);
      socket.on("prescription:paid", handleReload);
      return () => {
        socket.off("prescription:created", handleReload);
        socket.off("prescription:paid", handleReload);
      };
    }
  }, [socket]);

  return (
    <div className="page-container">
      <div className="dashboard-shell">
        <div className="dashboard-hero" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" }}>
          <div>
            <p className="eyebrow">Pharmacy inventory</p>
            <h1>Welcome, {currentUser?.name || "Pharmacist"}</h1>
            <p>Manage pharmaceutical logs, process medicine sales, and check expiry listings.</p>
          </div>
          <div className="hero-actions">
            <button className="pill-button pill-button-primary" onClick={() => navigate("/pharmacy")}>
              <FiPlus /> Manage Stock
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={<FaBoxes />} title="Total Drug Items" value={stats.totalDrugs} loading={loading} gradient="gradient-1" />
          <StatCard icon={<FiDollarSign />} title="Sales Today" value={`$${stats.salesToday}`} loading={loading} gradient="gradient-2" />
          <StatCard icon={<FaBriefcaseMedical />} title="Low Stock Alerts" value={stats.lowStock} loading={loading} gradient="gradient-4" />
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card dashboard-card-large">
            <div className="section-header">
              <div>
                <p className="eyebrow">Prescription fulfillment</p>
                <h3>Pending Doctor Prescriptions</h3>
              </div>
              <span className="status-pill status-active">Active Queue</span>
            </div>
            <div className="detail-list" style={{ marginTop: "16px" }}>
              {prescriptions.length === 0 ? (
                <p style={{ color: "var(--text-muted)", padding: "12px 0" }}>No pending doctor prescriptions found.</p>
              ) : (
                prescriptions.map((rx) => {
                  const patientName = typeof rx.patientId === "object" ? rx.patientId?.name : (rx.patientId || "Unknown Patient");
                  const doctorName = typeof rx.doctorId === "object" ? rx.doctorId?.name : (rx.doctorId || "Staff Doctor");
                  const isPaid = rx.paymentStatus === "Paid";
                  
                  return (
                    <div key={rx._id} style={{ padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                        <h4 style={{ margin: 0, color: "white" }}>{patientName}</h4>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "0.8rem", color: "#94A3B8" }}>Price: <strong style={{ color: "white" }}>${rx.price !== undefined ? rx.price.toFixed(2) : "25.00"}</strong></span>
                          <span className={`status-pill ${isPaid ? "status-active" : "status-warning"}`} style={{ 
                            background: isPaid ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                            color: isPaid ? "#34D399" : "#FBBF24"
                          }}>
                            {isPaid ? "PAID" : "UNPAID"}
                          </span>
                        </div>
                      </div>
                      <p style={{ margin: "0 0 6px 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                        Medicines: <strong>{rx.medicines}</strong>
                      </p>
                      <p style={{ margin: "0 0 12px 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Notes: {rx.notes} · Prescribed by: Dr. {doctorName}
                      </p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button 
                          className="secondary-button" 
                          style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                          onClick={() => {
                            const patId = typeof rx.patientId === "object" ? rx.patientId?._id : rx.patientId;
                            if (patId) navigate(`/patients/${patId}`);
                          }}
                        >
                          View Patient Profile
                        </button>
                        {isPaid ? (
                          <button 
                            className="secondary-button" 
                            style={{ fontSize: "0.8rem", padding: "6px 12px", borderColor: "#10B981", color: "#10B981", cursor: "pointer" }} 
                            onClick={() => handleDispense(rx._id, rx.medicines, patientName)}
                          >
                            Dispense Medicine
                          </button>
                        ) : (
                          <button 
                            className="secondary-button" 
                            disabled 
                            style={{ fontSize: "0.8rem", padding: "6px 12px", borderColor: "rgba(255,255,255,0.1)", color: "#64748B", cursor: "not-allowed" }}
                          >
                            Awaiting QR Scanner Payment
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Logistics</p>
                <h3>Supplier Deliveries</h3>
              </div>
            </div>
            <div className="detail-list">
              <div className="detail-item detail-item-stack">
                <FaClock />
                <div>
                  <strong>Biochem Labs Corp</strong>
                  <p>In transit: 50 batches of insulin. ETA: 2:00 PM.</p>
                </div>
              </div>
              <div className="detail-item detail-item-stack">
                <FaBoxes />
                <div>
                  <strong>Stock audit scheduled</strong>
                  <p>Weekly physical inventory audit starts Friday 5:00 PM.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
