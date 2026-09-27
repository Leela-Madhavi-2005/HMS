import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCalendarCheck, FaClipboardCheck, FaClock, FaUsers } from "react-icons/fa";
import { FiPrinter, FiUserPlus, FiX, FiCheck } from "react-icons/fi";
import StatCard from "../components/StatCard";
import api from "../api/api";
import useSocket from "../hooks/useSocket";

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaysAppointmentsCount: 0,
    checkedInPatients: 0,
    pendingRegistrations: 0,
    avgWaitTime: "0m",
    appointments: [],
    unpaidBills: [],
    unpaidBillsCount: 0,
    paidBillsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const { notifications: socketNotifications, socket: globalSocket } = useSocket();

  // Booking Modal States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [unavailableDocModal, setUnavailableDocModal] = useState(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [healthIssue, setHealthIssue] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:30 AM");
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Lists loaded on mount
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [statsData, docsData, patsData, apptsData] = await Promise.all([
          api.get("/dashboard/receptionist/stats").catch(() => ({})),
          api.get("/doctors").catch(() => []),
          api.get("/patients").catch(() => []),
          api.get("/appointments").catch(() => [])
        ]);

        const safeDocs = Array.isArray(docsData) ? docsData : [];
        const safePats = Array.isArray(patsData) ? patsData : [];
        const safeAppts = Array.isArray(apptsData) ? apptsData : (Array.isArray(statsData?.appointments) ? statsData.appointments : []);

        setStats((prev) => ({
          ...prev,
          ...(typeof statsData === "object" ? statsData : {}),
          appointments: safeAppts
        }));
        setDoctors(safeDocs);
        setPatients(safePats);
        if (safeDocs.length > 0) {
          setSelectedDoctorId(safeDocs[0]._id);
        }
      } catch (error) {
        console.error("Receptionist dashboard stats error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    const handleUpdate = () => {
      fetchData();
    };

    if (globalSocket) {
      globalSocket.on("appointment:update", handleUpdate);
      globalSocket.on("notification", handleUpdate);
    }

    return () => {
      if (globalSocket) {
        globalSocket.off("appointment:update", handleUpdate);
        globalSocket.off("notification", handleUpdate);
      }
    };
  }, [globalSocket]);

  useEffect(() => {
    setNotifications(Array.isArray(socketNotifications) ? socketNotifications : []);
  }, [socketNotifications]);

  // Auto-fill existing patient details if phone number matches
  useEffect(() => {
    const cleanPhone = phone.trim();
    if (cleanPhone.length >= 10 && Array.isArray(patients)) {
      const match = patients.find(p => p && p.phone === cleanPhone);
      if (match) {
        setName(match.name || "");
        setAge(match.age || "");
        setGender(match.gender || "Male");
      }
    }
  }, [phone, patients]);

  const appointments = Array.isArray(stats.appointments) ? stats.appointments.filter(Boolean) : [];
  const unpaidBills = Array.isArray(stats.unpaidBills) ? stats.unpaidBills.filter(Boolean) : [];

  // Auto-fill available date & hour when selected doctor changes
  useEffect(() => {
    if (selectedDoctorId && Array.isArray(doctors)) {
      const matchDoc = doctors.find(d => d && String(d._id) === String(selectedDoctorId));
      if (matchDoc) {
        const todayStr = new Date().toISOString().split("T")[0];
        const activeDates = (matchDoc.availableDates || []).filter(d => d >= todayStr);
        if (activeDates.length > 0) {
          setDate(activeDates[0]);
        } else {
          setDate(todayStr);
        }
        if (matchDoc.availableHours && matchDoc.availableHours.length > 0) {
          setTime(matchDoc.availableHours[0]);
        } else {
          setTime("10:30 AM");
        }
      }
    }
  }, [selectedDoctorId, doctors]);

  // Match doctor specialization based on health issue keywords
  const getSuggestedSpecialization = (issueStr) => {
    if (!issueStr) return "General";
    const text = issueStr.toLowerCase();
    if (text.includes("heart") || text.includes("chest") || text.includes("cardio") || text.includes("bp") || text.includes("blood pressure")) return "Cardiology";
    if (text.includes("brain") || text.includes("headache") || text.includes("neuro") || text.includes("paralysis") || text.includes("seizure")) return "Neurology";
    if (text.includes("bone") || text.includes("fracture") || text.includes("joint") || text.includes("ortho") || text.includes("knee")) return "Orthopedics";
    if (text.includes("skin") || text.includes("rash") || text.includes("derma") || text.includes("allergy") || text.includes("itch")) return "Dermatology";
    if (text.includes("child") || text.includes("kid") || text.includes("baby") || text.includes("pedia") || text.includes("infant")) return "Pediatrics";
    if (text.includes("cancer") || text.includes("tumor") || text.includes("onco") || text.includes("lump")) return "Oncology";
    if (text.includes("urine") || text.includes("kidney") || text.includes("uro")) return "Urology";
    if (text.includes("women") || text.includes("period") || text.includes("pregnancy") || text.includes("gynaec") || text.includes("gynec")) return "Gynecology";
    if (text.includes("ear") || text.includes("nose") || text.includes("throat") || text.includes("ent")) return "ENT";
    return "General";
  };

  const handleHealthIssueChange = (val) => {
    setHealthIssue(val);
    if (!Array.isArray(doctors)) return;
    const suggestedSpec = getSuggestedSpecialization(val);
    const matchingDoc = doctors.find(doc => doc && doc.specialization === suggestedSpec);
    if (matchingDoc) {
      setSelectedDoctorId(matchingDoc._id);
    } else {
      const genDoc = doctors.find(doc => doc && doc.specialization === "General");
      if (genDoc) setSelectedDoctorId(genDoc._id);
      else if (doctors.length > 0) setSelectedDoctorId(doctors[0]._id);
    }
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setBookingError("");
    if (!phone || !name || !age || !healthIssue || !selectedDoctorId || !date || !time) {
      setBookingError("Please complete all fields before proceeding to payment.");
      return;
    }
    setBookingStep(2); // Move to PhonePe QR payment step
  };

  const handleBookAppointmentSubmit = async () => {
    setBookingError("");
    setSubmitting(true);

    try {
      // Check if patient already exists
      const cleanPhone = phone.trim();
      const existingPatient = patients.find(p => p.phone === cleanPhone);
      let patId = existingPatient?._id;

      if (!existingPatient) {
        // Register patient in Auth + create profile
        const registerPayload = {
          name: name.trim(),
          email: `${cleanPhone}@medicare.com`,
          password: cleanPhone,
          role: "patient",
          phone: cleanPhone,
          age: Number(age),
          gender
        };
        const regRes = await api.post("/auth/register", registerPayload);
        patId = regRes.patientId;
      }

      // Fetch selected doctor fee
      const selectedDoc = doctors.find(d => d._id === selectedDoctorId);
      const docFee = selectedDoc?.consultationFee || 300;

      // Create appointment (Approved & Fee Paid)
      const apptDate = `${date} at ${time}`;
      const apptPayload = {
        patientId: patId,
        doctorId: selectedDoctorId,
        date: apptDate,
        reason: `OP: ${healthIssue.trim()}`,
        consultationFee: docFee,
        consultationFeePaid: true,
        status: "Approved"
      };

      await api.post("/appointments", apptPayload);

      setBookingSuccess({
        patientName: name,
        doctorName: selectedDoc?.name || "assigned specialist",
        specialization: selectedDoc?.specialization || "General Medicine",
        time: time,
        date: date
      });
      setBookingStep(3); // Show Success Screen

      // Reset Form fields
      setPhone("");
      setName("");
      setAge("");
      setHealthIssue("");
      setDate("");

      // Refresh data
      const statsData = await api.get("/dashboard/receptionist/stats");
      setStats((prev) => ({ ...prev, ...statsData }));
      const patsData = await api.get("/patients");
      setPatients(patsData);

    } catch (err) {
      console.error(err);
      setBookingError(err.response?.data?.message || err.message || "Failed to create appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-shell">
        <div className="dashboard-hero dashboard-hero-receptionist">
          <div>
            <p className="eyebrow" style={{ color: "#E11D48", fontWeight: "800" }}>Front desk operations</p>
            <h1 style={{ color: "#881337" }}>Reception dashboard</h1>
            <p style={{ color: "#4C0519" }}>Keep appointments, registration, and billing moving smoothly.</p>
          </div>
          <div className="hero-actions">
            <button
              type="button"
              onClick={() => alert("Receptionist Shift: 08:00 AM - 04:00 PM")}
              style={{
                background: "#FFFFFF",
                color: "#9F1239",
                border: "2px solid #FECDD3",
                borderRadius: "999px",
                padding: "10px 18px",
                fontWeight: "800",
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(225,29,72,0.12)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>🕒</span> Shift 08:00 - 16:00
            </button>
            <button
              type="button"
              onClick={() => { setShowBookingModal(true); setBookingStep(1); setBookingSuccess(null); setBookingError(""); }}
              style={{
                background: "linear-gradient(135deg, #E11D48 0%, #BE123C 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "999px",
                padding: "10px 20px",
                fontWeight: "800",
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(225, 29, 72, 0.35)"
              }}
            >
              Book Appointment
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={<FaCalendarCheck />} title="Today's Appointments" value={stats.todaysAppointmentsCount || 0} loading={loading} gradient="gradient-1" />
          <StatCard icon={<FaUsers />} title="Checked-In Patients" value={stats.checkedInPatients || 0} loading={loading} gradient="gradient-2" />
          <StatCard icon={<FaClipboardCheck />} title="Pending Registrations" value={stats.pendingRegistrations || 0} loading={loading} gradient="gradient-3" />
          <StatCard icon={<FaClock />} title="Avg Wait Time" value={stats.avgWaitTime || "0m"} loading={loading} gradient="gradient-4" />
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Patient registration</p>
                <h3>New and existing patients</h3>
              </div>
              <button className="secondary-button" onClick={() => navigate("/patients")}><FiUserPlus /> Search</button>
            </div>
            <div className="detail-list">
              <div className="metric-row" style={{ cursor: "pointer" }} onClick={() => { setShowBookingModal(true); setBookingStep(1); setBookingSuccess(null); setBookingError(""); }}>
                <div><strong>Patient registration</strong><p>Register new profiles & appointments</p></div>
                <span className="status-pill status-info">Add profile</span>
              </div>
              <div className="metric-row" style={{ cursor: "pointer" }} onClick={() => navigate("/patients")}>
                <div><strong>Active patients</strong><p>Search patient details</p></div>
                <span className="status-pill status-active">Search</span>
              </div>
            </div>
          </section>

          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Appointment management</p>
                <h3>Today’s booking overview</h3>
              </div>
            </div>
            <div className="detail-list">
              {appointments.length > 0 ? appointments.map((item, idx) => {
                if (!item) return null;
                const pId = typeof item.patientId === "object" ? item.patientId?._id : item.patientId;
                const docName = typeof item.doctorId === "object" ? item.doctorId?.name : item.doctorId || "Assigned Specialist";
                const patName = typeof item.patientId === "object" ? item.patientId?.name : item.patientId || "Patient";
                const isValidId = pId && typeof pId === "string" && pId.length === 24;

                return (
                  <div 
                    key={item._id || idx} 
                    className="detail-item detail-item-stack hover-row"
                    style={{ cursor: isValidId ? "pointer" : "default" }}
                    onClick={() => isValidId && navigate(`/patients/${pId}`)}
                  >
                    <FaCalendarCheck />
                    <div>
                      <strong>Dr. {docName} - {patName}</strong>
                      <p>{item.date} · {item.status}</p>
                    </div>
                  </div>
                );
              }) : <div className="empty-state">No appointments today.</div>}
            </div>
          </section>
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Queue management</p>
                <h3>Waiting patients</h3>
              </div>
            </div>
            <div className="detail-list">
              {appointments.filter(a => a && (a.status === "Approved" || a.status === "Checked-In")).length > 0 ? (
                appointments.filter(a => a && (a.status === "Approved" || a.status === "Checked-In")).map((item, idx) => {
                  const pId = typeof item.patientId === "object" ? item.patientId?._id : item.patientId;
                  const docName = typeof item.doctorId === "object" ? item.doctorId?.name : item.doctorId || "Assigned Specialist";
                  const patName = typeof item.patientId === "object" ? item.patientId?.name : item.patientId || "Patient";
                  const isValidId = pId && typeof pId === "string" && pId.length === 24;

                  return (
                    <div 
                      key={item._id || idx} 
                      className="detail-item detail-item-stack hover-row"
                      style={{ cursor: isValidId ? "pointer" : "default" }}
                      onClick={() => isValidId && navigate(`/patients/${pId}`)}
                    >
                      <FaUsers />
                      <div>
                        <strong>{patName}</strong>
                        <p>With Dr. {docName} · Status: {item.status}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">No patients currently checked in.</div>
              )}
            </div>
          </section>

          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Billing summary</p>
                <h3>Payments and claims</h3>
              </div>
            </div>
            <div className="detail-list">
              <div className="metric-row">
                <div><strong>Pending payments</strong><p>{stats.unpaidBillsCount || 0} bills</p></div>
                <span className="status-pill status-warning">Needs review</span>
              </div>
              <div className="metric-row">
                <div><strong>Paid bills</strong><p>{stats.paidBillsCount || 0}</p></div>
                <span className="status-pill status-active">Updated</span>
              </div>
            </div>
            <div className="action-row">
              <button className="secondary-button" onClick={() => navigate("/bills")}>Generate bill</button>
              <button className="secondary-button" onClick={() => window.print()}><FiPrinter /> Print receipt</button>
            </div>
          </section>
        </div>

        <section className="dashboard-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Quick actions</p>
              <h3>Front desk tasks</h3>
            </div>
          </div>
          <div className="action-grid">
            <button className="quick-action" onClick={() => { setShowBookingModal(true); setBookingStep(1); setBookingSuccess(null); setBookingError(""); }}>Register patient</button>
            <button className="quick-action" onClick={() => { setShowBookingModal(true); setBookingStep(1); setBookingSuccess(null); setBookingError(""); }}>Book appointment</button>
            <button className="quick-action" onClick={() => navigate("/bills")}>Generate bill</button>
            <button className="quick-action" onClick={() => alert("Token successfully printed!")}>Print token</button>
            <button className="quick-action" onClick={() => alert("Admitting patient to bed roster...")}>Admit patient</button>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Notifications</p>
              <h3>Live updates</h3>
            </div>
            <span className="status-pill status-info">{notifications.length} new</span>
          </div>
          <div className="detail-list">
            {notifications.length === 0 ? <div className="empty-state">No new alerts.</div> : notifications.map((item, i) => (
              <div key={i} className="detail-item detail-item-stack">
                <FaBell />
                <div>
                  <strong>{item.message}</strong>
                  <p>{new Date(item.time).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Appointment and Registration Popup Modal */}
      {showBookingModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "24px",
            width: "100%",
            maxWidth: "600px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #E2E8F0",
            overflow: "hidden"
          }}>
            {/* Header */}
            <div className="mc-booking-modal-header" style={{
              background: "linear-gradient(135deg, #0A58A3 0%, #00A89E 100%)",
              padding: "24px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#ffffff"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "800", color: "#ffffff" }}>Register Patient & Book Appointment</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>Front desk lookup and rapid scheduler</p>
              </div>
              <button 
                onClick={() => setShowBookingModal(false)}
                style={{
                  background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
                  width: "36px", height: "36px", color: "#ffffff", display: "flex",
                  alignItems: "center", justifyContent: "center", cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "32px" }}>
              {bookingStep === 3 ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "50%",
                    background: "rgba(16, 185, 129, 0.1)", color: "#10B981",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px auto", fontSize: "2rem"
                  }}>
                    <FiCheck />
                  </div>
                  <h4 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#0F172A", margin: "0 0 10px 0" }}>
                    Payment Received & Appointment Confirmed!
                  </h4>
                  <div style={{
                    background: "linear-gradient(135deg, rgba(10, 88, 163, 0.04) 0%, rgba(0, 168, 158, 0.04) 100%)",
                    border: "1.5px solid rgba(10, 88, 163, 0.18)",
                    borderRadius: "16px", padding: "20px", display: "inline-block",
                    textAlign: "left", width: "100%", maxWidth: "440px", marginBottom: "24px",
                    boxShadow: "0 8px 24px rgba(10, 88, 163, 0.04)"
                  }}>
                    <p style={{ margin: "0 0 8px 0", color: "#475569" }}><strong>Patient:</strong> {bookingSuccess?.patientName}</p>
                    <p style={{ margin: "0 0 8px 0", color: "#475569" }}><strong>Doctor:</strong> Dr. {bookingSuccess?.doctorName} ({bookingSuccess?.specialization})</p>
                    <p style={{ margin: "0 0 8px 0", color: "#475569" }}><strong>Date:</strong> {bookingSuccess?.date}</p>
                    <p style={{ margin: "0 0 8px 0", color: "#475569" }}><strong>Time:</strong> <span style={{ color: "#0A58A3", fontWeight: "700" }}>{bookingSuccess?.time}</span></p>
                    <p style={{ margin: "0", color: "#475569" }}><strong>Payment Status:</strong> <span style={{ color: "#10B981", fontWeight: "700" }}>Paid ✓</span></p>
                  </div>
                  <p style={{ margin: "0 0 24px 0", color: "#64748B", fontSize: "0.9rem", fontWeight: "600" }}>
                    Payment confirmed. The patient can login to their account using their Mobile Number.
                  </p>
                  <button 
                    onClick={() => { setShowBookingModal(false); setBookingStep(1); }}
                    style={{
                      background: "linear-gradient(135deg, #0A58A3 0%, #00A89E 100%)",
                      border: "none", borderRadius: "12px", padding: "12px 28px",
                      fontWeight: "700", color: "#ffffff", cursor: "pointer"
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : bookingStep === 2 ? (
                /* Step 2: PhonePe QR Payment Gateway */
                <div style={{ textAlign: "center" }}>
                  <h4 style={{ margin: "0 0 6px", fontSize: "1.25rem", color: "#0F172A", fontWeight: "800" }}>
                    Scan QR Code to Pay Fee
                  </h4>
                  <p style={{ margin: "0 0 16px", fontSize: "0.88rem", color: "#64748B" }}>
                    Consultation Fee: <strong style={{ color: "#0A58A3", fontSize: "1.1rem" }}>
                      ₹{doctors.find(d => d._id === selectedDoctorId)?.consultationFee || 300}
                    </strong>
                  </p>

                  {/* PhonePe QR Code Container */}
                  <div style={{
                    display: "inline-block", background: "white", padding: "16px",
                    borderRadius: "16px", border: "2px solid #5F259F", boxShadow: "0 8px 24px rgba(95, 37, 159, 0.15)",
                    marginBottom: "16px", textAlign: "center"
                  }}>
                    <div style={{ width: "160px", height: "160px", overflow: "hidden", margin: "0 auto 8px auto", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                      <img 
                        src="/assets/qr_matrix.png" 
                        alt="PhonePe QR Code" 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#0F172A", fontWeight: "700" }}>
                      Raju
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748B" }}>
                      +91 7981322657
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#5F259F", fontWeight: "700", marginTop: "4px" }}>
                      ✓ Receiving money on PhonePe
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "2px" }}>
                      🏦 Union Bank of India - 7312
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "12px" }}>
                    <button 
                      type="button" 
                      onClick={() => setBookingStep(1)} 
                      style={{ padding: "10px 20px", borderRadius: "10px", border: "1.5px solid #CBD5E1", background: "white", color: "#475569", fontWeight: "700", cursor: "pointer" }}
                    >
                      ← Back
                    </button>
                    <button 
                      type="button" 
                      onClick={handleBookAppointmentSubmit}
                      disabled={submitting}
                      style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "white", fontWeight: "800", cursor: "pointer" }}
                    >
                      {submitting ? "Confirming..." : "Confirm Payment & Book ✓"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 1: Patient Information */
                <form onSubmit={handleProceedToPayment}>
                  {bookingError && (
                    <div style={{
                      background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "12px", padding: "12px 16px", color: "#EF4444", fontSize: "0.88rem",
                      fontWeight: "600", marginBottom: "20px"
                    }}>
                      ⚠️ {bookingError}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "18px" }}>
                    {/* Mobile Number */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                        Mobile Number
                      </label>
                      <input 
                        type="tel"
                        placeholder="Enter 10 digit mobile"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                        style={{
                          width: "100%", padding: "10px 14px", border: "1.5px solid #CBD5E1",
                          borderRadius: "10px", outline: "none", fontSize: "0.95rem"
                        }}
                      />
                    </div>

                    {/* Patient Name */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                        Patient Full Name
                      </label>
                      <input 
                        type="text"
                        placeholder="Enter full name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        style={{
                          width: "100%", padding: "10px 14px", border: "1.5px solid #CBD5E1",
                          borderRadius: "10px", outline: "none", fontSize: "0.95rem"
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "18px" }}>
                    {/* Age */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                        Age
                      </label>
                      <input 
                        type="number"
                        placeholder="Age"
                        value={age}
                        onChange={e => setAge(e.target.value)}
                        required
                        style={{
                          width: "100%", padding: "10px 14px", border: "1.5px solid #CBD5E1",
                          borderRadius: "10px", outline: "none", fontSize: "0.95rem"
                        }}
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                        Gender
                      </label>
                      <select 
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        style={{
                          width: "100%", padding: "10px 14px", border: "1.5px solid #CBD5E1",
                          borderRadius: "10px", outline: "none", fontSize: "0.95rem", background: "#ffffff"
                        }}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Health Issue */}
                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                      Health Issue
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Heart chest pain, brain headache, rash, fever"
                      value={healthIssue}
                      onChange={e => handleHealthIssueChange(e.target.value)}
                      required
                      style={{
                        width: "100%", padding: "10px 14px", border: "1.5px solid #CBD5E1",
                        borderRadius: "10px", outline: "none", fontSize: "0.95rem"
                      }}
                    />
                  </div>

                  {/* Doctor Assignment Selection */}
                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                      Assign Doctor
                    </label>
                    <select 
                      value={selectedDoctorId}
                      onChange={e => setSelectedDoctorId(e.target.value)}
                      required
                      style={{
                        width: "100%", padding: "10px 14px", border: "1.5px solid #CBD5E1",
                        borderRadius: "10px", outline: "none", fontSize: "0.95rem", background: "#ffffff"
                      }}
                    >
                      <option value="">-- Assign Doctor --</option>
                      {doctors.map(doc => (
                        <option key={doc._id} value={doc._id}>
                          Dr. {doc.name} - {doc.specialization} (Fee: ₹{doc.consultationFee || 300})
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const currentSelectedDoc = doctors.find(d => String(d._id) === String(selectedDoctorId));
                    const todayStr = new Date().toISOString().split("T")[0];
                    const activeDates = (currentSelectedDoc?.availableDates || []).filter(d => d >= todayStr);
                    const activeHours = currentSelectedDoc?.availableHours || [];
                    const isDocBookable = currentSelectedDoc && activeDates.length > 0 && activeHours.length > 0;

                    return (
                      <>
                        {currentSelectedDoc && !isDocBookable && (
                          <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "12px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: "700", marginBottom: "16px" }}>
                            ⚠️ Dr. {currentSelectedDoc.name} has no available dates or hours posted. Receptionist cannot book an appointment for this doctor.
                          </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "28px" }}>
                          {/* Date */}
                          <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                              Appointment Date
                            </label>
                            {activeDates.length > 0 ? (
                              <select
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                                style={{
                                  width: "100%", padding: "10px 14px", border: "1.5px solid #CBD5E1",
                                  borderRadius: "10px", outline: "none", fontSize: "0.95rem", background: "#ffffff"
                                }}
                              >
                                <option value="">-- Select Date --</option>
                                {activeDates.map(d => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                            ) : (
                              <div style={{ padding: "10px 14px", background: "#F1F5F9", borderRadius: "10px", color: "#64748B", fontSize: "0.9rem", fontStyle: "italic" }}>
                                No upcoming dates posted
                              </div>
                            )}
                          </div>

                          {/* Meeting Time */}
                          <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                              Meeting Time
                            </label>
                            {activeHours.length > 0 ? (
                              <select
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                required
                                style={{
                                  width: "100%", padding: "10px 14px", border: "1.5px solid #CBD5E1",
                                  borderRadius: "10px", outline: "none", fontSize: "0.95rem", background: "#ffffff"
                                }}
                              >
                                <option value="">-- Select Time Slot --</option>
                                {activeHours.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                            ) : (
                              <div style={{ padding: "10px 14px", background: "#F1F5F9", borderRadius: "10px", color: "#64748B", fontSize: "0.9rem", fontStyle: "italic" }}>
                                No remaining hours posted
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                          <button 
                            type="button"
                            onClick={() => setShowBookingModal(false)}
                            style={{
                              background: "#F1F5F9", border: "none", borderRadius: "12px",
                              padding: "12px 24px", fontWeight: "700", color: "#475569",
                              cursor: "pointer"
                            }}
                          >
                            Cancel
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              if (!isDocBookable) {
                                e.preventDefault();
                                setUnavailableDocModal(currentSelectedDoc);
                                return;
                              }
                            }}
                            style={{
                              background: !isDocBookable ? "linear-gradient(135deg, #DC2626 0%, #E11D48 100%)" : "linear-gradient(135deg, #0A58A3 0%, #00A89E 100%)",
                              border: "none", borderRadius: "12px", padding: "12px 28px",
                              fontWeight: "700", color: "#ffffff", cursor: "pointer"
                            }}
                          >
                            {isDocBookable ? "Book Appointment" : "Not Available"}
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unavailable Doctor Pop-up Modal */}
      {unavailableDocModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px"
        }} onClick={() => setUnavailableDocModal(null)}>
          <div style={{
            maxWidth: "420px", width: "100%", background: "#FFFFFF", borderRadius: "20px", padding: "28px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", textAlign: "center"
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: "60px", height: "60px", borderRadius: "50%", background: "#FEF2F2", color: "#DC2626",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", fontSize: "1.8rem"
            }}>
              ⚠️
            </div>
            <h3 style={{ margin: "0 0 8px 0", color: "#0F172A", fontSize: "1.35rem", fontWeight: "800" }}>
              Doctor Not Available
            </h3>
            <p style={{ margin: "0 0 6px 0", color: "#0A58A3", fontWeight: "700", fontSize: "0.95rem" }}>
              Dr. {unavailableDocModal.name} ({unavailableDocModal.specialization || "Specialist"})
            </p>
            <p style={{ margin: "0 0 24px 0", color: "#64748B", fontSize: "0.9rem", lineHeight: "1.5" }}>
              This doctor currently has no available dates or remaining time slots posted. Receptionist cannot book an appointment for an unavailable doctor.
            </p>
            <button
              type="button"
              onClick={() => setUnavailableDocModal(null)}
              style={{
                width: "100%", padding: "12px", borderRadius: "12px", border: "none",
                background: "linear-gradient(135deg, #0A58A3 0%, #00A89E 100%)", color: "#FFFFFF",
                fontWeight: "800", fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(10, 88, 163, 0.3)"
              }}
            >
              Got it / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}