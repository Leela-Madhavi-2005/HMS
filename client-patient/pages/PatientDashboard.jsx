import { useState, useEffect } from "react";
import { FiCalendar, FiTrash2, FiClock, FiUser, FiInfo, FiPlusCircle } from "react-icons/fi";
import { FaStethoscope, FaHospitalUser, FaBed } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/api";
import socket from "../api/socket";

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function PatientDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [assignedBed, setAssignedBed] = useState(null);
  const [loadingBed, setLoadingBed] = useState(true);
  const [selectedApptModal, setSelectedApptModal] = useState(null);

  // Load appointments and fetch admission details
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!currentUser) return;
      try {
        // Fetch appointments and beds in parallel
        const [data, beds] = await Promise.all([
          api.get("/appointments"),
          api.get("/wards/occupancy")
        ]);

        if (!isMounted) return;

        // Robust patient matching (Patient profile ID, linked User ID, or name fallback)
        const patientIds = [
          currentUser.patientId,
          currentUser._id,
          currentUser.id,
          currentUser.uid
        ].filter(Boolean).map(String);
        const curName = (currentUser.name || currentUser.displayName || "").toLowerCase().trim();

        // Removed local storage fallback

        let filtered = data.filter(a => {
          if (!a.patientId) return false;
          const pId = typeof a.patientId === "object" ? a.patientId._id : a.patientId;
          const pUserId = typeof a.patientId === "object" ? a.patientId.userId : null;
          const pName = (typeof a.patientId === "object" ? a.patientId.name : "").toLowerCase().trim();
          
          return (
            (pId && patientIds.includes(String(pId))) ||
            (pUserId && patientIds.includes(String(pUserId))) ||
            (curName && pName && pName.includes(curName)) ||
            (curName && curName.includes(pName))
          );
        });

        // Map DB appointments
        const formattedDb = filtered.map(a => ({
          id: a._id,
          doctorName: typeof a.doctorId === "object" ? a.doctorId?.name : "Assigned Specialist",
          specialization: typeof a.doctorId === "object" ? a.doctorId?.specialization : "General Medicine",
          date: a.date,
          purpose: a.reason,
          status: a.status,
          token: a.token,
          consultationFee: a.consultationFee || 300,
          consultationFeePaid: a.consultationFeePaid || false
        }));

        setAppointments(formattedDb);

        // Find bed
        const found = beds.find((b) => {
          const patientRef = b.patientId?._id || b.patientId;
          return patientRef && patientIds.includes(String(patientRef));
        });
        setAssignedBed(found || null);

      } catch (err) {
        console.error("Failed to load patient dashboard data:", err);
      } finally {
        if (isMounted) setLoadingBed(false);
      }
    }

    loadData();

    window.handlePayConsultation = async (apptId, fee) => {
      try {
        await api.put(`/appointments/${apptId}`, {
          consultationFeePaid: true,
          consultationFee: fee || 300
        });
        loadData();
        alert("Consultation fee payment confirmed!");
      } catch (err) {
        console.error("Failed to confirm fee payment:", err);
      }
    };

        const handleAppointmentUpdate = () => {
          if (isMounted) loadData();
        };
        socket.on("appointment:update", handleAppointmentUpdate);

        return () => {
          isMounted = false;
          socket.off("appointment:update", handleAppointmentUpdate);
        };
      }, [currentUser]);

      async function removeAppointment(id) {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
        try {
          await api.delete(`/appointments/${id}`);
        } catch (err) {
          console.error("Failed to delete appointment from backend:", err);
        }
        // Instantly purge from state
        setAppointments(prev => prev.filter(a => String(a.id) !== String(id)));
      }

      // Helper to determine floor based on ward name
      const getFloorInfo = (wardName) => {
        const name = (wardName || "").toLowerCase();
        if (name.includes("icu")) return "ICU / critical Care - 3rd Floor";
        if (name.includes("pediatric")) return "Pediatric Wing - 2nd Floor";
        if (name.includes("general")) return "General Ward - Ground Floor";
        return "Specialty Wing - 1st Floor";
      };

      return (
        <div style={{
          minHeight: "100%",
          background: "var(--content-bg, #F8FAFC)",
          padding: "32px",
          fontFamily: "'Inter', 'Poppins', sans-serif"
        }}>

          {/* Grid container for side-by-side card partitions */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "32px",
            alignItems: "start"
          }}>

            {/* ── RECENT APPOINTMENTS CARD ── */}
            <div className="mc-dash-partition-card">
              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(10, 88, 163, 0.1)",
                  color: "#0A58A3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem"
                }}>
                  <FiCalendar />
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: "1.3rem",
                    fontWeight: "800",
                    color: "var(--text-primary, #111827)"
                  }}>
                    Recent Appointments
                  </h2>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted, #6B7280)", fontSize: "0.82rem" }}>
                    {appointments.length === 0
                      ? "No scheduled appointments"
                      : `${appointments.length} active visit${appointments.length !== 1 ? "s" : ""}`
                    }
                  </p>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                {appointments.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    border: "2px dashed var(--card-border, #E5E7EB)",
                    borderRadius: "16px",
                    color: "var(--text-muted, #9CA3AF)",
                    background: "var(--content-bg, #F9FAFB)"
                  }}>
                    <FiCalendar style={{ fontSize: "2.2rem", marginBottom: "12px", opacity: 0.3 }} />
                    <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: "1.5" }}>
                      No appointments booked yet.<br />
                      Use <strong style={{ color: "#0A58A3" }}>MediCare</strong> in the menu to find a doctor.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {appointments.map(appt => (
                      <div
                        key={appt.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          background: "var(--content-bg, #F8FAFC)",
                          border: "1px solid var(--card-border, #E5E7EB)",
                          borderRadius: "12px",
                          padding: "16px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = "#0A58A3";
                          e.currentTarget.style.boxShadow = "0 4px 14px rgba(10,88,163,0.06)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = "var(--card-border, #E5E7EB)";
                          e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.02)";
                        }}
                      >
                    <div style={{
                      width: 40, height: 40, borderRadius: "10px", flexShrink: 0,
                      background: "linear-gradient(135deg, #0A58A3 0%, #00A89E 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: "1rem"
                    }}>
                      <FaStethoscope />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        fontWeight: "700",
                        color: "var(--text-primary, #111827)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        Dr. {appt.doctorName}
                      </p>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                        <span style={{
                          background: "rgba(10,88,163,0.08)", color: "#0A58A3",
                          fontSize: "0.68rem", fontWeight: "700",
                          padding: "1px 8px", borderRadius: "20px"
                        }}>
                          {appt.specialization}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "0.74rem", color: "var(--text-muted, #9CA3AF)" }}>
                          <FiClock size={11} />
                          {appt.date}
                        </span>
                        <span style={{
                          background: appt.status === "Confirmed" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                          color: appt.status === "Confirmed" ? "#10B981" : "#D97706",
                          fontSize: "0.68rem",
                          fontWeight: "800",
                          padding: "2px 8px",
                          borderRadius: "20px"
                        }}>
                          {appt.status}
                        </span>
                        {appt.token && (
                          <span style={{
                            background: "linear-gradient(135deg, #0A58A3, #00A89E)",
                            color: "#fff",
                            fontSize: "0.68rem",
                            fontWeight: "800",
                            padding: "2px 10px",
                            borderRadius: "20px",
                            letterSpacing: "0.5px",
                          }}>
                            🎫 {appt.token}
                          </span>
                        )}
                        {!appt.consultationFeePaid && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const printWindow = window.open("", "_blank", "width=400,height=550");
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Scan & Pay Consultation Fee</title>
                                    <style>
                                      body { background: #111827; color: #fff; font-family: sans-serif; text-align: center; padding: 24px; }
                                      img { width: 100%; max-width: 300px; border-radius: 12px; margin: 16px 0; border: 1px solid #374151; }
                                      .btn { background: #10B981; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 12px; width: 100%; }
                                    </style>
                                  </head>
                                  <body>
                                    <div style="background:#121212;border:1px solid #2D2D2D;padding:20px;border-radius:16px;text-align:center;">
                                      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;text-align:left;">
                                        <div style="width:40px;height:40px;border-radius:50%;background:#EAB308;color:#000;font-weight:800;display:flex;align-items:center;justify-center:center;font-size:1.2rem;line-height:40px;text-align:center;">R</div>
                                        <div>
                                          <div style="font-weight:700;font-size:1rem;color:#fff;">Raju</div>
                                          <div style="font-size:0.8rem;color:#9CA3AF;">+91 7981322657</div>
                                        </div>
                                      </div>
                                      <div style="background:rgba(16,185,129,0.15);color:#10B981;font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:12px;display:inline-block;margin-bottom:12px;">✓ Receiving money on PhonePe</div>
                                      <div style="background:#1E1E1E;padding:14px;border-radius:14px;display:inline-block;">
                                        <img src="/src/assets/qr_matrix.png" onerror="this.src='/assets/qr_matrix.png'" style="width:200px;height:200px;object-fit:contain;border-radius:8px;" />
                                        <div style="margin-top:8px;font-size:0.8rem;color:#9CA3AF;">🏦 Union Bank... - 7312</div>
                                      </div>
                                      <div style="margin-top:12px;font-size:1.3rem;font-weight:800;color:#10B981;">Amount: ₹${appt.consultationFee || 300}</div>
                                      <button class="btn" onclick="window.opener.handlePayConsultation('${appt.id}', ${appt.consultationFee || 300}); window.close();">Confirm Payment ✓</button>
                                    </div>
                                  </body>
                                </html>
                              `);
                            }}
                            style={{
                              background: "#D97706", color: "#fff", border: "none",
                              padding: "2px 8px", borderRadius: "12px", fontSize: "0.68rem",
                              fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "3px"
                            }}
                          >
                            💳 Pay Fee (₹{appt.consultationFee || 300})
                          </button>
                        )}
                      </div>
                    </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                        {(appt.status === "Approved" || appt.status === "Completed") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/consultation/${appt.id}`);
                            }}
                            style={{
                              background: "#0A58A3",
                              color: "#fff",
                              border: "none",
                              padding: "6px 14px",
                              borderRadius: "8px",
                              fontWeight: "600",
                              fontSize: "0.85rem",
                              cursor: "pointer",
                              transition: "background 0.15s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#084B8A"}
                            onMouseLeave={e => e.currentTarget.style.background = "#0A58A3"}
                          >
                            View
                          </button>
                        )}

                        {appt.status === "Cancelled" ? (
                          <span style={{ color: "#EF4444", fontSize: "0.85rem", fontWeight: "700" }}>
                            Appointment Cancelled
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAppointment(appt.id);
                            }}
                            title="Remove appointment"
                            style={{
                              background: "rgba(239,68,68,0.08)",
                              border: "1px solid rgba(239,68,68,0.15)",
                              color: "#EF4444",
                              borderRadius: "8px",
                              padding: "6px 8px",
                              cursor: "pointer",
                              display: "flex", alignItems: "center",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RECENT ADMISSION DETAILS CARD ── */}
        <div className="mc-dash-partition-card">
          <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(0, 168, 158, 0.1)",
              color: "#00A89E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem"
            }}>
              <FaHospitalUser />
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: "1.3rem",
                fontWeight: "800",
                color: "var(--text-primary, #111827)"
              }}>
                Recent Admission details
              </h2>
              <p style={{ margin: "4px 0 0", color: "var(--text-muted, #6B7280)", fontSize: "0.82rem" }}>
                {assignedBed ? "Active ward allocation" : "No active admission"}
              </p>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {loadingBed ? (
              <div style={{
                background: "var(--card-bg, #ffffff)",
                border: "1px solid var(--card-border, #E5E7EB)",
                borderRadius: "16px",
                padding: "32px",
                textAlign: "center"
              }}>
                <p style={{ margin: 0, color: "var(--text-muted, #6B7280)" }}>Checking admission status...</p>
              </div>
            ) : assignedBed ? (
              <div style={{
                background: "linear-gradient(135deg, #0A58A3 0%, #00A89E 100%)",
                borderRadius: "16px",
                padding: "24px",
                color: "#ffffff",
                boxShadow: "0 8px 32px rgba(10,88,163,0.14)",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                animation: "fadeIn 0.3s ease-out"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.2rem"
                    }}>
                      🛎️
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.85, fontWeight: "700" }}>
                        Status
                      </span>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800" }}>Currently Admitted</h3>
                    </div>
                  </div>
                  <span style={{
                    background: "rgba(255, 255, 255, 0.25)",
                    padding: "5px 12px",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    letterSpacing: "0.5px"
                  }}>
                    Active Ward Care
                  </span>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "14px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.15)"
                }}>
                  <div>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.75, fontWeight: "600" }}>Ward Name</span>
                    <p style={{ margin: "2px 0 0", fontSize: "1.05rem", fontWeight: "700" }}>{assignedBed.ward}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.75, fontWeight: "600" }}>Bed Allocation</span>
                    <p style={{ margin: "2px 0 0", fontSize: "1.05rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaBed /> Bed {assignedBed.bedNumber}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.75, fontWeight: "600" }}>Location / Level</span>
                    <p style={{ margin: "2px 0 0", fontSize: "1.05rem", fontWeight: "700" }}>{getFloorInfo(assignedBed.ward)}</p>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.9, fontStyle: "italic", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FiInfo /> 24/7 patient nursing is active. Contact the duty nurse for assistance.
                </p>
              </div>
            ) : (
              <div style={{
                background: "var(--content-bg, #F8FAFC)",
                border: "1.5px dashed var(--card-border, #E5E7EB)",
                borderRadius: "16px",
                padding: "48px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                height: "100%",
                boxSizing: "border-box",
                justifyContent: "center"
              }}>
                <FaBed style={{ fontSize: "2.2rem", color: "var(--text-muted, #9CA3AF)", opacity: 0.4 }} />
                <h4 style={{ margin: 0, color: "var(--text-primary, #374151)", fontWeight: "700" }}>No Active Admission</h4>
                <p style={{ margin: 0, color: "var(--text-muted, #6B7280)", fontSize: "0.88rem", lineHeight: "1.5" }}>
                  You are currently registered as an outpatient.<br />No active ward admission details recorded.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Appointment Full History Modal */}
      {selectedApptModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.7)", zIndex: 99999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }} onClick={() => setSelectedApptModal(null)}>
          <div style={{
            background: "#111827", color: "#fff", padding: "28px", borderRadius: "20px",
            width: "100%", maxWidth: "480px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
            border: "1px solid #374151"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #374151", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <span style={{ background: "linear-gradient(135deg, #0A58A3, #00A89E)", color: "#fff", padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "800" }}>
                  {selectedApptModal.token || "TOKEN-APPT"}
                </span>
                <h3 style={{ margin: "6px 0 0 0", color: "#fff", fontSize: "1.2rem" }}>
                  Dr. {selectedApptModal.doctorName}
                </h3>
                <p style={{ margin: 0, color: "#9CA3AF", fontSize: "0.85rem" }}>
                  {selectedApptModal.specialization || "General Medicine"}
                </p>
              </div>
              <button onClick={() => setSelectedApptModal(null)} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #374151", paddingBottom: "10px" }}>
                <span style={{ color: "#9CA3AF" }}>Appointment Date & Time:</span>
                <strong style={{ color: "#fff" }}>{selectedApptModal.date}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #374151", paddingBottom: "10px" }}>
                <span style={{ color: "#9CA3AF" }}>Purpose / Complaint:</span>
                <strong style={{ color: "#fff" }}>{selectedApptModal.purpose || selectedApptModal.reason || "General Checkup"}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #374151", paddingBottom: "10px" }}>
                <span style={{ color: "#9CA3AF" }}>Current Status:</span>
                <span style={{
                  background: selectedApptModal.status === "Confirmed" || selectedApptModal.status === "Approved" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                  color: selectedApptModal.status === "Confirmed" || selectedApptModal.status === "Approved" ? "#10B981" : "#F59E0B",
                  padding: "2px 10px", borderRadius: "12px", fontWeight: "800", fontSize: "0.8rem"
                }}>
                  {selectedApptModal.status}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #374151", paddingBottom: "10px" }}>
                <span style={{ color: "#9CA3AF" }}>Consultation Fee:</span>
                <strong style={{ color: "#00A89E", fontSize: "1.05rem" }}>
                  ₹{selectedApptModal.consultationFee || 300}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#9CA3AF" }}>Fee Payment Status:</span>
                <span style={{
                  color: selectedApptModal.consultationFeePaid ? "#10B981" : "#EF4444",
                  fontWeight: "800"
                }}>
                  {selectedApptModal.consultationFeePaid ? "Paid ✓" : "Pending Payment"}
                </span>
              </div>

              {!selectedApptModal.consultationFeePaid && (
                <div style={{ marginTop: "12px" }}>
                  <button
                    onClick={() => {
                      const printWindow = window.open("", "_blank", "width=420,height=600");
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Scan & Pay Consultation Fee</title>
                            <style>
                              body { background: #111827; color: #fff; font-family: 'Inter', sans-serif; text-align: center; padding: 24px; margin: 0; }
                              .card { background: #1F2937; border: 1px solid #374151; padding: 20px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                              h2 { margin: 0 0 4px; color: #fff; font-size: 1.2rem; }
                              .amount { font-size: 1.6rem; font-weight: 800; color: #10B981; margin: 8px 0; }
                              img { width: 100%; max-width: 280px; border-radius: 12px; margin: 12px 0; border: 1px solid #374151; }
                              .btn { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #fff; border: none; padding: 14px; border-radius: 10px; font-weight: 800; font-size: 1rem; cursor: pointer; margin-top: 12px; width: 100%; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
                              .sub { font-size: 0.8rem; color: #9CA3AF; margin-top: 4px; }
                            </style>
                          </head>
                          <body>
                            <div class="card">
                              <h2>💳 Consultation Fee</h2>
                              <div class="amount">₹${selectedApptModal.consultationFee || 300}</div>
                              <p class="sub">Scan with PhonePe / GooglePay / Paytm</p>
                              <img src="/src/assets/upi_qr.png" onerror="this.src='/assets/upi_qr.png'" alt="PhonePe QR Code" />
                              <button class="btn" onclick="window.opener.handlePayConsultation('${selectedApptModal.id}', ${selectedApptModal.consultationFee || 300}); window.close();">Confirm Payment ✓</button>
                            </div>
                          </body>
                        </html>
                      `);
                    }}
                    style={{
                      width: "100%", padding: "12px", borderRadius: "10px", border: "none",
                      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "#fff",
                      fontWeight: "800", cursor: "pointer", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(16,185,129,0.3)"
                    }}
                  >
                    💳 Pay Consultation Fee (₹{selectedApptModal.consultationFee || 300})
                  </button>
                </div>
              )}

              <div style={{ marginTop: "10px" }}>
                <button
                  onClick={() => {
                    setSelectedApptModal(null);
                    navigate("/profile");
                  }}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "10px",
                    border: "1px solid #0A58A3", background: "rgba(10, 88, 163, 0.15)",
                    color: "#60A5FA", fontWeight: "700", cursor: "pointer", fontSize: "0.9rem"
                  }}
                >
                  📋 View Full Patient Medical Record (Bills, Prescriptions & Reports)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .mc-dash-partition-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--card-border, #E5E7EB);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          min-height: 380px;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .mc-dash-partition-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(10, 88, 163, 0.05);
          border-color: rgba(0, 168, 158, 0.15);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  );
}
