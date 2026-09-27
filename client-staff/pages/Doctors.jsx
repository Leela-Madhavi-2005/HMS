import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FaUserMd } from "react-icons/fa";
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiX } from "react-icons/fi";
import api from "../api/api";

export default function Doctors() {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const isStaff = userRole === "admin" || userRole === "receptionist";

  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("General");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  async function fetchDoctors() {
    try {
      setLoading(true);
      const data = await api.get("/doctors");
      const mapped = data.map((doc) => ({ id: doc._id, ...doc }));
      setDoctorsList(mapped);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !phone) return;

    try {
      const doctorData = {
        name,
        specialization,
        phone,
      };

      if (editingId) {
        await api.put(`/doctors/${editingId}`, doctorData);
      } else {
        await api.post("/doctors", doctorData);
      }
      
      resetForm();
      fetchDoctors();
    } catch (error) {
      console.error("Error saving doctor:", error);
    }
  }

  function handleEdit(doctor) {
    setEditingId(doctor.id);
    setName(doctor.name);
    setSpecialization(doctor.specialization);
    setPhone(doctor.phone);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this doctor record?")) return;
    try {
      await api.delete(`/doctors/${id}`);
      fetchDoctors();
    } catch (error) {
      console.error("Error deleting doctor:", error);
    }
  }

  function resetForm() {
    setName("");
    setSpecialization("General Medicine");
    setPhone("");
    setEditingId(null);
    setShowForm(false);
  }

  const filteredDoctors = doctorsList.filter(
    (doc) =>
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Doctors Directory</h1>
          <p>View and manage medical specialists</p>
        </div>
        {isAdmin && !showForm && (
          <button className="btn-icon" onClick={() => setShowForm(true)}>
            <FiPlus /> Add Doctor
          </button>
        )}
      </div>

      {/* Form overlay/card */}
      {isAdmin && showForm && (
        <form onSubmit={handleSubmit} className="crud-form-card">
          <h3 className="crud-form-title">
            {editingId ? "📝 Edit Doctor Profile" : "➕ Add New Doctor"}
          </h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Doctor Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Raj"
                required
              />
            </div>
            <div className="form-field">
              <label>Specialization</label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Oncology">Oncology</option>
                <option value="Urology">Urology</option>
                <option value="Gynecology">Gynecology</option>
                <option value="ENT">ENT</option>
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
              Save Doctor
            </button>
          </div>
        </form>
      )}

      {/* Doctors Table */}
      <div className="crud-table-wrapper">
        <div className="crud-table-filters">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="login-spinner" style={{ margin: "0 auto", borderTopColor: "var(--color-primary)" }}></div>
            <p style={{ marginTop: "12px", color: "var(--text-muted)" }}>Loading records...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="no-data-msg">
            <p>No doctor records found matching your filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Contact Phone</th>
                  {isStaff && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "rgba(14, 165, 233, 0.1)",
                          color: "var(--color-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px"
                        }}>
                          <FaUserMd style={{ margin: "0 auto" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: "600" }}>{doc.name}</span>
                          {doc.availableDates && doc.availableDates.length > 0 && (
                            <span style={{ fontSize: "0.72rem", color: "var(--color-info)", marginTop: "2px", fontWeight: "600" }}>
                              📅 Avail: {doc.availableDates.join(", ")}
                            </span>
                          )}
                          {doc.availableHours && doc.availableHours.length > 0 && (
                            <span style={{ fontSize: "0.72rem", color: "#00A89E", marginTop: "1px", fontWeight: "600" }}>
                              ⏰ Hours: {doc.availableHours.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{doc.specialization}</span>
                    </td>
                    <td>{doc.phone}</td>
                    {isStaff && (
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-table-action btn-edit"
                            onClick={() => handleEdit(doc)}
                            title="Edit"
                          >
                            <FiEdit />
                          </button>
                          <button
                            className="btn-table-action btn-delete"
                            onClick={() => handleDelete(doc.id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    )}
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
