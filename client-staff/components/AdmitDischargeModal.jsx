import { useState, useEffect } from "react";
import { FiX, FiCheckCircle, FiClock, FiCalendar, FiFileText } from "react-icons/fi";
import { FaBed, FaHospitalUser } from "react-icons/fa";
import api from "../api/api";

export default function AdmitDischargeModal({ patient, onClose, onUpdate }) {
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState("General Ward");
  const [selectedBed, setSelectedBed] = useState("");
  const [admissionNotes, setAdmissionNotes] = useState("");
  const [dischargeNotes, setDischargeNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(patient);

  useEffect(() => {
    setCurrentPatient(patient);
    fetchWardsAndBeds();
  }, [patient]);

  async function fetchWardsAndBeds() {
    try {
      const [bedsData, wardsData] = await Promise.all([
        api.get("/wards/occupancy").catch(() => []),
        api.get("/wards").catch(() => [])
      ]);
      setBeds(Array.isArray(bedsData) ? bedsData : []);
      setWards(Array.isArray(wardsData) ? wardsData : []);
      
      const available = (Array.isArray(bedsData) ? bedsData : []).filter(b => b.status === "Available");
      if (available.length > 0) {
        setSelectedBed(available[0].bedNumber);
        setSelectedWard(available[0].ward || "General Ward");
      }
    } catch (err) {
      console.error("Failed to fetch beds/wards:", err);
    }
  }

  const isAdmitted = currentPatient?.isAdmitted || false;
  const history = currentPatient?.admissionHistory || [];

  async function handleAdmit(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.put(`/patients/${currentPatient._id}/admit`, {
        ward: selectedWard,
        bedNumber: selectedBed,
        notes: admissionNotes || "Admitted for inpatient care."
      });
      setCurrentPatient(res);
      alert(`Patient ${res.name} successfully ADMITTED to ${selectedWard} (Bed: ${selectedBed})!`);
      if (onUpdate) onUpdate(res);
    } catch (err) {
      console.error("Admit failed:", err);
      alert(err.response?.data?.message || "Failed to admit patient");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDischarge(e) {
    e.preventDefault();
    if (!window.confirm(`Are you sure you want to DISCHARGE patient ${currentPatient.name}?`)) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/patients/${currentPatient._id}/discharge`, {
        notes: dischargeNotes || "Patient discharged in stable condition."
      });
      setCurrentPatient(res);
      alert(`Patient ${res.name} successfully DISCHARGED!`);
      if (onUpdate) onUpdate(res);
    } catch (err) {
      console.error("Discharge failed:", err);
      alert(err.response?.data?.message || "Failed to discharge patient");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 99999, padding: "20px"
    }} onClick={onClose}>
      <div style={{
        background: "#0F172A", color: "#FFFFFF",
        borderRadius: "24px", width: "100%", maxWidth: "680px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        border: "1px solid #334155", overflow: "hidden",
        maxHeight: "90vh", display: "flex", flexDirection: "column"
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          background: isAdmitted
            ? "linear-gradient(135deg, #059669 0%, #10B981 100%)"
            : "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
          padding: "20px 28px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          color: "#FFFFFF"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.4rem"
            }}>
              <FaHospitalUser />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: "#FFFFFF" }}>
                {currentPatient.name}
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                Patient ID: {currentPatient._id} · Age: {currentPatient.age} ({currentPatient.gender})
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{
              background: "#FFFFFF",
              color: isAdmitted ? "#059669" : "#D97706",
              padding: "4px 14px", borderRadius: "20px",
              fontWeight: "800", fontSize: "0.85rem"
            }}>
              {isAdmitted ? "🟢 Currently Admitted" : "🟡 Not Admitted"}
            </span>
            <button 
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
                width: "32px", height: "32px", color: "#FFFFFF", display: "flex",
                alignItems: "center", justifyContent: "center", cursor: "pointer"
              }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "28px", overflowY: "auto", flex: 1 }}>
          
          {/* Active Status Card */}
          {isAdmitted ? (
            <div style={{
              background: "rgba(16, 185, 129, 0.08)",
              border: "1.5px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "16px", padding: "20px", marginBottom: "24px"
            }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#34D399", fontSize: "1.05rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiCheckCircle /> Admission Details
              </h4>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px", fontSize: "0.9rem" }}>
                <div>
                  <span style={{ color: "#94A3B8", fontSize: "0.78rem" }}>ADMISSION TIMESTAMP:</span>
                  <p style={{ margin: "2px 0 0 0", color: "#FFFFFF", fontWeight: "700" }}>
                    {currentPatient.admissionDate ? new Date(currentPatient.admissionDate).toLocaleString() : "Active Inpatient"}
                  </p>
                </div>
                <div>
                  <span style={{ color: "#94A3B8", fontSize: "0.78rem" }}>ASSIGNED WARD & BED:</span>
                  <p style={{ margin: "2px 0 0 0", color: "#60A5FA", fontWeight: "700" }}>
                    {currentPatient.assignedWard || "General Ward"} · Bed {currentPatient.assignedBed || "Unassigned"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleDischarge}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "#94A3B8", marginBottom: "6px" }}>
                    Discharge Summary / Doctor Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Recovered, advice follow-up in 1 week"
                    value={dischargeNotes}
                    onChange={e => setDischargeNotes(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 14px", background: "#1E293B",
                      border: "1.5px solid #334155", borderRadius: "10px", color: "#FFFFFF",
                      outline: "none", fontSize: "0.9rem"
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "12px", border: "none",
                    background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                    color: "#FFFFFF", fontWeight: "800", cursor: "pointer", fontSize: "0.95rem",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)"
                  }}
                >
                  {submitting ? "Processing Discharge..." : "🔴 Confirm & Discharge Patient"}
                </button>
              </form>
            </div>
          ) : (
            <div style={{
              background: "rgba(245, 158, 11, 0.08)",
              border: "1.5px solid rgba(245, 158, 11, 0.25)",
              borderRadius: "16px", padding: "20px", marginBottom: "24px"
            }}>
              <h4 style={{ margin: "0 0 12px 0", color: "#FBBF24", fontSize: "1.05rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaBed /> Admit Patient to Ward
              </h4>

              <form onSubmit={handleAdmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", color: "#94A3B8", marginBottom: "6px" }}>
                      Select Target Ward
                    </label>
                    <select
                      value={selectedWard}
                      onChange={e => setSelectedWard(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 14px", background: "#1E293B",
                        border: "1.5px solid #334155", borderRadius: "10px", color: "#FFFFFF",
                        outline: "none", fontSize: "0.9rem"
                      }}
                    >
                      <option value="General Ward">General Ward (Ground Floor)</option>
                      <option value="Specialty Wing">Specialty Wing (1st Floor)</option>
                      <option value="Pediatric Wing">Pediatric Wing (2nd Floor)</option>
                      <option value="ICU / Critical Care">ICU / Critical Care (3rd Floor)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", color: "#94A3B8", marginBottom: "6px" }}>
                      Available Bed Number
                    </label>
                    <select
                      value={selectedBed}
                      onChange={e => setSelectedBed(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 14px", background: "#1E293B",
                        border: "1.5px solid #334155", borderRadius: "10px", color: "#FFFFFF",
                        outline: "none", fontSize: "0.9rem"
                      }}
                    >
                      {beds.filter(b => b.status === "Available").map(b => (
                        <option key={b._id} value={b.bedNumber}>
                          Bed {b.bedNumber} ({b.ward})
                        </option>
                      ))}
                      {beds.filter(b => b.status === "Available").length === 0 && (
                        <option value="B-101">Bed B-101 (Auto-assign)</option>
                      )}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "#94A3B8", marginBottom: "6px" }}>
                    Admission Notes / Condition
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Admitted for post-op observation"
                    value={admissionNotes}
                    onChange={e => setAdmissionNotes(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 14px", background: "#1E293B",
                      border: "1.5px solid #334155", borderRadius: "10px", color: "#FFFFFF",
                      outline: "none", fontSize: "0.9rem"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "12px", border: "none",
                    background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                    color: "#FFFFFF", fontWeight: "800", cursor: "pointer", fontSize: "0.95rem",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)"
                  }}
                >
                  {submitting ? "Admitting..." : "🟢 Confirm & Admit Patient"}
                </button>
              </form>
            </div>
          )}

          {/* Historical Admission Logs */}
          <div>
            <h4 style={{ margin: "0 0 14px 0", color: "#FFFFFF", fontSize: "1rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
              <FiClock /> Previous Admission & Discharge History
            </h4>

            {history.length === 0 ? (
              <div style={{
                background: "#1E293B", padding: "16px", borderRadius: "12px",
                textAlign: "center", color: "#94A3B8", fontSize: "0.88rem"
              }}>
                No past admission/discharge records found for this patient.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[...history].reverse().map((item, idx) => (
                  <div key={idx} style={{
                    background: "#1E293B", border: "1px solid #334155",
                    borderRadius: "12px", padding: "14px 16px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    flexWrap: "wrap", gap: "12px"
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ color: "#60A5FA", fontWeight: "700", fontSize: "0.9rem" }}>
                          🛏️ {item.ward || "General Ward"} (Bed {item.bedNumber || "N/A"})
                        </span>
                        <span style={{
                          background: item.dischargedAt ? "rgba(148, 163, 184, 0.2)" : "rgba(16, 185, 129, 0.2)",
                          color: item.dischargedAt ? "#94A3B8" : "#34D399",
                          fontSize: "0.72rem", padding: "2px 8px", borderRadius: "12px", fontWeight: "700"
                        }}>
                          {item.dischargedAt ? "Discharged" : "Active Stay"}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "#CBD5E1" }}>
                        <strong>Admitted:</strong> {new Date(item.admittedAt).toLocaleString()}<br />
                        <strong>Discharged:</strong> {item.dischargedAt ? new Date(item.dischargedAt).toLocaleString() : "Currently Admitted"}
                      </p>
                      {item.notes && (
                        <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#94A3B8", fontStyle: "italic" }}>
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
