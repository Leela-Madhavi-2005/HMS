import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiCalendar, FiEdit, FiTrash2, FiX, FiCheck, FiPlayCircle, FiUser, FiPhone, FiAlertCircle, FiExternalLink, FiCreditCard } from "react-icons/fi";
import { FaLaptopMedical, FaWalking, FaRupeeSign } from "react-icons/fa";
import api from "../api/api";
import socket from "../api/socket";
import AdmitDischargeModal from "../components/AdmitDischargeModal";

export default function Appointments() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  
  // Lists
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Lookups mapping id -> name
  const [doctorLookup, setDoctorLookup] = useState({});
  const [patientLookup, setPatientLookup] = useState({});

  // Navigation tab
  const [activeTab, setActiveTab] = useState("online"); // "online", "walk-in", or "admitted"
  const [admitModalPatient, setAdmitModalPatient] = useState(null);

  // Fee collection state
  const [feePanel, setFeePanel] = useState(null); // appointment id or null
  const [feeAmount, setFeeAmount] = useState("");
  const [collectingFee, setCollectingFee] = useState(false);

  // Form states (Normal Appointment)
  const [showForm, setShowForm] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("Pending");
  const [editingId, setEditingId] = useState(null);

  // Form states (Walk-in OP)
  const [showOPForm, setShowOPForm] = useState(false);
  const [opName, setOpName] = useState("");
  const [opPhone, setOpPhone] = useState("");
  const [opReason, setOpReason] = useState("");
  const [opDoctorId, setOpDoctorId] = useState("");
  const [opDate, setOpDate] = useState("");

  useEffect(() => {
    fetchData(false);

    // Listen for real-time appointment updates from socket without triggering loading spinner
    const handleUpdate = () => {
      fetchData(true);
    };

    socket.on("appointment:update", handleUpdate);
    socket.on("notification", handleUpdate);

    return () => {
      socket.off("appointment:update", handleUpdate);
      socket.off("notification", handleUpdate);
    };
  }, []);

  async function fetchData(silent = false) {
    try {
      if (!silent) setLoading(true);

      // Parallelize API calls for ultra-fast loading
      const [doctorData, patientData, appointmentData] = await Promise.all([
        api.get("/doctors").catch(() => []),
        api.get("/patients").catch(() => []),
        api.get("/appointments").catch(() => [])
      ]);

      const safeDoctors = Array.isArray(doctorData) ? doctorData : [];
      const safePatients = Array.isArray(patientData) ? patientData : [];
      const safeAppointments = Array.isArray(appointmentData) ? appointmentData : [];

      const docList = safeDoctors.map((d) => ({ id: d._id, ...d }));
      const docMap = {};
      docList.forEach((d) => { if (d && d.id) docMap[d.id] = d.name; });
      setDoctors(docList);
      setDoctorLookup(docMap);

      const patList = safePatients.map((p) => ({ id: p._id, ...p }));
      const patMap = {};
      patList.forEach((p) => { if (p && p.id) patMap[p.id] = p.name; });
      setPatients(patList);
      setPatientLookup(patMap);

      // Map DB appointments
      const dbAppts = safeAppointments.map((a) => ({ id: a._id, ...a }));

      // Fallback merge from local storage (for guest/online booked ones before DB sync)
      const localAppts = JSON.parse(localStorage.getItem("mc_appointments") || "[]");
      const apptContainer = new Map();

      localAppts.forEach(la => {
        apptContainer.set(String(la.id), {
          id: String(la.id),
          _id: String(la.id),
          patientId: la.patientName || la.patientId || "Online Guest",
          doctorId: la.doctorName || la.doctorId || "Assigned Specialist",
          date: la.date,
          reason: la.purpose || la.reason || "Online Consultation",
          status: la.status || "Pending",
          token: la.token || "",
          consultationFee: la.consultationFee || 300,
          consultationFeePaid: la.consultationFeePaid || false
        });
      });

      dbAppts.forEach(da => {
        apptContainer.set(String(da.id), da);
      });

      setAppointmentsList(Array.from(apptContainer.values()));

      if (docList.length > 0) {
        setSelectedDoctorId(docList[0].id);
        setOpDoctorId(docList[0].id);
      }
      if (patList.length > 0) {
        setSelectedPatientId(patList[0].id);
      }
    } catch (error) {
      console.error("Error fetching appointment data:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Handle booking of standard / online appointment
  async function handleSubmit(e) {
    e.preventDefault();
    if (!date) return;

    try {
      setSubmitting(true);
      const pId = userRole === "patient" ? currentUser?.patientId : selectedPatientId;
      
      const targetDoc = doctors.find(d => d.id === selectedDoctorId || d._id === selectedDoctorId);
      const fee = targetDoc?.consultationFee || 300;

      const appointmentData = {
        patientId: pId,
        doctorId: selectedDoctorId,
        date,
        reason: reason || "General Consultation",
        status: editingId ? status : "Pending",
        consultationFee: fee,
        consultationFeePaid: editingId ? (feePanel === editingId ? true : false) : false
      };

      let createdRes;
      if (editingId) {
        await api.put(`/appointments/${editingId}`, appointmentData);
      } else {
        createdRes = await api.post("/appointments", appointmentData);
      }

      resetForm();
      await fetchData();

      // If new appointment booked by staff/receptionist, open QR payment modal immediately
      if (!editingId && createdRes?._id) {
        setFeePanel(createdRes._id);
        setFeeAmount(fee);
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert("Failed to book appointment. Please check values.");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle booking of Walk-in OP
  async function handleOPSubmit(e) {
    e.preventDefault();
    if (!opName || !opPhone || !opReason || !opDoctorId || !opDate) {
      alert("All fields are required for walk-in booking");
      return;
    }

    try {
      setSubmitting(true);

      // 1. Search if patient already exists by phone
      let patientId = "";
      const existingPatient = patients.find(p => p.phone === opPhone.trim());
      
      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        // Create new account
        const registerPayload = {
          name: opName.trim(),
          email: `${opPhone.trim()}@medicare.com`,
          password: opPhone.trim(), // password matches their phone number
          role: "patient",
          phone: opPhone.trim(),
          age: 30, // defaults
          gender: "Other"
        };
        const regResult = await api.post("/auth/register", registerPayload);
        patientId = regResult.patientId;
      }

      // 2. Fetch doctor to get fee
      const targetDoc = doctors.find(d => d.id === opDoctorId || d._id === opDoctorId);
      const docFee = targetDoc?.consultationFee || 300;

      // 3. Book appointment with prefix "OP: "
      const appointmentData = {
        patientId,
        doctorId: opDoctorId,
        date: opDate,
        reason: `OP: ${opReason.trim()}`,
        consultationFee: docFee,
        consultationFeePaid: true, // Walk-in OP pays at front desk counter
        status: "Approved", // Walk-in is auto-approved since they are at the hospital
      };

      await api.post("/appointments", appointmentData);
      
      resetOPForm();
      fetchData();
      alert("Walk-in OP booked and Patient profile created successfully!");
    } catch (error) {
      console.error("Error booking walk-in OP:", error);
      alert(error.response?.data?.message || "Failed to book Walk-in OP.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      const payload = { status: newStatus };
      await api.put(`/appointments/${id}`, payload);
      fetchData();
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  }

  // Collect consultation fee and mark as paid
  async function handleCollectFee(appt) {
    try {
      setCollectingFee(true);
      const fee = Number(feeAmount) || appt.consultationFee || 300;
      await api.put(`/appointments/${appt.id}`, {
        consultationFeePaid: true,
        consultationFee: fee,
      });
      // Also create a bill record
      const patId = typeof appt.patientId === "object" ? appt.patientId?._id : appt.patientId;
      await api.post("/bills", {
        patientId: patId,
        amount: fee,
        description: "Consultation Fee",
        status: "Paid",
      });
      setFeePanel(null);
      setFeeAmount("");
      fetchData();
    } catch (error) {
      console.error("Error collecting fee:", error);
      alert("Failed to mark fee as collected.");
    } finally {
      setCollectingFee(false);
    }
  }

  function handleEdit(appt) {
    const patIdString = typeof appt.patientId === "object" ? appt.patientId?._id : appt.patientId;
    const docIdString = typeof appt.doctorId === "object" ? appt.doctorId?._id : appt.doctorId;

    setEditingId(appt.id);
    setSelectedDoctorId(docIdString);
    setSelectedPatientId(patIdString);
    setDate(appt.date);
    setReason(appt.reason || "");
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
    setReason("");
    setStatus("Pending");
    setEditingId(null);
    setShowForm(false);
  }

  function resetOPForm() {
    setOpName("");
    setOpPhone("");
    setOpReason("");
    setOpDate("");
    setShowOPForm(false);
  }

  // Filter based on roles
  // Filter based on roles and exclude admitted/discharged patients
  const filteredAppointments = appointmentsList.filter((appt) => {
    const patIdString = typeof appt.patientId === "object" ? appt.patientId?._id : appt.patientId;
    const docIdString = typeof appt.doctorId === "object" ? appt.doctorId?._id : appt.doctorId;

    if (userRole === "patient") {
      if (patIdString !== currentUser?.patientId) return false;
    }
    if (userRole === "doctor") {
      if (docIdString !== currentUser?.doctorId) return false;
      if (appt.status === "Pending") return false;
    }

    // Exclude admitted or discharged patients from Appointments section
    const pObj = typeof appt.patientId === "object" ? appt.patientId : patients.find(p => p.id === appt.patientId || p._id === appt.patientId);
    if (pObj?.isAdmitted || (pObj?.admissionHistory && pObj.admissionHistory.length > 0)) {
      return false;
    }

    return true;
  });

  // Segregate between Online and Walk-in OPs
  const onlineAppointments = filteredAppointments.filter(appt => !appt.reason?.startsWith("OP: "));
  const walkinAppointments = filteredAppointments.filter(appt => appt.reason?.startsWith("OP: "));

  const currentTabList = activeTab === "walk-in" ? walkinAppointments : onlineAppointments;

  return (
    <div className="page-container" style={{ padding: "32px", fontFamily: "'Inter', sans-serif" }}>
      {admitModalPatient && (
        <AdmitDischargeModal
          patient={admitModalPatient}
          onClose={() => setAdmitModalPatient(null)}
          onUpdate={() => fetchData(true)}
        />
      )}

      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: "800", color: "var(--text-primary)" }}>Outpatient Appointments Directory</h1>
          <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>Schedule, view, and manage OP consultations and clinic visits</p>
        </div>
      </div>

      {/* TABS (For receptionist / doctors / admin) */}
      {userRole !== "patient" && (
        <div style={{
          display: "flex",
          borderBottom: "2px solid var(--card-border, #E5E7EB)",
          marginBottom: "20px",
          gap: "24px",
          flexWrap: "wrap"
        }}>
          <button
            onClick={() => setActiveTab("online")}
            style={{
              padding: "12px 8px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "online" ? "3px solid #0A58A3" : "3px solid transparent",
              color: activeTab === "online" ? "#0A58A3" : "var(--text-muted)",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            <FaLaptopMedical /> Online Appointments ({onlineAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab("walk-in")}
            style={{
              padding: "12px 8px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "walk-in" ? "3px solid #00A89E" : "3px solid transparent",
              color: activeTab === "walk-in" ? "#00A89E" : "var(--text-muted)",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            <FaWalking /> Walk-in OPs ({walkinAppointments.length})
          </button>
        </div>
      )}

      {/* Standard Booking / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="crud-form-card" style={{ marginBottom: "24px" }}>
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

            {/* Reason */}
            <div className="form-field">
              <label>Purpose / Health Issue</label>
              <input
                type="text"
                value={reason}
                placeholder="e.g. Health checkup"
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Status (Staff only) */}
            {userRole !== "patient" && (
              <div className="form-field">
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Checked-In">Checked-In</option>
                  <option value="Consulting">Consulting</option>
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
            <button type="submit" className="btn-primary btn-icon" disabled={submitting}>
              {submitting ? "Processing..." : "Confirm Appointment"}
            </button>
          </div>
        </form>
      )}

      {/* Walk-in OP Form */}
      {showOPForm && (
        <form onSubmit={handleOPSubmit} className="crud-form-card" style={{ marginBottom: "24px", borderColor: "#00A89E" }}>
          <h3 className="crud-form-title" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#00A89E" }}>
            <FaWalking /> Book Walk-in OP (Create Patient Profile)
          </h3>
          
          <div style={{
            display: "flex", gap: "8px", alignItems: "center",
            background: "rgba(0,168,158,0.06)", border: "1px solid rgba(0,168,158,0.18)",
            padding: "10px 14px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.85rem", color: "#00A89E"
          }}>
            <FiAlertCircle />
            <span>If the patient does not exist, an account is auto-created. They can login using their mobile number.</span>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Patient Full Name</label>
              <div className="input-wrapper" style={{ display: "flex", alignItems: "center" }}>
                <FiUser style={{ marginLeft: "12px", position: "absolute", color: "#9CA3AF" }} />
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={opName}
                  onChange={(e) => setOpName(e.target.value)}
                  style={{ paddingLeft: "38px" }}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label>Mobile Number (For Login)</label>
              <div className="input-wrapper" style={{ display: "flex", alignItems: "center" }}>
                <FiPhone style={{ marginLeft: "12px", position: "absolute", color: "#9CA3AF" }} />
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={opPhone}
                  onChange={(e) => setOpPhone(e.target.value)}
                  style={{ paddingLeft: "38px" }}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label>Health Issue / Complaint</label>
              <input
                type="text"
                placeholder="e.g. Fever and body pain"
                value={opReason}
                onChange={(e) => setOpReason(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Assign Specialist</label>
              <select
                value={opDoctorId}
                onChange={(e) => setOpDoctorId(e.target.value)}
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>OP Date</label>
              <input
                type="date"
                value={opDate}
                onChange={(e) => setOpDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-actions" style={{ marginTop: "20px" }}>
            <button type="button" className="btn-secondary btn-icon" onClick={resetOPForm}>
              <FiX /> Cancel
            </button>
            <button type="submit" className="btn-primary btn-icon" style={{ background: "#00A89E" }} disabled={submitting}>
              {submitting ? "Creating Profile..." : "Register & Book OP"}
            </button>
          </div>
        </form>
      )}

      {/* Appointments List Grid */}
      <div className="crud-table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="login-spinner" style={{ margin: "0 auto", borderTopColor: "var(--color-primary)" }}></div>
            <p style={{ marginTop: "12px", color: "var(--text-muted)" }}>Loading records...</p>
          </div>
        ) : currentTabList.length === 0 ? (
          <div className="no-data-msg" style={{ padding: "60px 20px", textAlign: "center" }}>
            <p>No appointments found in this category.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Issue / Reason</th>
                  <th>Admission Status</th>
                  <th>Appt Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentTabList.map((appt) => {
                  const patObj = typeof appt.patientId === "object"
                    ? appt.patientId
                    : patients.find(p => p.id === appt.patientId || p._id === appt.patientId);

                  const patName = typeof appt.patientId === "object"
                    ? appt.patientId?.name
                    : (patientLookup[appt.patientId] || appt.patientId || "Unknown Patient");
                  const docName = typeof appt.doctorId === "object"
                    ? appt.doctorId?.name
                    : (doctorLookup[appt.doctorId] || appt.doctorId || "Unknown Doctor");
                  
                  // Clean output of reason (strip OP: prefix)
                  const cleanReason = appt.reason?.startsWith("OP: ") 
                    ? appt.reason.substring(4) 
                    : appt.reason;

                  return (
                    <tr key={appt.id}>
                      <td>
                        {appt.token ? (
                          <span style={{
                            display: "inline-block",
                            background: "linear-gradient(135deg, #0A58A3, #00A89E)",
                            color: "#fff",
                            borderRadius: "8px",
                            padding: "3px 10px",
                            fontWeight: "800",
                            fontSize: "0.82rem",
                            letterSpacing: "0.5px",
                          }}>{appt.token}</span>
                        ) : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>}
                      </td>
                      <td style={{ fontWeight: "600" }}>
                        <button
                          onClick={() => {
                            const patId = typeof appt.patientId === "object" ? appt.patientId?._id : appt.patientId;
                            if (patId) navigate(`/patients/${patId}`);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#0A58A3",
                            fontWeight: "700",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "0.95rem",
                            textDecoration: "underline",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          title="Click to view Patient Profile"
                        >
                          {patName} <FiExternalLink size={13} />
                        </button>
                      </td>
                      <td>{docName}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FiCalendar style={{ color: "var(--color-primary)" }} />
                          {appt.date}
                        </div>
                      </td>
                      <td style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{cleanReason || "Consultation"}</td>
                      <td>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (patObj) setAdmitModalPatient(patObj);
                            else alert("Patient account details loading...");
                          }}
                          style={{
                            background: patObj?.isAdmitted ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: patObj?.isAdmitted ? "#10B981" : "#D97706",
                            border: patObj?.isAdmitted ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontWeight: "800",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          title="Click to view admission details or change status"
                        >
                          {patObj?.isAdmitted ? "🟢 Admitted" : "🟡 Not Admitted"}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span className={`badge ${
                            appt.status === "Approved"   ? "badge-info" :
                            appt.status === "Checked-In" ? "badge-info" :
                            appt.status === "Consulting" ? "badge-pending" :
                            appt.status === "Completed"  ? "badge-success" :
                            appt.status === "Cancelled"  ? "badge-danger" : "badge-pending"
                          }`}>
                            {appt.status}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: appt.consultationFeePaid ? "#10B981" : "#EF4444", fontWeight: "700" }}>
                            {appt.consultationFeePaid ? `₹${appt.consultationFee || 300} Paid ✓` : "Fee Unpaid"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {/* View Consultation Details Button (All Roles if Approved/Completed) */}
                          {(appt.status === "Approved" || appt.status === "Completed") && (
                            <button
                              className="btn-table-action"
                              onClick={() => navigate(`/consultation/${appt.id}`)}
                              title="View Consultation Details"
                              style={{
                                background: "#0A58A3", color: "#fff",
                                borderRadius: "6px", padding: "4px 10px",
                                fontSize: "0.8rem", fontWeight: "600",
                                border: "none", cursor: "pointer",
                                marginRight: "4px"
                              }}
                            >
                              View
                            </button>
                          )}

                          {/* Profile Button for All Roles removed */}

                          {/* Receptionist Fee Collection & QR Modal trigger */}
                          {(userRole === "admin" || userRole === "receptionist") && appt.status === "Pending" && !appt.consultationFeePaid && (
                            <button
                              className="btn-table-action"
                              onClick={() => {
                                setFeePanel(feePanel === appt.id ? null : appt.id);
                                setFeeAmount(appt.consultationFee || 300);
                              }}
                              title="Collect Consultation Fee & Show QR"
                              style={{ color: "#D97706", background: "rgba(217, 119, 6, 0.1)", borderRadius: "6px", padding: "4px 8px" }}
                            >
                              <FiCreditCard size={16} /> Pay Fee
                            </button>
                          )}

                          {/* Doctor Actions */}
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

                          {/* Admin/Receptionist Approve & Cancel */}
                          {(userRole === "admin" || userRole === "receptionist") && (
                            <>
                              {appt.status === "Pending" && (
                                <>
                                  <button
                                    className="btn-table-action"
                                    onClick={() => {
                                      if (!appt.consultationFeePaid) {
                                        alert("⚠️ Consultation fee must be collected before confirming the appointment!");
                                        setFeePanel(appt.id);
                                        setFeeAmount(appt.consultationFee || 300);
                                        return;
                                      }
                                      handleStatusChange(appt.id, "Approved");
                                    }}
                                    title={appt.consultationFeePaid ? "Approve Appointment" : "Collect Fee First"}
                                    style={{
                                      color: appt.consultationFeePaid ? "#10B981" : "#9CA3AF",
                                      background: "none", border: "none", cursor: appt.consultationFeePaid ? "pointer" : "not-allowed", padding: "4px"
                                    }}
                                  >
                                    <FiCheck size={18} />
                                  </button>
                                  <button
                                    className="btn-table-action"
                                    onClick={() => handleStatusChange(appt.id, "Cancelled")}
                                    title="Cancel Appointment"
                                    style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                                  >
                                    <FiX size={18} />
                                  </button>
                                </>
                              )}
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

                          {/* Patient Actions */}
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

                        {/* Inline QR & Fee Collection Modal */}
                        {feePanel === appt.id && (
                          <div style={{
                            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                            background: "rgba(0,0,0,0.7)", zIndex: 99999,
                            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
                          }}>
                            <div style={{
                              background: "#111827", color: "#fff", padding: "24px", borderRadius: "16px",
                              width: "100%", maxWidth: "380px", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)"
                            }}>
                              <h3 style={{ margin: "0 0 8px 0", color: "#fff" }}>💳 Consultation Fee Payment</h3>
                              <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "#9CA3AF" }}>
                                Patient: <strong>{patName}</strong>
                              </p>

                              {/* PhonePe Replica QR Code with Receiver Details */}
                              <div style={{
                                background: "#121212", padding: "16px", borderRadius: "16px", marginBottom: "16px",
                                border: "1px solid #2D2D2D", color: "#fff", textAlign: "center"
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", textAlign: "left" }}>
                                  <div style={{
                                    width: "40px", height: "40px", borderRadius: "50%", background: "#EAB308",
                                    color: "#000", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem"
                                  }}>R</div>
                                  <div>
                                    <div style={{ fontWeight: "700", fontSize: "1rem" }}>Raju</div>
                                    <div style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>+91 7981322657</div>
                                  </div>
                                </div>
                                <div style={{
                                  background: "rgba(16, 185, 129, 0.15)", color: "#10B981", fontSize: "0.75rem",
                                  fontWeight: "700", padding: "4px 10px", borderRadius: "12px", display: "inline-block", marginBottom: "14px"
                                }}>
                                  ✓ Receiving money on PhonePe
                                </div>
                                <div style={{ background: "#1E1E1E", padding: "14px", borderRadius: "14px", display: "inline-block" }}>
                                  <img src="/src/assets/qr_matrix.png" onError={(e) => e.target.src = "/assets/qr_matrix.png"} alt="UPI QR Code" style={{ width: "220px", height: "220px", objectFit: "contain", borderRadius: "8px" }} />
                                  <div style={{ marginTop: "10px", fontSize: "0.8rem", color: "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                    <span>🏦 Union Bank... - 7312</span>
                                  </div>
                                </div>
                              </div>

                              <div style={{ marginBottom: "16px", textAlign: "left" }}>
                                <label style={{ fontSize: "0.8rem", color: "#9CA3AF", display: "block", marginBottom: "4px" }}>Fee Amount (₹)</label>
                                <input
                                  type="number"
                                  value={feeAmount}
                                  onChange={(e) => setFeeAmount(e.target.value)}
                                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #374151", background: "#1F2937", color: "#fff", fontSize: "1.1rem", fontWeight: "700" }}
                                />
                              </div>

                              <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                  type="button"
                                  onClick={() => setFeePanel(null)}
                                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #374151", background: "transparent", color: "#9CA3AF", cursor: "pointer", fontWeight: "600" }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCollectFee(appt)}
                                  disabled={collectingFee}
                                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#10B981", color: "#fff", cursor: "pointer", fontWeight: "700" }}
                                >
                                  {collectingFee ? "Processing..." : "Confirm Paid ✓"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
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
