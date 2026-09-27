import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiActivity,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiGrid,
  FiClipboard,
  FiUpload,
  FiDownload,
  FiHeart
} from "react-icons/fi";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import AdmitDischargeModal from "../components/AdmitDischargeModal";

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole, currentUser } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [labs, setLabs] = useState([]);
  const [beds, setBeds] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedApptId, setExpandedApptId] = useState(null);
  const [showAdmitModal, setShowAdmitModal] = useState(false);

  // New Prescription Form State
  const [showPrescForm, setShowPrescForm] = useState(false);
  const [newMedicines, setNewMedicines] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPrice, setNewPrice] = useState("25");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [savingPrescription, setSavingPrescription] = useState(false);

  // Edit Prescription State
  const [editPrescId, setEditPrescId] = useState(null);
  const [editMedicines, setEditMedicines] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [updatingPrescription, setUpdatingPrescription] = useState(false);

  // New Billing Form State
  const [showBillForm, setShowBillForm] = useState(false);
  const [billAmount, setBillAmount] = useState("50");
  const [billDescription, setBillDescription] = useState("Doctor Consultation Fee");
  const [postingBill, setPostingBill] = useState(false);

  useEffect(() => {
    fetchPatientData();
    window.handlePayPrescription = async (prescId) => {
      try {
        await api.put(`/prescriptions/${prescId}/pay`);
        fetchPatientData();
        alert("Prescription payment successful!");
      } catch (err) {
        console.error("Payment failed:", err);
      }
    };
  }, [id]);

  async function fetchPatientData() {
    try {
      setLoading(true);

      const [patientData, apptData, prescData, billData, labData, bedData, doctorData] = await Promise.all([
        api.get(`/patients`),
        api.get("/appointments"),
        api.get("/prescriptions"),
        api.get("/bills"),
        api.get("/labs"),
        api.get("/wards/occupancy"),
        api.get("/doctors")
      ]);

      const matchedPatient = patientData.find((p) => p._id === id);
      setPatient(matchedPatient);

      setAppointments(apptData.filter((a) => a.patientId?._id === id || a.patientId === id));
      setPrescriptions(prescData.filter((p) => p.patientId?._id === id || p.patientId === id));
      setBills(billData.filter((b) => b.patientId?._id === id || b.patientId === id));
      setLabs(labData.filter((l) => l.patientId?._id === id || l.patientId === id));
      setBeds(bedData);
      setDoctors(doctorData);
      if (doctorData.length > 0) setSelectedDoctorId(doctorData[0]._id);
    } catch (err) {
      console.error("Failed to load patient profile details:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPrescription(e) {
    e.preventDefault();
    if (!newMedicines) return;

    const docId = userRole === "doctor" ? currentUser?.doctorId : selectedDoctorId;
    if (!docId) {
      alert("Doctor reference not found. Cannot issue prescription.");
      return;
    }

    try {
      setSavingPrescription(true);
      await api.post("/prescriptions", {
        patientId: patient._id,
        doctorId: docId,
        medicines: newMedicines,
        notes: newNotes,
        price: Number(newPrice)
      });
      setNewMedicines("");
      setNewNotes("");
      setNewPrice("25");
      setShowPrescForm(false);
      fetchPatientData();
      alert("Prescription added successfully!");
    } catch (err) {
      console.error("Failed to add prescription:", err);
      alert(err.response?.data?.message || "Failed to add prescription");
    } finally {
      setSavingPrescription(false);
    }
  }

  async function handleUpdatePrescription(prescId, isFinalized = false) {
    if (!editMedicines) return;
    try {
      setUpdatingPrescription(true);
      await api.put(`/prescriptions/${prescId}`, {
        medicines: editMedicines,
        notes: editNotes,
        price: Number(editPrice),
        isFinalized
      });
      setEditPrescId(null);
      fetchPatientData();
      alert(isFinalized ? "Prescription finalized and sent to pharmacy!" : "Prescription draft updated successfully!");
    } catch (err) {
      console.error("Failed to update prescription:", err);
      alert(err.response?.data?.message || "Failed to update prescription");
    } finally {
      setUpdatingPrescription(false);
    }
  }

  async function handlePostBill(e) {
    e.preventDefault();
    if (!billAmount) return;
    try {
      setPostingBill(true);
      await api.post("/bills", {
        patientId: patient._id,
        amount: Number(billAmount),
        description: billDescription || "Appointment Consultation Fee",
        status: "Unpaid"
      });
      setBillAmount("50");
      setBillDescription("Doctor Consultation Fee");
      setShowBillForm(false);
      fetchPatientData();
      alert("Billing fee posted successfully!");
    } catch (err) {
      console.error("Failed to post bill:", err);
      alert("Failed to post billing fee.");
    } finally {
      setPostingBill(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Loading patient records...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "40px" }}>
        <h2>Patient profile not found</h2>
        <button className="btn-secondary" onClick={() => navigate("/patients")}>
          Back to Directory
        </button>
      </div>
    );
  }

  // Derive stable/admitted status based on isAdmitted flag
  const isAdmitted = patient.isAdmitted || false;
  const assignedBed = beds.find((b) => b.patientId?._id === patient._id || b.patientId === patient._id);

  // Mock extended profile properties consistently based on patient id string length
  const bloodGroup = (patient.name.length % 4 === 0) ? "O+" : (patient.name.length % 4 === 1) ? "A+" : (patient.name.length % 4 === 2) ? "B+" : "AB-";
  const aadhaarNumber = `XXXX-XXXX-${(patient.phone || "1234").slice(-4)}`;
  const allergies = (patient.name.length % 2 === 0) ? "Penicillin, Peanuts" : "None";
  const chronicDiseases = (patient.name.length % 3 === 0) ? "Type-2 Diabetes" : "Hypertension, Asthma";
  const insuranceProvider = "Star Health Insurance Corp";
  const insurancePolicy = "POL-993882-HMS";
  const validityDate = "2029-12-31";
  const coverageAmount = "$25,000";
  const outstandingBalance = bills.reduce((acc, curr) => (curr.status === "Unpaid" ? acc + curr.amount : acc), 0);

  // Vitals generator for appointments
  const getMockVitals = (apptId) => {
    const pulse = 70 + (apptId.charCodeAt(apptId.length - 1) % 15);
    const temp = 98.4 + (apptId.charCodeAt(apptId.length - 2) % 3) * 0.4;
    return {
      temp: `${temp.toFixed(1)} °F`,
      pulse: `${pulse} bpm`,
      oxygen: "98%",
      bp: "120/80 mmHg",
      weight: "72 kg",
      height: "174 cm",
      bmi: "23.8"
    };
  };

  return (
    <div className="page-container">
      {/* Header & Back Action */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => navigate("/patients")}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-primary-light)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            fontSize: "0.95rem"
          }}
        >
          <FiArrowLeft /> Back to Directory
        </button>
      </div>

      {/* Patient Overview Block */}
      <div
        className="dashboard-card"
        style={{
          padding: "24px",
          background: "linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.95) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          marginBottom: "24px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "24px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(16,185,129,0.15)",
              border: "2px solid #10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              color: "#10b981"
            }}
          >
            <FiUser />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <h2 style={{ margin: 0, color: "white" }}>{patient.name}</h2>
              <button
                type="button"
                onClick={() => setShowAdmitModal(true)}
                style={{
                  background: isAdmitted
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(245, 158, 11, 0.2)",
                  color: isAdmitted ? "#34D399" : "#FBBF24",
                  border: isAdmitted
                    ? "1px solid rgba(16, 185, 129, 0.4)"
                    : "1px solid rgba(245, 158, 11, 0.4)",
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontWeight: "800",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
                title="Click to view admission/discharge details or change status"
              >
                {isAdmitted ? "🟢 Admitted (Click for details / Discharge)" : "🟡 Not Admitted (Click to Admit)"}
              </button>
            </div>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Patient ID: {patient._id} · Age: {patient.age} · Gender: {patient.gender}
            </p>
          </div>
        </div>

        {showAdmitModal && (
          <AdmitDischargeModal
            patient={patient}
            onClose={() => setShowAdmitModal(false)}
            onUpdate={(updated) => {
              setPatient(updated);
              fetchPatientData();
            }}
          />
        )}

        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Blood Group</p>
            <strong style={{ fontSize: "1.2rem", color: "white" }}>{bloodGroup}</strong>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Outstanding Balance</p>
            <strong style={{ fontSize: "1.2rem", color: "#f87171" }}>${outstandingBalance}</strong>
          </div>
          {isAdmitted && (
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>Bed Code</p>
              <strong style={{ fontSize: "1.2rem", color: "#60a5fa" }}>Bed {assignedBed.bedNumber} ({assignedBed.ward})</strong>
            </div>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div
        style={{
          display: "flex",
          borderBottom: "1.5px solid rgba(255,255,255,0.08)",
          marginBottom: "24px",
          gap: "16px",
          overflowX: "auto",
          paddingBottom: "8px"
        }}
      >
        {[
          { id: "overview", label: "Overview", icon: <FiUser /> },
          { id: "timeline", label: "Timeline", icon: <FiActivity /> },
          { id: "appointments", label: "Appointments", icon: <FiCalendar /> },
          { id: "labs", label: "Lab Records", icon: <FiClipboard /> },
          { id: "prescriptions", label: "Prescriptions", icon: <FiFileText /> },
          { id: "billing", label: "Bills & Claims", icon: <FiDollarSign /> },
          { id: "documents", label: "Documents", icon: <FiUpload /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                color: isActive ? "var(--color-primary-light)" : "var(--text-secondary)",
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: isActive ? "2.5px solid var(--color-primary-light)" : "none",
                whiteSpace: "nowrap"
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {/* PANEL: OVERVIEW */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            <div className="dashboard-card" style={{ padding: "20px" }}>
              <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", color: "white" }}>Medical Profile</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-secondary)", marginTop: "12px" }}>
                <tbody>
                  <tr><td style={{ padding: "8px 0" }}>Allergies:</td><td style={{ textAlign: "right", color: "white" }}>{allergies}</td></tr>
                  <tr><td style={{ padding: "8px 0" }}>Chronic Diseases:</td><td style={{ textAlign: "right", color: "white" }}>{chronicDiseases}</td></tr>
                  <tr><td style={{ padding: "8px 0" }}>Organ Donor:</td><td style={{ textAlign: "right", color: "white" }}>Registered (Yes)</td></tr>
                  <tr><td style={{ padding: "8px 0" }}>Identification:</td><td style={{ textAlign: "right", color: "white" }}>Aadhaar ({aadhaarNumber})</td></tr>
                  <tr><td style={{ padding: "8px 0" }}>Disabilities:</td><td style={{ textAlign: "right", color: "white" }}>None</td></tr>
                </tbody>
              </table>
            </div>

            <div className="dashboard-card" style={{ padding: "20px" }}>
              <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", color: "white" }}>Insurance Coverage</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-secondary)", marginTop: "12px" }}>
                <tbody>
                  <tr><td style={{ padding: "8px 0" }}>Provider:</td><td style={{ textAlign: "right", color: "white" }}>{insuranceProvider}</td></tr>
                  <tr><td style={{ padding: "8px 0" }}>Policy ID:</td><td style={{ textAlign: "right", color: "white" }}>{insurancePolicy}</td></tr>
                  <tr><td style={{ padding: "8px 0" }}>Validity:</td><td style={{ textAlign: "right", color: "white" }}>{validityDate}</td></tr>
                  <tr><td style={{ padding: "8px 0" }}>Coverage Limit:</td><td style={{ textAlign: "right", color: "white" }}>{coverageAmount}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="dashboard-card" style={{ padding: "20px", gridColumn: "span 1" }}>
              <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", color: "white" }}>Emergency Contacts</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-secondary)", marginTop: "12px" }}>
                <tbody>
                  <tr><td style={{ padding: "8px 0" }}>Contact Name:</td><td style={{ textAlign: "right", color: "white" }}>Sarah Doe</td></tr>
                  <tr><td style={{ padding: "8px 0" }}>Relationship:</td><td style={{ textAlign: "right", color: "white" }}>Spouse</td></tr>
                  <tr><td style={{ padding: "8px 0" }}>Phone Number:</td><td style={{ textAlign: "right", color: "white" }}>555-0992</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PANEL: TIMELINE */}
        {activeTab === "timeline" && (
          <div className="dashboard-card" style={{ padding: "24px" }}>
            <h3 style={{ marginBottom: "20px", color: "white" }}>Chronological Medical History</h3>
            <div style={{ borderLeft: "2px solid rgba(255,255,255,0.08)", paddingLeft: "24px", marginLeft: "12px" }}>
              {appointments.map((appt) => (
                <div key={appt._id} style={{ marginBottom: "24px", position: "relative" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "var(--color-primary-light)",
                      position: "absolute",
                      left: "-31px",
                      top: "6px"
                    }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{new Date(appt.date).toLocaleDateString()}</span>
                  <h4 style={{ margin: "4px 0", color: "white" }}>OPD Visit - {appt.reason}</h4>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Attending Physician: Dr. {appt.doctorId?.name || "Staff"} · Status: {appt.status}
                  </p>
                </div>
              ))}
              {prescriptions.map((presc) => (
                <div key={presc._id} style={{ marginBottom: "24px", position: "relative" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "#a78bfa",
                      position: "absolute",
                      left: "-31px",
                      top: "6px"
                    }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{new Date(presc.createdAt).toLocaleDateString()}</span>
                  <h4 style={{ margin: "4px 0", color: "white" }}>Prescription Issued</h4>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    Issued by: Dr. {presc.doctorId?.name || "Staff"}
                  </p>
                </div>
              ))}
              {appointments.length === 0 && prescriptions.length === 0 && (
                <p style={{ color: "var(--text-muted)" }}>No interaction history recorded.</p>
              )}
            </div>
          </div>
        )}

        {/* PANEL: APPOINTMENTS & JOURNEY */}
        {activeTab === "appointments" && (
          <div className="dashboard-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, color: "white" }}>Appointment Instances & Journey History</h3>
                <p style={{ margin: "4px 0 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Select an appointment instance to view its complete end-to-end medical journey
                </p>
              </div>
            </div>

            {appointments.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No appointment instances stored for this patient.</p>
            ) : (
              <div>
                {appointments.map((appt) => {
                  const vitals = getMockVitals(appt._id);
                  const isExpanded = expandedApptId === appt._id || appointments.length === 1;

                  // Find prescriptions and lab reports associated with this appointment instance
                  const apptPrescriptions = prescriptions.filter(
                    p => (p.appointmentId?._id === appt._id || p.appointmentId === appt._id)
                  );
                  const apptLabs = labs.filter(
                    l => (l.appointmentId?._id === appt._id || l.appointmentId === appt._id)
                  );

                  return (
                    <div
                      key={appt._id}
                      style={{
                        padding: "20px",
                        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                        borderRadius: "16px",
                        marginBottom: "16px",
                        border: isExpanded ? "1.5px solid #00A89E" : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: isExpanded ? "0 8px 24px rgba(0,168,158,0.1)" : "none",
                        transition: "all 0.2s"
                      }}
                    >
                      {/* Summary Header */}
                      <div
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", flexWrap: "wrap", gap: "12px" }}
                        onClick={() => setExpandedApptId(isExpanded && appointments.length > 1 ? null : appt._id)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {appt.token && (
                            <span style={{
                              background: "linear-gradient(135deg, #0A58A3, #00A89E)",
                              color: "#fff", padding: "4px 12px", borderRadius: "20px",
                              fontSize: "0.8rem", fontWeight: "800", letterSpacing: "0.5px"
                            }}>
                              🎫 {appt.token}
                            </span>
                          )}
                          <div>
                            <strong style={{ color: "white", fontSize: "1.1rem" }}>
                              Dr. {appt.doctorId?.name || "Attending Doctor"} ({appt.doctorId?.specialization || "General Medicine"})
                            </strong>
                            <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                              <strong>Health Issue:</strong> {appt.reason} · <strong>Date:</strong> {appt.date}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span className={`status-pill ${appt.status === "Approved" || appt.status === "Completed" ? "status-active" : "status-warning"}`}>
                            {appt.status}
                          </span>
                          <span style={{ color: "var(--color-primary-light)", fontSize: "0.85rem", fontWeight: "700" }}>
                            {isExpanded ? "Hide Journey ▲" : "View Full Journey Journey ▼"}
                          </span>
                        </div>
                      </div>

                      {/* 4-Stage Journey Visualization */}
                      {isExpanded && (
                        <div style={{ marginTop: "20px", borderTop: "1px dashed rgba(255,255,255,0.12)", paddingTop: "18px" }}>
                          <p style={{ fontSize: "0.85rem", color: "#00A89E", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 16px 0" }}>
                            📍 Appointment Journey Timeline
                          </p>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                            
                            {/* STAGE 1: Booking & Fees */}
                            <div style={{ background: "rgba(10, 88, 163, 0.08)", border: "1px solid rgba(10, 88, 163, 0.2)", borderRadius: "12px", padding: "16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", color: "#60A5FA" }}>
                                <strong>1. Booking & Registration</strong>
                              </div>
                              <p style={{ margin: "0 0 6px 0", fontSize: "0.85rem", color: "white" }}>
                                <strong>Token:</strong> {appt.token || "Walk-in OP"}
                              </p>
                              <p style={{ margin: "0 0 6px 0", fontSize: "0.85rem", color: "white" }}>
                                <strong>Date/Time:</strong> {appt.date}
                              </p>
                              <p style={{ margin: "0 0 6px 0", fontSize: "0.85rem", color: "white" }}>
                                <strong>Complaint / Issue:</strong> {appt.reason}
                              </p>
                              <p style={{ margin: 0, fontSize: "0.85rem", color: "white" }}>
                                <strong>Consultation Fee:</strong> ₹{appt.consultationFee || 300}{" "}
                                <span style={{ color: appt.consultationFeePaid ? "#10B981" : "#EF4444", fontWeight: "700" }}>
                                  ({appt.consultationFeePaid ? "Paid ✓" : "Pending"})
                                </span>
                              </p>
                            </div>

                            {/* STAGE 2: Doctor Consultation & Instructions */}
                            <div style={{ background: "rgba(0, 168, 158, 0.08)", border: "1px solid rgba(0, 168, 158, 0.2)", borderRadius: "12px", padding: "16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", color: "#2DD4BF" }}>
                                <strong>2. Doctor & Instructions</strong>
                              </div>
                              <p style={{ margin: "0 0 6px 0", fontSize: "0.85rem", color: "white" }}>
                                <strong>Physician:</strong> Dr. {appt.doctorId?.name || "Assigned Specialist"}
                              </p>
                              <p style={{ margin: "0 0 6px 0", fontSize: "0.85rem", color: "white" }}>
                                <strong>Specialization:</strong> {appt.doctorId?.specialization || "General Medicine"}
                              </p>
                              <p style={{ margin: "0 0 6px 0", fontSize: "0.85rem", color: "white" }}>
                                <strong>Vitals:</strong> BP: {vitals.bp} · Temp: {vitals.temp} · Pulse: {vitals.pulse}
                              </p>
                              <p style={{ margin: 0, fontSize: "0.85rem", color: "#A7F3D0" }}>
                                <strong>Doctor Instructions:</strong> {appt.notes || "Consultation in progress. Standard medical advice provided."}
                              </p>
                            </div>

                            {/* STAGE 3: Prescriptions & Pharmacy Billing */}
                            <div style={{ background: "rgba(167, 139, 250, 0.08)", border: "1px solid rgba(167, 139, 250, 0.2)", borderRadius: "12px", padding: "16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", color: "#C084FC" }}>
                                <strong>3. Prescription & Pharmacy</strong>
                              </div>
                              {apptPrescriptions.length > 0 ? apptPrescriptions.map(p => (
                                <div key={p._id} style={{ marginBottom: "8px" }}>
                                  <p style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "white", fontWeight: "700" }}>
                                    💊 {p.medicines}
                                  </p>
                                  {p.notes && <p style={{ margin: "0 0 4px 0", fontSize: "0.78rem", color: "#E9D5FF" }}>Advice: {p.notes}</p>}
                                  <p style={{ margin: 0, fontSize: "0.82rem", color: "white" }}>
                                    Pharmacy Amount: <strong>₹{p.price || 250}</strong> · Status:{" "}
                                    <span style={{ color: p.paymentStatus === "Paid" ? "#10B981" : "#F59E0B", fontWeight: "700" }}>
                                      {p.paymentStatus || "Unpaid"}
                                    </span>
                                  </p>
                                </div>
                              )) : (
                                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                  No prescriptions issued yet for this appointment.
                                </p>
                              )}
                            </div>

                            {/* STAGE 4: Lab Reports & Findings */}
                            <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "12px", padding: "16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", color: "#FBBF24" }}>
                                <strong>4. Lab Reports & Diagnostics</strong>
                              </div>
                              {apptLabs.length > 0 ? apptLabs.map(l => (
                                <div key={l._id} style={{ marginBottom: "8px" }}>
                                  <p style={{ margin: "0 0 4px 0", fontSize: "0.85rem", color: "white", fontWeight: "700" }}>
                                    🔬 {l.testName} ({l.category})
                                  </p>
                                  <p style={{ margin: "0 0 4px 0", fontSize: "0.78rem", color: "#FDE68A" }}>
                                    Results: {l.results || "Awaiting lab technician findings..."}
                                  </p>
                                  <span className={`status-pill ${l.status === "Completed" ? "status-active" : "status-warning"}`} style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                                    Status: {l.status}
                                  </span>
                                </div>
                              )) : (
                                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                  No lab tests required for this appointment.
                                </p>
                              )}
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PANEL: LAB RECORDS */}
        {activeTab === "labs" && (
          <div className="dashboard-card" style={{ padding: "20px" }}>
            <h3 style={{ marginBottom: "16px", color: "white" }}>Lab Test Records</h3>
            {labs.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No laboratory reports uploaded.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="crud-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Test Date</th>
                      <th>Test Name</th>
                      <th>Category</th>
                      <th>Result Values</th>
                      <th>Remarks</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labs.map((lab) => (
                      <tr key={lab._id}>
                        <td>{new Date(lab.createdAt).toLocaleDateString()}</td>
                        <td style={{ fontWeight: "600" }}>{lab.testName}</td>
                        <td>{lab.category}</td>
                        <td style={{ color: "white" }}>{lab.results || "Awaiting findings..."}</td>
                        <td>Reference: Normal Range</td>
                        <td>
                          <span className={`badge ${lab.status === "Completed" ? "badge-success" : "badge-pending"}`}>{lab.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PANEL: PRESCRIPTIONS */}
        {activeTab === "prescriptions" && (
          <div className="dashboard-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "white" }}>Issued Prescriptions</h3>
              {userRole === "doctor" && (
                <button className="pill-button pill-button-primary" onClick={() => setShowPrescForm(!showPrescForm)}>
                  {showPrescForm ? "Close Form" : "Add Prescription"}
                </button>
              )}
            </div>

            {showPrescForm && userRole === "doctor" && (
              <form onSubmit={handleAddPrescription} className="crud-form-card" style={{ marginBottom: "20px", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h4 style={{ color: "white", marginBottom: "12px" }}>➕ Issue New Prescription</h4>
                <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="form-field" style={{ marginBottom: "12px" }}>
                    <label>Medicines & Dosage Schedule</label>
                    <textarea
                      rows={3}
                      value={newMedicines}
                      onChange={(e) => setNewMedicines(e.target.value)}
                      placeholder="e.g. Paracetamol 650mg - Twice daily - 5 days"
                      required
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: "12px" }}>
                    <label>Advice / Clinical Notes</label>
                    <textarea
                      rows={2}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="e.g. Drink warm fluids, avoid cold water."
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: "12px" }}>
                    <label>Prescription Price (₹)</label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="25"
                      required
                    />
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: "12px" }}>
                  <button type="submit" className="btn-primary" disabled={savingPrescription}>
                    {savingPrescription ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="spinner" style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                        Saving...
                      </span>
                    ) : "Save Prescription"}
                  </button>
                </div>
              </form>
            )}

            {prescriptions.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No prescriptions found.</p>
            ) : (
              <div>
                {prescriptions.map((presc) => (
                  <div
                    key={presc._id}
                    style={{
                      padding: "16px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "12px",
                      marginBottom: "12px",
                      border: "1px solid rgba(255,255,255,0.05)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <strong style={{ color: "white", fontSize: "1.05rem" }}>Dr. {presc.doctorId?.name || "Attending Physician"}</strong>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {presc.isFinalized ? (
                          <span className="status-pill status-active" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>Finalized</span>
                        ) : (
                          <span className="status-pill status-warning" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>Draft</span>
                        )}
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{new Date(presc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {editPrescId === presc._id ? (
                      <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px" }}>
                        <div className="form-field" style={{ marginBottom: "12px" }}>
                          <label style={{ fontSize: "0.85rem" }}>Medicines & Dosage Schedule</label>
                          <textarea
                            rows={3}
                            value={editMedicines}
                            onChange={(e) => setEditMedicines(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 bg-gray-50 text-black text-sm"
                            required
                          />
                        </div>
                        <div className="form-field" style={{ marginBottom: "12px" }}>
                          <label style={{ fontSize: "0.85rem" }}>Advice / Clinical Notes</label>
                          <textarea
                            rows={2}
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 bg-gray-50 text-black text-sm"
                          />
                        </div>
                        <div className="form-actions" style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                          <button onClick={() => handleUpdatePrescription(presc._id, false)} className="secondary-button" style={{ fontSize: "0.8rem", padding: "6px 12px" }} disabled={updatingPrescription}>
                            {updatingPrescription ? "Saving..." : "Save Draft"}
                          </button>
                          <button onClick={() => handleUpdatePrescription(presc._id, true)} className="primary-button" style={{ fontSize: "0.8rem", padding: "6px 12px", background: "#10B981", borderColor: "#10B981" }} disabled={updatingPrescription}>
                            {updatingPrescription ? "Finalizing..." : "Finalize & Send"}
                          </button>
                          <button onClick={() => setEditPrescId(null)} className="secondary-button" style={{ fontSize: "0.8rem", padding: "6px 12px", color: "#EF4444", borderColor: "#EF4444" }} disabled={updatingPrescription}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={{ margin: "4px 0", color: "white", whiteSpace: "pre-wrap" }}>{presc.medicines}</p>
                        {presc.notes && (
                          <div style={{ marginTop: "12px", fontSize: "0.9rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.02)", padding: "8px", borderRadius: "6px" }}>
                            <strong>Doctor Notes:</strong> {presc.notes}
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                          <span style={{ fontSize: "0.85rem", color: "white" }}>
                            Price: <strong>₹{presc.price !== undefined ? presc.price.toFixed(2) : "250.00"}</strong>
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {(userRole === "doctor" || userRole === "admin") && (
                              <button
                                onClick={() => {
                                  setEditPrescId(presc._id);
                                  setEditMedicines(presc.medicines);
                                  setEditNotes(presc.notes || "");
                                  setEditPrice(presc.price || "25");
                                }}
                                style={{
                                  background: "#3B82F6", color: "#fff", border: "none",
                                  padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem",
                                  fontWeight: "700", cursor: "pointer"
                                }}
                              >
                                ✏️ Edit
                              </button>
                            )}
                            <span className={`status-pill ${presc.paymentStatus === "Paid" ? "status-active" : "status-warning"}`} style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                              {presc.paymentStatus || "Unpaid"}
                            </span>
                            {presc.paymentStatus !== "Paid" && (
                              <button
                                onClick={() => {
                                  const printWindow = window.open("", "_blank", "width=400,height=550");
                                  printWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>Scan & Pay Prescription Fee</title>
                                        <style>
                                          body { background: #111827; color: #fff; font-family: sans-serif; text-align: center; padding: 24px; }
                                          img { width: 100%; max-width: 300px; border-radius: 12px; margin: 16px 0; border: 1px solid #374151; }
                                          .btn { background: #10B981; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 12px; width: 100%; }
                                        </style>
                                      </head>
                                      <body>
                                        <h2>💳 Prescription Payment</h2>
                                        <p>Amount: <strong>₹${presc.price || 250}</strong></p>
                                        <img src="/src/assets/upi_qr.png" onerror="this.src='/assets/upi_qr.png'" alt="PhonePe QR" />
                                        <button class="btn" onclick="window.opener.handlePayPrescription('${presc._id}'); window.close();">Confirm Payment ✓</button>
                                      </body>
                                    </html>
                                  `);
                                }}
                                style={{
                                  background: "#10B981", color: "#fff", border: "none",
                                  padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem",
                                  fontWeight: "700", cursor: "pointer"
                                }}
                              >
                                💳 Pay QR
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANEL: BILLING */}
        {activeTab === "billing" && (
          <div className="dashboard-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "white" }}>Billing & Invoice History</h3>
              {(userRole === "doctor" || userRole === "receptionist" || userRole === "admin") && (
                <button className="pill-button pill-button-primary" onClick={() => setShowBillForm(!showBillForm)}>
                  {showBillForm ? "Close Form" : "Post Appointment Fees"}
                </button>
              )}
            </div>

            {showBillForm && (
              <form onSubmit={handlePostBill} className="crud-form-card" style={{ marginBottom: "20px", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h4 style={{ color: "white", marginBottom: "12px" }}>➕ Post New Billing Fee</h4>
                <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="form-field" style={{ marginBottom: "12px" }}>
                    <label>Fee Amount ($)</label>
                    <input
                      type="number"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      required
                      style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "white" }}
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: "12px" }}>
                    <label>Description</label>
                    <input
                      type="text"
                      value={billDescription}
                      onChange={(e) => setBillDescription(e.target.value)}
                      placeholder="e.g. Doctor Consultation Fee"
                      required
                      style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "white" }}
                    />
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: "12px" }}>
                  <button type="submit" className="btn-primary" disabled={postingBill}>
                    {postingBill ? "Posting..." : "Post Fee"}
                  </button>
                </div>
              </form>
            )}

            {bills.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No billing logs recorded.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="crud-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Bill Date</th>
                      <th>Invoice ID</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill._id}>
                        <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
                        <td>{bill._id}</td>
                        <td style={{ fontWeight: "600", color: "white" }}>₹{bill.amount}</td>
                        <td>
                          <span className={`badge ${bill.status === "Paid" ? "badge-success" : "badge-cancelled"}`}>{bill.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PANEL: DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="dashboard-card" style={{ padding: "20px" }}>
            <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", color: "white" }}>Patient Identity & Scans</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginTop: "16px" }}>
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0, color: "white" }}>Aadhaar Verification Copy</h4>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Uploaded Jan 2026</span>
                </div>
                <button className="secondary-button" style={{ padding: "8px" }} onClick={() => alert("Simulating PDF download...")}><FiDownload /></button>
              </div>

              <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: 0, color: "white" }}>Insurance Membership Card</h4>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Validity: Dec 2029</span>
                </div>
                <button className="secondary-button" style={{ padding: "8px" }} onClick={() => alert("Simulating PDF download...")}><FiDownload /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
