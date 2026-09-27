import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCalendarAlt, FaClipboardList, FaClock, FaUserMd } from "react-icons/fa";
import { FiCheck, FiX, FiActivity, FiFileText } from "react-icons/fi";
import StatCard from "../components/StatCard";
import api from "../api/api";
import useSocket from "../hooks/useSocket";
import { useAuth } from "../contexts/AuthContext";

export default function DoctorDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ 
    todayAppointmentsCount: 0, 
    todayAppointments: [],
    activePatients: 0, 
    pendingPrescriptions: 0, 
    consultationHours: 0 
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const { notifications: socketNotifications } = useSocket();

  // Prescription Modal State
  const [prescriptionForm, setPrescriptionForm] = useState(null); // { appointmentId, patientId, doctorId }
  const [medicines, setMedicines] = useState("");
  const [notes, setNotes] = useState("");
  const [submittingPrescription, setSubmittingPrescription] = useState(false);

  // Availability States
  const [availableDates, setAvailableDates] = useState([]);
  const [availableHours, setAvailableHours] = useState([]);
  const [newDateInput, setNewDateInput] = useState("");
  const [newFromHourInput, setNewFromHourInput] = useState("");
  const [newToHourInput, setNewToHourInput] = useState("");
  const [savingAvailability, setSavingAvailability] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    async function loadDoctorProfile() {
      if (currentUser?.doctorId) {
        try {
          const doctors = await api.get("/doctors");
          const myProfile = doctors.find(d => String(d._id) === String(currentUser.doctorId));
          if (myProfile) {
            const todayStr = new Date().toISOString().split("T")[0];
            const activeDates = (myProfile.availableDates || []).filter(d => d >= todayStr);
            setAvailableDates(activeDates);
            setAvailableHours(myProfile.availableHours || []);
          }
        } catch (err) {
          console.error("Failed to load doctor profile:", err);
        }
      }
    }
    loadDoctorProfile();
  }, [currentUser]);

  async function handleSaveAvailability() {
    if (!currentUser?.doctorId) return;
    try {
      setSavingAvailability(true);
      const doctors = await api.get("/doctors");
      const myProfile = doctors.find(d => String(d._id) === String(currentUser.doctorId));
      await api.put(`/doctors/${currentUser.doctorId}`, {
        name: myProfile?.name || currentUser.name,
        phone: myProfile?.phone || "9876543210",
        specialization: myProfile?.specialization || "General",
        availableDates,
        availableHours
      });
      alert("Work schedule and availability saved successfully!");
    } catch (err) {
      console.error("Failed to save availability:", err);
      alert("Error saving availability details.");
    } finally {
      setSavingAvailability(false);
    }
  }

  async function fetchStats() {
    try {
      setLoading(true);
      const data = await api.get("/dashboard/realtime/doctor/stats");
      setStats(data);
    } catch (error) {
      console.error("Doctor dashboard stats error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setNotifications(socketNotifications);
  }, [socketNotifications]);

  async function handleApprove(appointmentId) {
    try {
      await api.put(`/appointments/${appointmentId}`, { status: "Approved" });
      fetchStats();
    } catch (error) {
      console.error("Failed to approve appointment", error);
    }
  }

  const [labTestName, setLabTestName] = useState("");
  const [labTestCategory, setLabTestCategory] = useState("Blood");

  function openPrescriptionModal(appt) {
    setPrescriptionForm({
      appointmentId: appt._id,
      patientId: appt.patientId?._id || appt.patientId,
      doctorId: appt.doctorId?._id || appt.doctorId || currentUser?.doctorId
    });
    setMedicines("");
    setNotes("");
    setLabTestName("");
    setLabTestCategory("Blood");
  }

  async function submitPrescription(e) {
    e.preventDefault();
    try {
      setSubmittingPrescription(true);
      // Create Prescription
      await api.post("/prescriptions", {
        appointmentId: prescriptionForm.appointmentId,
        patientId: prescriptionForm.patientId,
        doctorId: prescriptionForm.doctorId,
        medicines,
        notes
      });

      // If doctor requested a lab test for this appointment
      if (labTestName.trim()) {
        await api.post("/labs", {
          appointmentId: prescriptionForm.appointmentId,
          patientId: prescriptionForm.patientId,
          doctorId: prescriptionForm.doctorId,
          testName: labTestName.trim(),
          category: labTestCategory
        });
      }

      // Mark Appointment as Completed & save doctor's notes / instructions
      await api.put(`/appointments/${prescriptionForm.appointmentId}`, { 
        status: "Completed",
        notes: notes || "Consultation finished. Prescribed medication." 
      });
      
      setPrescriptionForm(null);
      fetchStats();
      alert("Consultation & Prescription completed successfully!");
    } catch (error) {
      console.error("Failed to submit prescription", error);
      alert("Failed to submit prescription.");
    } finally {
      setSubmittingPrescription(false);
    }
  }

  return (
    <div className="page-container">
      <div className="dashboard-shell">
        <div className="dashboard-hero dashboard-hero-doctor">
          <div>
            <p className="eyebrow">Doctor workspace</p>
            <h1>Welcome, Dr. {currentUser?.name}</h1>
            <p>Track your queue, urgent cases, and care plans from one place.</p>
          </div>
          <div className="hero-actions">
            <button className="pill-button" onClick={() => alert("Zero urgent alerts at this moment.")}>Notifications</button>
            <button className="pill-button pill-button-primary" onClick={() => navigate("/appointments")}>View schedule</button>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={<FaCalendarAlt />} title="Today's Appointments" value={stats.todayAppointmentsCount || 0} loading={loading} gradient="gradient-1" />
          <StatCard icon={<FaUserMd />} title="Active Patients" value={stats.activePatients || 0} loading={loading} gradient="gradient-2" />
          <StatCard icon={<FaClipboardList />} title="Pending Prescriptions" value={stats.pendingPrescriptions || 0} loading={loading} gradient="gradient-3" />
          <StatCard icon={<FaClock />} title="Consultation Hours" value={stats.consultationHours || 0} loading={loading} gradient="gradient-4" />
        </div>

        {/* Prescription & Consultation Modal */}
        {prescriptionForm && (
          <form onSubmit={submitPrescription} className="crud-form-card" style={{ marginBottom: "24px", border: "2px solid var(--color-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="crud-form-title">✍️ Doctor Consultation & Prescription</h3>
              <button type="button" onClick={() => setPrescriptionForm(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
                <FiX size={24} />
              </button>
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="form-field" style={{ gridColumn: "span 2" }}>
                <label>Medicines (Name, Dosage, Duration)</label>
                <textarea 
                  rows="3" 
                  value={medicines} 
                  onChange={(e) => setMedicines(e.target.value)} 
                  placeholder="e.g. Paracetamol 650mg - Twice daily - 5 days"
                  required
                />
              </div>
              <div className="form-field" style={{ gridColumn: "span 2" }}>
                <label>Doctor Instructions & Advice</label>
                <textarea 
                  rows="2" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="e.g. Rest well, drink warm fluids, avoid cold water."
                  required
                />
              </div>
              <div className="form-field">
                <label>Order Lab Test (Optional)</label>
                <input 
                  type="text" 
                  value={labTestName} 
                  onChange={(e) => setLabTestName(e.target.value)} 
                  placeholder="e.g. Complete Blood Count (CBC)" 
                />
              </div>
              <div className="form-field">
                <label>Lab Category</label>
                <select value={labTestCategory} onChange={(e) => setLabTestCategory(e.target.value)}>
                  <option value="Blood">Blood (Hematology)</option>
                  <option value="Urine">Urine</option>
                  <option value="ECG">ECG</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="MRI">MRI</option>
                  <option value="CT Scan">CT Scan</option>
                </select>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: "20px" }}>
              <button type="submit" className="btn-primary" disabled={submittingPrescription}>
                {submittingPrescription ? "Submitting..." : "Complete Consultation & Issue Prescription ✓"}
              </button>
            </div>
          </form>
        )}

        <div className="dashboard-grid">
          <section className="dashboard-card dashboard-card-large">
            <div className="section-header">
              <div>
                <p className="eyebrow">Patient queue</p>
                <h3>Your Schedule</h3>
              </div>
              <span className="status-pill status-active">Live queue</span>
            </div>
            <div className="detail-list">
              {stats.todayAppointments?.length > 0 ? (
                stats.todayAppointments.map((appt) => (
                  <div 
                    key={appt._id} 
                    className="hover-row"
                    style={{ marginBottom: "16px", padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", cursor: "pointer" }}
                    onClick={() => {
                      const pId = appt.patientId?._id || appt.patientId;
                      if (pId) navigate(`/patients/${pId}`);
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <h4 style={{ margin: 0, color: "white" }}>
                        {appt.patientId?.name || (typeof appt.patientId === "string" ? appt.patientId : "Patient Profile")} ({appt.patientId?.age ? appt.patientId.age + " yrs" : "Details"})
                      </h4>
                      <span className={`status-pill ${appt.status === "Pending" ? "status-warning" : appt.status === "Completed" ? "status-active" : "status-info"}`}>
                        {appt.status}
                      </span>
                    </div>
                    <div className="detail-list">
                      <div className="detail-item"><FiActivity /> <span>Reason: {appt.reason || "General Checkup"}</span></div>
                      <div className="detail-item"><FaClock /> <span>{appt.date}</span></div>
                    </div>
                    {/* Action Buttons */}
                    <div className="action-row" style={{ marginTop: "12px" }} onClick={(e) => e.stopPropagation()}>
                      {appt.status === "Pending" && (
                        <button className="secondary-button" onClick={() => handleApprove(appt._id)}>Approve Appointment</button>
                      )}
                      {(appt.status === "Approved" || appt.status === "Completed") && (
                        <button className="secondary-button" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary-light)" }} onClick={() => navigate(`/consultation/${appt._id}`)}>
                          View & Prescribe
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--text-muted)", padding: "20px 0" }}>No appointments for today.</p>
              )}
            </div>
            <div className="action-row">
              <button className="secondary-button" onClick={() => navigate("/patients")}>Open patient file</button>
              <button className="secondary-button" onClick={() => alert("No more patients in the queue.")}>Next patient</button>
            </div>
          </section>

          <section className="dashboard-card">
            <div className="section-header">
              <div>
                <p className="eyebrow">Live notifications</p>
                <h3>Realtime updates</h3>
              </div>
              <span className="status-pill status-info">{notifications.length} new</span>
            </div>
            <div className="detail-list">
              {notifications.length === 0 ? <div className="empty-state">No alerts yet.</div> : notifications.map((item, i) => (
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

          <section className="dashboard-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="section-header">
              <div>
                <p className="eyebrow">Availability Setup</p>
                <h3>My Work Schedule</h3>
              </div>
            </div>
            
             {/* Date Addition */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94A3B8", marginBottom: "6px", fontWeight: "700" }}>
                Add Available Date
              </label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input 
                  type="date" 
                  value={newDateInput} 
                  onChange={e => setNewDateInput(e.target.value)}
                  style={{ 
                    flex: 1, 
                    padding: "8px 12px", 
                    background: "#0F172A", 
                    border: "1.5px solid #334155", 
                    borderRadius: "8px", 
                    color: "#FFFFFF", 
                    outline: "none" 
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => {
                    if (newDateInput && !availableDates.includes(newDateInput)) {
                      setAvailableDates([...availableDates, newDateInput].sort());
                      setNewDateInput("");
                    }
                  }}
                  style={{ padding: "8px 16px", background: "#00A89E", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                >
                  Add
                </button>
              </div>
              
              {/* Dates List */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "100px", overflowY: "auto" }}>
                {availableDates.map(d => (
                  <span key={d} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(10, 88, 163, 0.2)", border: "1px solid rgba(10, 88, 163, 0.4)", color: "#93C5FD", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem" }}>
                    {d}
                    <FiX 
                      style={{ cursor: "pointer", color: "#EF4444" }} 
                      onClick={() => setAvailableDates(availableDates.filter(x => x !== d))}
                    />
                  </span>
                ))}
              </div>
            </div>

            {/* Hours Addition */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94A3B8", marginBottom: "6px", fontWeight: "700" }}>
                Add Available Time Range
              </label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
                <select 
                  value={newFromHourInput} 
                  onChange={e => setNewFromHourInput(e.target.value)}
                  style={{ 
                    flex: 1, 
                    minWidth: "100px", 
                    padding: "8px 12px", 
                    background: "#0F172A", 
                    border: "1.5px solid #334155", 
                    borderRadius: "8px", 
                    color: "#FFFFFF", 
                    outline: "none" 
                  }}
                >
                  <option value="" style={{ color: "#FFFFFF", background: "#0F172A" }}>From Time</option>
                  {["12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM", "03:00 AM", "03:30 AM", "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM", "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"].map(t => (
                    <option key={t} value={t} style={{ color: "#FFFFFF", background: "#0F172A" }}>{t}</option>
                  ))}
                </select>
                <span style={{ color: "#94A3B8", fontSize: "0.85rem" }}>to</span>
                <select 
                  value={newToHourInput} 
                  onChange={e => setNewToHourInput(e.target.value)}
                  style={{ 
                    flex: 1, 
                    minWidth: "100px", 
                    padding: "8px 12px", 
                    background: "#0F172A", 
                    border: "1.5px solid #334155", 
                    borderRadius: "8px", 
                    color: "#FFFFFF", 
                    outline: "none" 
                  }}
                >
                  <option value="" style={{ color: "#FFFFFF", background: "#0F172A" }}>To Time</option>
                  {["12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM", "03:00 AM", "03:30 AM", "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM", "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"].map(t => (
                    <option key={t} value={t} style={{ color: "#FFFFFF", background: "#0F172A" }}>{t}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={() => {
                    if (newFromHourInput && newToHourInput) {
                      const slot = `${newFromHourInput} - ${newToHourInput}`;
                      if (!availableHours.includes(slot)) {
                        setAvailableHours([...availableHours, slot]);
                      }
                      setNewFromHourInput("");
                      setNewToHourInput("");
                    }
                  }}
                  style={{ padding: "8px 16px", background: "#00A89E", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                >
                  Add
                </button>
              </div>
              
              {/* Hours List */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "100px", overflowY: "auto" }}>
                {availableHours.map(h => (
                  <span key={h} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(0, 168, 158, 0.2)", border: "1px solid rgba(0, 168, 158, 0.4)", color: "#a7f3d0", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem" }}>
                    {h}
                    <FiX 
                      style={{ cursor: "pointer", color: "#EF4444" }} 
                      onClick={() => setAvailableHours(availableHours.filter(x => x !== h))}
                    />
                  </span>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button 
              type="button"
              disabled={savingAvailability}
              onClick={handleSaveAvailability}
              style={{
                width: "100%", background: "linear-gradient(135deg, #0A58A3 0%, #00A89E 100%)",
                border: "none", borderRadius: "10px", padding: "12px", color: "white",
                fontWeight: "700", cursor: "pointer", marginTop: "10px"
              }}
            >
              {savingAvailability ? "Saving..." : "Save Availability"}
            </button>
          </section>
        </div>

        <section className="dashboard-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Quick actions</p>
              <h3>Daily clinical tasks</h3>
            </div>
          </div>
          <div className="action-grid">
            <button className="quick-action" onClick={() => navigate("/prescriptions")}>Add prescription</button>
            <button className="quick-action" onClick={() => alert("Lab request successfully logged.")}>Request lab test</button>
            <button className="quick-action" onClick={() => navigate("/prescriptions")}>View reports</button>
            <button className="quick-action" onClick={() => alert("Initiating secure video consultation room...")}>Video consultation</button>
            <button className="quick-action" style={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }} onClick={() => alert("Emergency alert sent to hospital receptionist desk!")}>Emergency alert</button>
          </div>
        </section>
      </div>
    </div>
  );
}