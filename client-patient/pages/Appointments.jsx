import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FiPlus, FiCalendar, FiEdit, FiTrash2, FiX, FiCheck, FiPlayCircle } from "react-icons/fi";
import api from "../api/api";

export default function Appointments() {
  const { currentUser, userRole } = useAuth();
  
  // Lists
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lookups mapping id -> name
  const [doctorLookup, setDoctorLookup] = useState({});
  const [patientLookup, setPatientLookup] = useState({});

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("Pending");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch doctors
      const doctorData = await api.get("/doctors");
      const docList = doctorData.map((d) => ({ id: d._id, ...d }));
      const docMap = {};
      docList.forEach((d) => {
        docMap[d.id] = d.name;
      });
      setDoctors(docList);
      setDoctorLookup(docMap);

      // Fetch patients
      const patientData = await api.get("/patients");
      const patList = patientData.map((p) => ({ id: p._id, ...p }));
      const patMap = {};
      patList.forEach((p) => {
        patMap[p.id] = p.name;
      });
      setPatients(patList);
      setPatientLookup(patMap);

      // Fetch appointments
      const appointmentData = await api.get("/appointments");
      const apptList = appointmentData.map((a) => ({ id: a._id, ...a }));
      setAppointmentsList(apptList);

      // Set default selections
      if (docList.length > 0) setSelectedDoctorId(docList[0].id);
      if (patList.length > 0) setSelectedPatientId(patList[0].id);

    } catch (error) {
      console.error("Error fetching appointment data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!date) return;

    try {
      // Determine patientId:
      // If user is a patient, their patientId is their currentUser.patientId.
      // Otherwise, they select from dropdown.
      const pId = userRole === "patient" ? currentUser?.patientId : selectedPatientId;
      
      const appointmentData = {
        patientId: pId,
        doctorId: selectedDoctorId,
        date,
        status,
      };

      if (editingId) {
        await api.put(`/appointments/${editingId}`, appointmentData);
      } else {
        await api.post("/appointments", appointmentData);
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving appointment:", error);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await api.put(`/appointments/${id}`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  }

  function handleEdit(appt) {
    const patIdString = typeof appt.patientId === "object" ? appt.patientId?._id : appt.patientId;
    const docIdString = typeof appt.doctorId === "object" ? appt.doctorId?._id : appt.doctorId;

    setEditingId(appt.id);
    setSelectedDoctorId(docIdString);
    setSelectedPatientId(patIdString);
    setDate(appt.date);
    setStatus(appt.status);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to cancel and delete this appointment?")) return;
    try {
      await api.delete(`/appointments/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  }

  function resetForm() {
    setDate("");
    setStatus("Pending");
    setEditingId(null);
    setShowForm(false);
  }

  // Role-based filtering of appointments list
  const filteredAppointments = appointmentsList.filter((appt) => {
    const patIdString = typeof appt.patientId === "object" ? appt.patientId?._id : appt.patientId;
    const docIdString = typeof appt.doctorId === "object" ? appt.doctorId?._id : appt.doctorId;

    if (userRole === "patient") {
      return patIdString === currentUser?.patientId;
    }
    if (userRole === "doctor") {
      return docIdString === currentUser?.doctorId;
    }
    return true; // Admin/Receptionist sees all
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Appointments</h1>
          <p>Schedule, view, and process medical visits</p>
        </div>
        {/* Patients or Staff can book appointments */}
        {(userRole === "patient" || userRole === "admin" || userRole === "receptionist") && !showForm && (
          <button className="btn-icon btn-appointment-yellow" onClick={() => setShowForm(true)}>
            <FiPlus /> Book Appointment
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="crud-form-card">
          <h3 className="crud-form-title">
            {editingId ? "📝 Edit Appointment Details" : "📅 Book New Appointment"}
          </h3>
          <div className="form-grid">
            {/* Patient selector (only visible for staff) */}
            {userRole !== "patient" && (
              <div className="form-field">
                <label>Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  {patients.length === 0 && <option value="">No patients available</option>}
                </select>
              </div>
            )}

            {/* Doctor selector */}
            <div className="form-field">
              <label>Select Specialist</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
                {doctors.length === 0 && <option value="">No doctors available</option>}
              </select>
            </div>

            {/* Date */}
            <div className="form-field">
              <label>Appointment Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Status (Staff only) */}
            {userRole !== "patient" && (
              <div className="form-field">
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary btn-icon" onClick={resetForm}>
              <FiX /> Cancel
            </button>
            <button type="submit" className="btn-primary btn-icon">
              Confirm Appointment
            </button>
          </div>
        </form>
      )}

      {/* Appointments List */}
      <div className="crud-table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="login-spinner" style={{ margin: "0 auto", borderTopColor: "var(--color-primary)" }}></div>
            <p style={{ marginTop: "12px", color: "var(--text-muted)" }}>Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="no-data-msg">
            <p>No appointments found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => {
                  const patName = typeof appt.patientId === "object"
                    ? appt.patientId?.name
                    : (patientLookup[appt.patientId] || appt.patientId || "Unknown Patient");
                  const docName = typeof appt.doctorId === "object"
                    ? appt.doctorId?.name
                    : (doctorLookup[appt.doctorId] || appt.doctorId || "Unknown Doctor");
                  
                  return (
                    <tr key={appt.id}>
                      <td data-label="Patient" style={{ fontWeight: "600" }}>{patName}</td>
                      <td data-label="Doctor">{docName}</td>
                      <td data-label="Appointment Date">
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FiCalendar style={{ color: "var(--color-primary)" }} />
                          {appt.date}
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className={`badge ${
                          appt.status === "Approved" ? "badge-info" :
                          appt.status === "Completed" ? "badge-success" :
                          appt.status === "Cancelled" ? "badge-danger" : "badge-pending"
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          {/* Doctor Quick Actions */}
                          {userRole === "doctor" && appt.status === "Pending" && (
                            <>
                              <button
                                className="btn-table-action btn-edit"
                                onClick={() => handleStatusChange(appt.id, "Approved")}
                                title="Approve"
                                style={{ color: "var(--color-info)" }}
                              >
                                <FiCheck />
                              </button>
                              <button
                                className="btn-table-action btn-delete"
                                onClick={() => handleStatusChange(appt.id, "Cancelled")}
                                title="Cancel"
                              >
                                <FiX />
                              </button>
                            </>
                          )}

                          {userRole === "doctor" && appt.status === "Approved" && (
                            <button
                              className="btn-table-action btn-edit"
                              onClick={() => handleStatusChange(appt.id, "Completed")}
                              title="Complete Appointment"
                              style={{ color: "var(--color-success)" }}
                            >
                              <FiPlayCircle />
                            </button>
                          )}

                          {/* Admin/Receptionist Actions */}
                          {(userRole === "admin" || userRole === "receptionist") && (
                            <>
                              <button
                                className="btn-table-action btn-edit"
                                onClick={() => handleEdit(appt)}
                                title="Edit"
                              >
                                <FiEdit />
                              </button>
                              <button
                                className="btn-table-action btn-delete"
                                onClick={() => handleDelete(appt.id)}
                                title="Cancel & Delete"
                              >
                                <FiTrash2 />
                              </button>
                            </>
                          )}

                          {/* Patient Actions (Can only cancel/delete pending appointments) */}
                          {userRole === "patient" && appt.status === "Pending" && (
                            <button
                              className="btn-table-action btn-delete"
                              onClick={() => handleDelete(appt.id)}
                              title="Cancel Booking"
                            >
                              <FiX />
                            </button>
                          )}
                        </div>
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
