import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FiPlus, FiSearch, FiUser, FiEdit, FiTrash2, FiX } from "react-icons/fi";
import api from "../api/api";
import AdmitDischargeModal from "../components/AdmitDischargeModal";

export default function Patients() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const [patientsList, setPatientsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State for Admission / Discharge
  const [admitModalPatient, setAdmitModalPatient] = useState(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    try {
      setLoading(true);
      const data = await api.get("/patients");
      // Map _id to id to preserve frontend references
      const mapped = data.map((p) => ({ id: p._id, ...p }));
      setPatientsList(mapped);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !age || !phone) return;

    try {
      const patientData = {
        name,
        age: Number(age),
        gender,
        phone,
      };

      if (editingId) {
        await api.put(`/patients/${editingId}`, patientData);
      } else {
        await api.post("/patients", patientData);
      }

      resetForm();
      fetchPatients();
    } catch (error) {
      console.error("Error saving patient:", error);
    }
  }

  function handleEdit(patient) {
    setEditingId(patient.id);
    setName(patient.name);
    setAge(patient.age);
    setGender(patient.gender || "Male");
    setPhone(patient.phone);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this patient record?")) return;
    try {
      await api.delete(`/patients/${id}`);
      fetchPatients();
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  }

  function resetForm() {
    setName("");
    setAge("");
    setGender("Male");
    setPhone("");
    setEditingId(null);
    setShowForm(false);
  }

  const [activeTab, setActiveTab] = useState("all"); // "all", "admitted", "discharged"

  // Patients page strictly holds Admitted Patients & Discharged Patients
  const inpatients = patientsList.filter(patient => 
    patient.isAdmitted || (patient.admissionHistory && patient.admissionHistory.length > 0)
  );

  const filteredPatients = inpatients.filter((patient) => {
    const matchesSearch =
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === "admitted") return patient.isAdmitted;
    if (activeTab === "discharged") return !patient.isAdmitted && (patient.admissionHistory && patient.admissionHistory.length > 0);
    return true;
  });

  return (
    <div className="page-container">
      {admitModalPatient && (
        <AdmitDischargeModal
          patient={admitModalPatient}
          onClose={() => setAdmitModalPatient(null)}
          onUpdate={() => {
            fetchPatients();
          }}
        />
      )}

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Inpatient & Hospitalized Care Directory</h1>
          <p>View currently admitted patients, manage hospital ward stays, and access discharge history</p>
        </div>
        {isAdmin && !showForm && (
          <button className="btn-icon" onClick={() => setShowForm(true)}>
            <FiPlus /> Register Patient
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="crud-form-card">
          <h3 className="crud-form-title">
            {editingId ? "📝 Edit Patient Details" : "➕ Register New Patient"}
          </h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Patient Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ravi"
                required
              />
            </div>
            <div className="form-field">
              <label>Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 25"
                required
              />
            </div>
            <div className="form-field">
              <label>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-field">
              <label>Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary btn-icon" onClick={resetForm}>
              <FiX /> Cancel
            </button>
            <button type="submit" className="btn-primary btn-icon">
              Save Patient
            </button>
          </div>
        </form>
      )}

      {/* Patient Table */}
      <div className="crud-table-wrapper">
        <div className="crud-table-filters" style={{ flexWrap: "wrap" }}>
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                fontWeight: "800",
                fontSize: "0.88rem",
                cursor: "pointer",
                border: activeTab === "all" ? "2px solid #0A58A3" : "1.5px solid #CBD5E1",
                background: activeTab === "all" ? "linear-gradient(135deg, #0A58A3 0%, #00A89E 100%)" : "#FFFFFF",
                color: activeTab === "all" ? "#FFFFFF" : "#334155",
                boxShadow: activeTab === "all" ? "0 4px 12px rgba(10, 88, 163, 0.25)" : "none",
                transition: "all 0.2s"
              }}
            >
              All Inpatients ({inpatients.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("admitted")}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                fontWeight: "800",
                fontSize: "0.88rem",
                cursor: "pointer",
                border: activeTab === "admitted" ? "2px solid #059669" : "1.5px solid #CBD5E1",
                background: activeTab === "admitted" ? "linear-gradient(135deg, #059669 0%, #10B981 100%)" : "#FFFFFF",
                color: activeTab === "admitted" ? "#FFFFFF" : "#059669",
                boxShadow: activeTab === "admitted" ? "0 4px 12px rgba(16, 185, 129, 0.25)" : "none",
                transition: "all 0.2s"
              }}
            >
              🟢 Currently Admitted ({inpatients.filter(p => p.isAdmitted).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("discharged")}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                fontWeight: "800",
                fontSize: "0.88rem",
                cursor: "pointer",
                border: activeTab === "discharged" ? "2px solid #2563EB" : "1.5px solid #CBD5E1",
                background: activeTab === "discharged" ? "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)" : "#FFFFFF",
                color: activeTab === "discharged" ? "#FFFFFF" : "#2563EB",
                boxShadow: activeTab === "discharged" ? "0 4px 12px rgba(37, 99, 235, 0.25)" : "none",
                transition: "all 0.2s"
              }}
            >
              🔵 Discharged Patients ({inpatients.filter(p => !p.isAdmitted && p.admissionHistory?.length > 0).length})
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="login-spinner" style={{ margin: "0 auto", borderTopColor: "var(--color-primary)" }}></div>
            <p style={{ marginTop: "12px", color: "var(--text-muted)" }}>Loading records...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="no-data-msg">
            <p>No patient records found matching your filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Age / Gender</th>
                  <th>Contact</th>
                  <th>Admission Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    style={{ cursor: "pointer" }}
                    className="hover-row"
                  >
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: patient.isAdmitted
                            ? "rgba(16, 185, 129, 0.15)"
                            : (patient.admissionHistory && patient.admissionHistory.length > 0)
                            ? "rgba(59, 130, 246, 0.15)"
                            : "rgba(10, 88, 163, 0.1)",
                          color: patient.isAdmitted
                            ? "#10B981"
                            : (patient.admissionHistory && patient.admissionHistory.length > 0)
                            ? "#3B82F6"
                            : "var(--color-primary-light)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px"
                        }}>
                          <FiUser style={{ margin: "0 auto" }} />
                        </div>
                        <span style={{ fontWeight: "700", color: "var(--color-primary-light)" }}>
                          {patient.name}
                        </span>
                      </div>
                    </td>
                    <td>{patient.age} yrs · {patient.gender}</td>
                    <td>{patient.phone}</td>
                    <td>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdmitModalPatient(patient);
                        }}
                        style={{
                          background: patient.isAdmitted
                            ? "rgba(16, 185, 129, 0.15)"
                            : (patient.admissionHistory && patient.admissionHistory.length > 0)
                            ? "rgba(59, 130, 246, 0.15)"
                            : "rgba(245, 158, 11, 0.15)",
                          color: patient.isAdmitted
                            ? "#10B981"
                            : (patient.admissionHistory && patient.admissionHistory.length > 0)
                            ? "#3B82F6"
                            : "#D97706",
                          border: patient.isAdmitted
                            ? "1px solid rgba(16, 185, 129, 0.3)"
                            : (patient.admissionHistory && patient.admissionHistory.length > 0)
                            ? "1px solid rgba(59, 130, 246, 0.3)"
                            : "1px solid rgba(245, 158, 11, 0.3)",
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontWeight: "800",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.2s"
                        }}
                        title="Click to view admission details or change status"
                      >
                        {patient.isAdmitted
                          ? "🟢 Admitted (Click for details / discharge)"
                          : (patient.admissionHistory && patient.admissionHistory.length > 0)
                          ? "🔵 Discharged (Click to view history / re-admit)"
                          : "🟡 Outpatient (Click to admit)"}
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-table-action"
                          style={{ color: "var(--color-primary-light)" }}
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          title="View Medical Profile"
                        >
                          <FiUser /> Profile
                        </button>
                        <button
                          className="btn-table-action btn-edit"
                          onClick={(e) => { e.stopPropagation(); handleEdit(patient); }}
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="btn-table-action btn-delete"
                          onClick={(e) => { e.stopPropagation(); handleDelete(patient.id); }}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
