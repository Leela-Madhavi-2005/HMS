import { useEffect, useState } from "react";
import { FiPlus, FiGrid, FiCheckCircle } from "react-icons/fi";
import { FaHospital } from "react-icons/fa";
import api from "../api/api";

export default function Wards() {
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [wardName, setWardName] = useState("");
  const [wardType, setWardType] = useState("General");
  const [totalBeds, setTotalBeds] = useState("");
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [showWardForm, setShowWardForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const wardData = await api.get("/wards");
      setWards(wardData);
      
      const bedData = await api.get("/wards/occupancy");
      setBeds(bedData);
      
      const patientData = await api.get("/patients");
      setPatients(patientData);
      if (patientData.length > 0) setSelectedPatientId(patientData[0]._id);
    } catch (err) {
      console.error("Failed to fetch wards data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWard(e) {
    e.preventDefault();
    if (!wardName || !totalBeds) return;
    try {
      await api.post("/wards", { name: wardName, type: wardType, totalBeds });
      setWardName("");
      setTotalBeds("");
      setShowWardForm(false);
      fetchData();
    } catch (err) {
      console.error("Failed to create ward", err);
    }
  }

  async function handleAllocateBed(e) {
    e.preventDefault();
    if (!selectedBed || !selectedPatientId) return;
    try {
      await api.put(`/wards/bed/${selectedBed._id}`, {
        status: "Occupied",
        patientId: selectedPatientId,
      });
      setSelectedBed(null);
      fetchData();
    } catch (err) {
      console.error("Failed to allocate bed", err);
    }
  }

  async function handleDischarge(bedId) {
    if (!window.confirm("Are you sure you want to vacate and discharge this bed?")) return;
    try {
      await api.put(`/wards/bed/${bedId}`, {
        status: "Available",
        patientId: null,
      });
      fetchData();
    } catch (err) {
      console.error("Failed to release bed", err);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Wards & Bed Roster</h1>
          <p>Admit patients, view ward distribution, and allocate general or ICU beds.</p>
        </div>
        <button className="btn-icon" onClick={() => setShowWardForm(!showWardForm)}>
          <FiPlus /> New Ward
        </button>
      </div>

      {showWardForm && (
        <form onSubmit={handleCreateWard} className="crud-form-card" style={{ marginBottom: "24px" }}>
          <h3 className="crud-form-title">🏥 Create New Hospital Ward</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Ward / Floor Name</label>
              <input type="text" value={wardName} onChange={(e) => setWardName(e.target.value)} placeholder="e.g. ICU Wing Floor 3" required />
            </div>
            <div className="form-field">
              <label>Ward Category</label>
              <select value={wardType} onChange={(e) => setWardType(e.target.value)}>
                <option value="General">General Ward</option>
                <option value="ICU">ICU (Critical Care)</option>
                <option value="Private">Private Room</option>
                <option value="Deluxe">Deluxe Suite</option>
              </select>
            </div>
            <div className="form-field">
              <label>Total Beds Available</label>
              <input type="number" value={totalBeds} onChange={(e) => setTotalBeds(e.target.value)} placeholder="e.g. 10" required />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: "16px" }}>
            <button type="submit" className="btn-primary">Add Ward</button>
          </div>
        </form>
      )}

      {selectedBed && (
        <form onSubmit={handleAllocateBed} className="crud-form-card" style={{ marginBottom: "24px", border: "2.5px solid var(--color-primary)" }}>
          <h3 className="crud-form-title">🛌 Allocate Patient to Bed: {selectedBed.bedNumber} ({selectedBed.ward})</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Select Admitted Patient</label>
              <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} (Phone: {p.phone})</option>
                ))}
                {patients.length === 0 && <option value="">No patients available</option>}
              </select>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: "16px" }}>
            <button type="button" className="btn-secondary" style={{ marginRight: "8px" }} onClick={() => setSelectedBed(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Allocate Bed</button>
          </div>
        </form>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
        {/* Beds Grid */}
        <section className="dashboard-card" style={{ padding: "20px" }}>
          <div className="section-header" style={{ marginBottom: "16px" }}>
            <div>
              <p className="eyebrow">Interactive Floorplan</p>
              <h3>Bed Allocations</h3>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}><p>Loading roster...</p></div>
          ) : beds.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>No beds configured. Run seed scripts or add wards.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
              {beds.map((bed) => {
                const isOccupied = bed.status === "Occupied";
                const isMaintenance = bed.status === "Maintenance";

                return (
                  <div
                    key={bed._id}
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: isOccupied ? "rgba(239,68,68,0.1)" : isMaintenance ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)",
                      border: `1.5px solid ${isOccupied ? "#ef4444" : isMaintenance ? "#f59e0b" : "#10b981"}`,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "1.1rem", color: "white" }}>Bed {bed.bedNumber}</strong>
                        <span style={{ fontSize: "0.8rem", padding: "4px 8px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", color: "white" }}>{bed.ward}</span>
                      </div>
                      <p style={{ margin: "8px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {isOccupied ? `Patient: ${bed.patientId?.name || "Assigned"}` : isMaintenance ? "Under Maintenance" : "Available"}
                      </p>
                    </div>
                    <div style={{ marginTop: "16px" }}>
                      {!isOccupied && !isMaintenance && (
                        <button className="secondary-button" style={{ fontSize: "0.8rem", padding: "6px 12px", width: "100%" }} onClick={() => setSelectedBed(bed)}>
                          Assign Bed
                        </button>
                      )}
                      {isOccupied && (
                        <button className="secondary-button" style={{ fontSize: "0.8rem", padding: "6px 12px", width: "100%", borderColor: "#ef4444", color: "#ef4444" }} onClick={() => handleDischarge(bed._id)}>
                          Discharge / Vacate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
