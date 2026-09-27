import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FiPlus, FiFileText, FiTrash2, FiX } from "react-icons/fi";
import api from "../api/api";

export default function Prescriptions() {
  const { currentUser, userRole } = useAuth();
  
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Name mapping lookups
  const [patientLookup, setPatientLookup] = useState({});
  const [doctorLookup, setDoctorLookup] = useState({});

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [medicines, setMedicines] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch patients
      const patientData = await api.get("/patients");
      const patList = patientData.map((p) => ({ id: p._id, ...p }));
      const patMap = {};
      patList.forEach((p) => {
        patMap[p.id] = p.name;
      });
      setPatients(patList);
      setPatientLookup(patMap);

      // Fetch doctors
      const doctorData = await api.get("/doctors");
      const docMap = {};
      doctorData.forEach((d) => {
        docMap[d._id] = d.name;
      });
      setDoctorLookup(docMap);

      // Fetch prescriptions
      const rxData = await api.get("/prescriptions");
      const rxList = rxData.map((r) => ({ id: r._id, ...r }));
      setPrescriptions(rxList);

      if (patList.length > 0) {
        setSelectedPatientId(patList[0].id);
      }
    } catch (error) {
      console.error("Error fetching prescriptions data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!medicines || !notes) return;

    try {
      const rxPayload = {
        doctorId: currentUser?.doctorId,
        patientId: selectedPatientId,
        medicines,
        notes,
      };

      await api.post("/prescriptions", rxPayload);
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving prescription:", error);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this prescription?")) return;
    try {
      await api.delete(`/prescriptions/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting prescription:", error);
    }
  }

  function resetForm() {
    setMedicines("");
    setNotes("");
    setShowForm(false);
  }

  // Filter list by role
  const filteredPrescriptions = prescriptions.filter((rx) => {
    const patIdString = typeof rx.patientId === "object" ? rx.patientId?._id : rx.patientId;
    const docIdString = typeof rx.doctorId === "object" ? rx.doctorId?._id : rx.doctorId;

    if (userRole === "patient") {
      return patIdString === currentUser?.patientId;
    }
    if (userRole === "doctor") {
      return docIdString === currentUser?.doctorId;
    }
    return true; // Admin sees all
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Prescriptions</h1>
          <p>View and manage patient drug and dosage instructions</p>
        </div>
        {userRole === "doctor" && !showForm && (
          <button className="btn-icon" onClick={() => setShowForm(true)}>
            <FiPlus /> New Prescription
          </button>
        )}
      </div>

      {showForm && userRole === "doctor" && (
        <form onSubmit={handleSubmit} className="crud-form-card">
          <h3 className="crud-form-title">📝 Draft Patient Prescription</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Select Patient</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Age: {p.age})
                  </option>
                ))}
                {patients.length === 0 && <option value="">No patients registered</option>}
              </select>
            </div>
            
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label>Medicines & Dosage</label>
              <textarea
                value={medicines}
                onChange={(e) => setMedicines(e.target.value)}
                placeholder="e.g. Paracetamol - 500mg - Twice a day"
                rows={2}
                required
              />
            </div>
            
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label>Instruction Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Take after meals, plenty of water."
                rows={2}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary btn-icon" onClick={resetForm}>
              <FiX /> Cancel
            </button>
            <button type="submit" className="btn-primary btn-icon">
              Issue Prescription
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="crud-table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="login-spinner" style={{ margin: "0 auto", borderTopColor: "var(--color-primary)" }}></div>
            <p style={{ marginTop: "12px", color: "var(--text-muted)" }}>Loading prescriptions...</p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="no-data-msg">
            <p>No prescriptions found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Medicines</th>
                  <th>Notes</th>
                  {userRole === "admin" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map((rx) => {
                  const patName = typeof rx.patientId === "object"
                    ? rx.patientId?.name
                    : (patientLookup[rx.patientId] || rx.patientId || "Unknown Patient");
                  const docName = typeof rx.doctorId === "object"
                    ? rx.doctorId?.name
                    : (doctorLookup[rx.doctorId] || rx.doctorId || "Unknown Doctor");
                  
                  return (
                    <tr key={rx.id}>
                      <td style={{ fontWeight: "600" }}>{patName}</td>
                      <td>{docName}</td>
                      <td style={{ whiteSpace: "pre-wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FiFileText style={{ color: "var(--color-primary)" }} />
                          {rx.medicines}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{rx.notes}</td>
                      {userRole === "admin" && (
                        <td>
                          <button
                            className="btn-table-action btn-delete"
                            onClick={() => handleDelete(rx.id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      )}
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
