import { useState, useEffect, useMemo } from "react";
import api from "../api/api";
import socket from "../api/socket";
import { useAuth } from "../contexts/AuthContext";
import {
  FiSearch, FiPhone, FiMapPin, FiCalendar,
  FiStar, FiHeart, FiVideo, FiAward, FiClock,
  FiX, FiCheckCircle
} from "react-icons/fi";
import { FaUserMd, FaStethoscope } from "react-icons/fa";

/* ─── Department list ────────────────────────────────────── */
const DEPARTMENTS = [
  { id: "all",              label: "All",             emoji: "🏥" },
  { id: "Cardiology",       label: "Cardiology",      emoji: "❤️" },
  { id: "Neurology",        label: "Neurology",       emoji: "🧠" },
  { id: "Orthopedics",      label: "Orthopedics",     emoji: "🦴" },
  { id: "Dermatology",      label: "Dermatology",     emoji: "🧴" },
  { id: "Pediatrics",       label: "Pediatrics",      emoji: "👶" },
  { id: "General",          label: "General",         emoji: "🩺" },
  { id: "Oncology",         label: "Oncology",        emoji: "🎗️" },
  { id: "Urology",          label: "Urology",         emoji: "💊" },
  { id: "Gynecology",       label: "Gynecology",      emoji: "🌸" },
  { id: "ENT",              label: "ENT",             emoji: "👂" },
];

/* ─── Dummy fallback doctors for each specialization ────── */
const DUMMY_DOCTORS = [];

/* Helper functions to filter out past dates and exceeded time slots */
function filterValidDates(availableDates) {
  if (!availableDates || !Array.isArray(availableDates)) return [];
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return availableDates.filter(d => d >= todayStr);
}

function filterValidHours(availableHours, selectedDate) {
  if (!availableHours || !Array.isArray(availableHours)) return [];
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  
  // If the selected date is in the future, all posted hours for that day are valid
  if (selectedDate && selectedDate > todayStr) {
    return availableHours;
  }
  
  // If selected date is today (or no date selected), filter out hours that have already passed
  if (!selectedDate || selectedDate === todayStr) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return availableHours.filter(h => {
      // Parse hour string like "09:00 AM" or "02:30 PM" or "09:00 AM - 05:00 PM" (check end time if range)
      const targetTimeStr = h.includes("-") ? h.split("-")[1].trim() : h.trim();
      const timeParts = targetTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeParts) return true; // Keep if custom text
      
      let hour = parseInt(timeParts[1], 10);
      const minute = parseInt(timeParts[2], 10);
      const ampm = timeParts[3].toUpperCase();
      
      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;
      
      const slotMinutes = hour * 60 + minute;
      return slotMinutes > currentMinutes;
    });
  }

  // If selected date is in the past, return empty list
  return [];
}

/* Stable availability — computed once from doctor ID, never changes on re-render */
function getStableDate(id) {
  return "Today";
}

function getStableRating(id) {
  let hash = 0;
  for (let i = 0; i < String(id).length; i++) hash = (hash * 17 + String(id).charCodeAt(i)) >>> 0;
  return 3 + (hash % 3); // 3, 4, or 5
}

/* ─── Skeleton card ─────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="mc-skeleton-card">
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <div className="mc-skel-box" style={{ width: 72, height: 72, borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <div className="mc-skel-box" style={{ height: 15, width: "70%", marginBottom: 8 }} />
          <div className="mc-skel-box" style={{ height: 12, width: "45%" }} />
        </div>
      </div>
      <div className="mc-skel-box" style={{ height: 11, marginBottom: 6 }} />
      <div className="mc-skel-box" style={{ height: 11, width: "80%" }} />
    </div>
  );
}

/* ─── Doctor card ───────────────────────────────────────── */
function DoctorCard({ doctor, onBook }) {
  const [liked, setLiked] = useState(false);

  const initials = useMemo(() =>
    doctor.name
      ? doctor.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
      : "DR"
  , [doctor.name]);

  // Stable values — computed once based on ID, never change on re-render
  const availDate  = useMemo(() => getStableDate(doctor._id),  [doctor._id]);
  const rating     = useMemo(() => getStableRating(doctor._id), [doctor._id]);
  const experience = doctor.exp ?? (5 + (String(doctor._id).length % 16));
  const qual       = doctor.qual ?? `MBBS, MD (${doctor.specialization || "General Medicine"})`;

  const avatarColors = [
    "linear-gradient(135deg,#0A58A3,#00A89E)",
    "linear-gradient(135deg,#1D4ED8,#06B6D4)",
    "linear-gradient(135deg,#7C3AED,#0A58A3)",
    "linear-gradient(135deg,#059669,#0A58A3)",
  ];
  const avatarBg = useMemo(() => {
    let h = 0;
    for (let i = 0; i < String(doctor._id).length; i++) h = (h * 31 + String(doctor._id).charCodeAt(i)) >>> 0;
    return avatarColors[h % avatarColors.length];
  }, [doctor._id]);

  const isToday = availDate === "Today";

  return (
    <div className="mc-doctor-card">
      {/* Top row */}
      <div style={{ display: "flex", gap: "14px", marginBottom: "14px" }}>
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: 12, flexShrink: 0,
          background: avatarBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.35rem", fontWeight: 800, color: "#fff",
          boxShadow: "0 4px 14px rgba(10,88,163,0.22)"
        }}>
          {initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
            <div style={{ minWidth: 0 }}>
              <h3 className="mc-doctor-name">Dr. {doctor.name}</h3>
              <span className="mc-spec-badge">{doctor.specialization || "General Medicine"}</span>
            </div>
            <button
              onClick={() => setLiked(l => !l)}
              className="mc-heart-btn"
              title="Save to favourites"
              aria-label="Save doctor"
            >
              <FiHeart className={liked ? "mc-heart-active" : ""} />
            </button>
          </div>

          {/* Stars */}
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 6 }}>
            {[1,2,3,4,5].map(s => (
              <FiStar key={s} size={12} style={{
                fill: s <= rating ? "#F59E0B" : "none",
                color: "#F59E0B"
              }} />
            ))}
            <span className="mc-rating-text">{rating}.0</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mc-detail-section">
        <div className="mc-detail-row">
          <FaStethoscope className="mc-detail-icon" />
          <div>
            <span className="mc-detail-label">Qualifications</span>
            <span className="mc-detail-value">{qual}</span>
          </div>
        </div>
        <div className="mc-detail-row">
          <FiAward className="mc-detail-icon" />
          <div>
            <span className="mc-detail-label">Experience</span>
            <span className="mc-detail-value">{experience}+ years</span>
          </div>
        </div>
        <div className="mc-detail-row">
          <FiMapPin className="mc-detail-icon" />
          <div>
            <span className="mc-detail-label">Location</span>
            <span className="mc-detail-value">MediCare Multispeciality Hospital</span>
          </div>
        </div>
        {doctor.phone && (
          <div className="mc-detail-row">
            <FiPhone className="mc-detail-icon" />
            <span className="mc-detail-value">{doctor.phone}</span>
          </div>
        )}
      </div>

      {/* Availability Section */}
      <div style={{ margin: "0 16px 16px", padding: "12px 0 0", borderTop: "1.5px dashed var(--card-border, #E5E7EB)" }}>
        <p style={{ margin: "0 0 6px 0", fontSize: "0.78rem", fontWeight: "700", color: "#0A58A3" }}>
          Available Dates:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
          {(() => {
            const validDates = filterValidDates(doctor.availableDates);
            return validDates.length > 0 ? (
              validDates.map(d => (
                <span key={d} style={{ background: "rgba(10, 88, 163, 0.08)", color: "#0A58A3", padding: "2px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "700" }}>
                  {d}
                </span>
              ))
            ) : (
              <span style={{ color: "#64748B", fontSize: "0.74rem", fontStyle: "italic" }}>No upcoming dates</span>
            );
          })()}
        </div>

        <p style={{ margin: "0 0 6px 0", fontSize: "0.78rem", fontWeight: "700", color: "#00A89E" }}>
          Available Hours:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {(() => {
            const validDates = filterValidDates(doctor.availableDates);
            const validHours = filterValidHours(doctor.availableHours, validDates[0] || new Date().toISOString().split("T")[0]);
            return validHours.length > 0 ? (
              validHours.map(h => (
                <span key={h} style={{ background: "rgba(0, 168, 158, 0.08)", color: "#00A89E", padding: "2px 8px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "700" }}>
                  {h}
                </span>
              ))
            ) : (
              <span style={{ color: "#64748B", fontSize: "0.74rem", fontStyle: "italic" }}>No remaining hours today</span>
            );
          })()}
        </div>
      </div>

      {/* Footer */}
      <div className="mc-card-footer" style={{ justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="mc-video-btn" title="Video Consultation">
            <FiVideo size={14} />
          </button>
          {(() => {
            const validDates = filterValidDates(doctor.availableDates);
            const validHours = filterValidHours(doctor.availableHours, validDates[0] || new Date().toISOString().split("T")[0]);
            const isBookable = validDates.length > 0 && validHours.length > 0;
            return (
              <button
                className="mc-book-btn"
                onClick={() => onBook(doctor)}
                style={{
                  background: isBookable ? "linear-gradient(135deg, #FACC15 0%, #F59E0B 100%)" : "linear-gradient(135deg, #DC2626 0%, #E11D48 100%)",
                  color: isBookable ? "#422006" : "white",
                  cursor: "pointer"
                }}
                title={!isBookable ? "Click to view availability details" : "Book Appointment"}
              >
                {isBookable ? "Book Appointment" : "Not Available"}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/* ─── Booking modal ─────────────────────────────────────── */
function BookingModal({ doctor, onClose, onConfirm }) {
  const validDates = filterValidDates(doctor.availableDates);
  const [purpose, setPurpose] = useState("");
  const [date, setDate] = useState(validDates[0] || new Date().toISOString().split("T")[0]);
  
  const validHours = filterValidHours(doctor.availableHours, date);
  const [time, setTime] = useState(validHours[0] || "");
  const [step, setStep] = useState(1); // Step 1: Details, Step 2: QR Payment, Step 3: Success
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fee = doctor.consultationFee || (doctor.specialization === "General Medicine" ? 300 : 500);

  function handleNextStep(e) {
    e.preventDefault();
    if (!purpose.trim() || !date || !time) return;
    setStep(2); // Proceed to QR payment step
  }

  async function handleFinalPaymentAndConfirm() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const booked = await onConfirm({ doctor, purpose: purpose.trim(), date, time, consultationFeePaid: true });
    setIsSubmitting(false);

    if (!booked) return;

    setStep(3); // Success step
    setTimeout(() => { onClose(); }, 2000);
  }

  return (
    <div className="mc-modal-overlay" onClick={onClose}>
      <div className="mc-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "440px" }}>
        {step === 1 && (
          <>
            {/* Header */}
            <div className="mc-modal-header">
              <div>
                <h2 className="mc-modal-title">Book Appointment</h2>
                <p className="mc-modal-sub">Dr. {doctor.name} &mdash; {doctor.specialization}</p>
              </div>
              <button className="mc-modal-close" onClick={onClose}><FiX size={20}/></button>
            </div>

            {/* Form Step 1 */}
            <form onSubmit={handleNextStep} className="mc-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="mc-modal-label" style={{ display: "block", marginBottom: "6px" }}>Purpose of Visit</label>
                <input
                  autoFocus
                  className="mc-modal-input"
                  type="text"
                  placeholder="e.g. Chest pain, Regular checkup, Follow-up..."
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  maxLength={80}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1.5px solid var(--card-border)" }}
                />
                <p className="mc-modal-hint" style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#64748B" }}>
                  {purpose.length}/80 characters
                </p>
              </div>

              {(!validDates.length || !validHours.length) && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "10px 14px", borderRadius: "10px", fontSize: "0.82rem", fontWeight: "700" }}>
                  ⚠️ Dr. {doctor.name} currently has no available dates or remaining hours posted. Appointment cannot be booked.
                </div>
              )}

              {/* Dynamic Availability Date */}
              <div>
                <label className="mc-modal-label" style={{ display: "block", marginBottom: "6px" }}>Select Date</label>
                {validDates.length > 0 ? (
                  <select
                    value={date}
                    onChange={e => {
                      const newDate = e.target.value;
                      setDate(newDate);
                      const newValidHours = filterValidHours(doctor.availableHours, newDate);
                      if (newValidHours.length > 0) setTime(newValidHours[0]);
                      else setTime("");
                    }}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1.5px solid var(--card-border)", background: "white" }}
                  >
                    <option value="">-- Choose Date --</option>
                    {validDates.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ padding: "10px", background: "#F1F5F9", borderRadius: "8px", color: "#64748B", fontSize: "0.85rem", fontStyle: "italic" }}>
                    No upcoming dates posted by doctor
                  </div>
                )}
              </div>

              {/* Dynamic Availability Time Hours */}
              <div>
                <label className="mc-modal-label" style={{ display: "block", marginBottom: "6px" }}>Select Time Slot</label>
                {validHours.length > 0 ? (
                  <select
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1.5px solid var(--card-border)", background: "white" }}
                  >
                    <option value="">-- Choose Time Slot --</option>
                    {validHours.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ padding: "10px", background: "#F1F5F9", borderRadius: "8px", color: "#64748B", fontSize: "0.85rem", fontStyle: "italic" }}>
                    No remaining hours posted for selected date
                  </div>
                )}
              </div>

              {/* Consultation Fee Notice */}
              <div style={{
                background: "rgba(10,88,163,0.06)", border: "1px solid rgba(10,88,163,0.2)",
                padding: "12px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <span style={{ fontSize: "0.88rem", fontWeight: "600", color: "#0A58A3" }}>Consultation Fee:</span>
                <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0A58A3" }}>
                  ₹{fee}
                </span>
              </div>

              <div className="mc-modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" className="mc-modal-cancel" onClick={onClose} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#E2E8F0", cursor: "pointer" }}>Cancel</button>
                <button
                  type="submit"
                  className="mc-book-btn"
                  disabled={!validDates.length || !validHours.length || !purpose.trim() || !date || !time}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: (!validDates.length || !validHours.length || !purpose.trim() || !date || !time)
                      ? "#94A3B8"
                      : "linear-gradient(135deg, #FACC15 0%, #F59E0B 100%)",
                    color: (!validDates.length || !validHours.length || !purpose.trim() || !date || !time) ? "white" : "#422006",
                    fontWeight: "700",
                    cursor: (!validDates.length || !validHours.length || !purpose.trim() || !date || !time) ? "not-allowed" : "pointer"
                  }}
                >
                  Proceed to Payment (₹{fee}) &rarr;
                </button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <div style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>💳 PhonePe Consultation Payment</h3>
              <button className="mc-modal-close" onClick={onClose}><FiX size={20}/></button>
            </div>

            <div style={{ background: "#121212", color: "#fff", padding: "18px", borderRadius: "16px", marginBottom: "16px", border: "1px solid #2D2D2D" }}>
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
                fontWeight: "700", padding: "4px 10px", borderRadius: "12px", display: "inline-block", marginBottom: "12px"
              }}>
                ✓ Receiving money on PhonePe
              </div>

              <div style={{ background: "#1E1E1E", padding: "14px", borderRadius: "14px", display: "inline-block" }}>
                <img src="/src/assets/qr_matrix.png" onError={(e) => e.target.src = "/assets/qr_matrix.png"} alt="PhonePe QR Code" style={{ width: "200px", height: "200px", objectFit: "contain", borderRadius: "8px" }} />
                <div style={{ marginTop: "8px", fontSize: "0.8rem", color: "#9CA3AF" }}>
                  🏦 Union Bank... - 7312
                </div>
              </div>

              <div style={{ marginTop: "12px", fontSize: "1.2rem", fontWeight: "800", color: "#10B981" }}>
                Amount: ₹{fee}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "white", cursor: "pointer", fontWeight: "600" }}>
                &larr; Back
              </button>
              <button
                onClick={handleFinalPaymentAndConfirm}
                disabled={isSubmitting}
                style={{
                  flex: 2, padding: "12px", borderRadius: "8px", border: "none",
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "white",
                  fontWeight: "800", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                Confirm Payment & Book ✓
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mc-modal-success" style={{ textAlign: "center", padding: "28px" }}>
            <FiCheckCircle size={56} style={{ color: "#16A34A", marginBottom: 12 }} />
            <h3 style={{ margin: "0 0 6px", color: "var(--text-primary,#111827)" }}>Payment Confirmed & Appointment Booked!</h3>
            <p style={{ margin: "0 0 12px", color: "var(--text-muted,#6B7280)", fontSize: "0.9rem" }}>
              Payment of ₹{fee} received. Your appointment with Dr. {doctor.name} on {date} at {time} is confirmed!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main MediCare page ────────────────────────────────── */
export default function MediCare() {
  const { currentUser } = useAuth();
  const [apiDoctors, setApiDoctors] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [activeDept, setActiveDept] = useState("all");
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [unavailableDoctor, setUnavailableDoctor] = useState(null);

  function handleBooking(doctor) {
    const validDates = filterValidDates(doctor.availableDates);
    const validHours = filterValidHours(doctor.availableHours, validDates[0] || new Date().toISOString().split("T")[0]);
    const isBookable = validDates.length > 0 && validHours.length > 0;

    if (isBookable) {
      setBookingDoctor(doctor);
    } else {
      setUnavailableDoctor(doctor);
    }
  }

  async function handleConfirm({ doctor, purpose, date, time, consultationFeePaid }) {
    const fee = doctor.consultationFee || (doctor.specialization === "General Medicine" ? 300 : 500);
    const patId = currentUser?.patientId || currentUser?._id || currentUser?.uid;
    const apptDate = `${date} at ${time}`;
    if (patId) {
      try {
        await api.post("/appointments", {
          patientId: patId,
          doctorId: doctor._id || doctor.id,
          date: apptDate,
          reason: purpose,
          consultationFee: fee,
          consultationFeePaid: consultationFeePaid || false,
          status: "Pending"
        });
        
        // Remove any old local storage items that might cause duplicate/stale UI
        localStorage.removeItem("mc_appointments");
        return true;
        
      } catch (err) {
        console.error("Failed to post online appointment:", err);
        alert("Server Error: Failed to book appointment in database.");
        return false;
      }
    } else {
      alert("Error: Patient ID not found. Please log in again.");
      return false;
    }
  }

  useEffect(() => {
    api.get("/doctors")
      .then(data => setApiDoctors(Array.isArray(data) ? data : []))
      .catch(() => setApiDoctors([]))
      .finally(() => setLoading(false));
  }, []);

  // Listen for real-time doctor availability updates
  useEffect(() => {
    const handleAvailabilityUpdate = (updatedDoc) => {
      setApiDoctors(prevDocs => 
        prevDocs.map(doc => doc._id === updatedDoc._id ? { ...doc, ...updatedDoc } : doc)
      );
    };

    socket.on("doctor:availability", handleAvailabilityUpdate);
    return () => {
      socket.off("doctor:availability", handleAvailabilityUpdate);
    };
  }, []);

  // Merge real API doctors with dummy ones (avoid ID collisions)
  const allDoctors = apiDoctors;

  const filtered = useMemo(() =>
    allDoctors.filter(doc => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        doc.name?.toLowerCase().includes(q) ||
        doc.specialization?.toLowerCase().includes(q);
      const matchDept = activeDept === "all" || doc.specialization === activeDept;
      return matchSearch && matchDept;
    }),
  [allDoctors, search, activeDept]);

  return (
    <div className="mc-page">

      {/* ── Header ── */}
      <div className="mc-header">
        <div className="mc-header-inner">
          <div>
            <h1 className="mc-title">Find a Doctor</h1>
            <p className="mc-subtitle">
              Search from our expert specialists and book an appointment instantly
            </p>
          </div>

          {/* Stats strip */}
          <div className="mc-stats-strip">
            {[
              { icon: <FaUserMd />, value: `${allDoctors.length}+`, label: "Doctors" },
              { icon: <FiClock />,  value: "24/7",   label: "Available" },
              { icon: <FiAward />,  value: "15+",    label: "Specialties" },
            ].map((s, i) => (
              <div key={i} className="mc-stat">
                <span className="mc-stat-icon">{s.icon}</span>
                <span className="mc-stat-value">{s.value}</span>
                <span className="mc-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="mc-search-bar">
          <FiSearch size={18} className="mc-search-icon" />
          <input
            type="text"
            className="mc-search-input"
            placeholder="Search by doctor name or specialization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="mc-search-clear" onClick={() => setSearch("")}>✕</button>
          )}
          <button className="mc-search-btn">Search</button>
        </div>
      </div>

      {/* ── Department filters ── */}
      <div className="mc-dept-bar">
        {DEPARTMENTS.map(dept => (
          <button
            key={dept.id}
            onClick={() => setActiveDept(dept.id)}
            className={`mc-dept-pill ${activeDept === dept.id ? "mc-dept-pill-active" : ""}`}
          >
            <span>{dept.emoji}</span>
            {dept.label}
          </button>
        ))}
      </div>

      {/* ── Results ── */}
      <div className="mc-results">
        <div className="mc-results-header">
          <p className="mc-results-count">
            {loading
              ? "Loading doctors…"
              : <><strong>{filtered.length}</strong> doctor{filtered.length !== 1 ? "s" : ""} found</>
            }
          </p>
          {activeDept !== "all" && (
            <button className="mc-clear-filter" onClick={() => setActiveDept("all")}>
              {DEPARTMENTS.find(d => d.id === activeDept)?.emoji} {activeDept} ✕
            </button>
          )}
        </div>

        <div className="mc-cards-grid">
          {loading
            ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
              ? (
                <div className="mc-empty">
                  <FaUserMd className="mc-empty-icon" />
                  <h3>No doctors found</h3>
                  <p>Try a different search term or department filter.</p>
                </div>
              )
              : filtered.map(doc => <DoctorCard key={doc._id} doctor={doc} onBook={handleBooking} />)
          }
        </div>
      </div>

      {/* Booking modal */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onConfirm={handleConfirm}
        />
      )}

      {/* Unavailable Doctor Pop-up Modal */}
      {unavailableDoctor && (
        <div className="mc-modal-overlay" onClick={() => setUnavailableDoctor(null)} style={{
          position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px"
        }}>
          <div className="mc-modal" onClick={e => e.stopPropagation()} style={{
            maxWidth: "420px", width: "100%", background: "#FFFFFF", borderRadius: "20px", padding: "28px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", textAlign: "center"
          }}>
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
              Dr. {unavailableDoctor.name} ({unavailableDoctor.specialization || "Specialist"})
            </p>
            <p style={{ margin: "0 0 24px 0", color: "#64748B", fontSize: "0.9rem", lineHeight: "1.5" }}>
              This doctor currently has no available dates or remaining time slots posted. Please check back later or choose another specialist.
            </p>
            <button
              type="button"
              onClick={() => setUnavailableDoctor(null)}
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

      {/* ── All styles (theme-aware via CSS variables) ── */}
      <style>{`
        /* Page */
        .mc-page {
          min-height: 100%;
          background: var(--content-bg, #F8FAFC);
          font-family: 'Inter', 'Poppins', sans-serif;
          border-radius: 16px;
          overflow: hidden;
        }

        /* Header */
        .mc-header {
          background: linear-gradient(135deg, #0A58A3 0%, #00A89E 100%);
          padding: 32px 32px 28px;
        }
        .mc-header-inner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 24px;
        }
        .mc-title {
          margin: 0;
          font-size: 1.9rem;
          font-weight: 800;
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          background: none !important;
          letter-spacing: -0.5px;
        }
        .mc-subtitle {
          margin: 6px 0 0;
          color: rgba(255,255,255,0.82);
          font-size: 0.93rem;
        }

        /* Stats strip */
        .mc-stats-strip {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .mc-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          padding: 10px 18px;
          min-width: 70px;
          backdrop-filter: blur(6px);
        }
        .mc-stat-icon { color: #fff; font-size: 1rem; margin-bottom: 2px; }
        .mc-stat-value { color: #fff; font-size: 1.1rem; font-weight: 800; }
        .mc-stat-label { color: rgba(255,255,255,0.75); font-size: 0.72rem; font-weight: 600; }

        /* Search bar */
        .mc-search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--card-bg, #fff);
          border-radius: 12px;
          padding: 10px 14px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
        }
        .mc-search-icon { color: #9CA3AF; flex-shrink: 0; }
        .mc-search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.92rem;
          color: var(--text-primary, #111827);
          background: transparent;
          font-family: inherit;
        }
        .mc-search-clear {
          background: none; border: none; cursor: pointer;
          color: #9CA3AF; font-size: 1rem;
        }
        .mc-search-btn {
          background: linear-gradient(135deg, #0A58A3 0%, #00A89E 100%);
          color: #fff; border: none; border-radius: 8px;
          padding: 8px 20px; font-weight: 700; font-size: 0.85rem;
          cursor: pointer; white-space: nowrap;
        }

        /* Department pills */
        .mc-dept-bar {
          background: var(--card-bg, #fff);
          padding: 16px 32px;
          border-bottom: 1px solid var(--card-border, #E5E7EB);
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .mc-dept-bar::-webkit-scrollbar { display: none; }
        .mc-dept-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 24px; flex-shrink: 0;
          border: 1.5px solid var(--card-border, #E5E7EB);
          background: var(--card-bg, #fff);
          color: var(--text-primary, #374151);
          font-weight: 600; font-size: 0.82rem; cursor: pointer;
          transition: all 0.18s;
        }
        .mc-dept-pill:hover {
          border-color: #0A58A3;
          color: #0A58A3;
        }
        .mc-dept-pill-active {
          background: linear-gradient(135deg, #0A58A3 0%, #00A89E 100%) !important;
          color: #fff !important;
          border-color: transparent !important;
          box-shadow: 0 2px 10px rgba(10,88,163,0.28);
        }

        /* Results */
        .mc-results { padding: 24px 32px; }
        .mc-results-header {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 20px;
        }
        .mc-results-count {
          margin: 0;
          color: var(--text-secondary, #6B7280);
          font-size: 0.88rem;
        }
        .mc-results-count strong { color: var(--text-primary, #111827); }
        .mc-clear-filter {
          background: rgba(10,88,163,0.08); color: #0A58A3;
          border: none; border-radius: 20px; padding: 5px 14px;
          font-size: 0.8rem; font-weight: 600; cursor: pointer;
        }

        /* Cards grid */
        .mc-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        /* Doctor card */
        .mc-doctor-card {
          background: var(--card-bg, #ffffff);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid var(--card-border, #E5E7EB);
          transition: box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease;
        }
        .mc-doctor-card:hover {
          box-shadow: 0 8px 32px rgba(10,88,163,0.13);
          transform: translateY(-3px);
          border-color: #BFDBFE;
        }
        .mc-doctor-name {
          margin: 0;
          font-size: 0.97rem;
          font-weight: 700;
          color: var(--text-primary, #111827);
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mc-spec-badge {
          display: inline-block; margin-top: 4px;
          background: rgba(10,88,163,0.09); color: #0A58A3;
          font-size: 0.72rem; font-weight: 700;
          padding: 2px 10px; border-radius: 20px;
        }
        .mc-heart-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted, #D1D5DB);
          font-size: 1.1rem; padding: 2px;
          transition: color 0.2s, transform 0.15s;
          flex-shrink: 0;
          display: flex; align-items: center;
        }
        .mc-heart-btn:hover { transform: scale(1.2); }
        .mc-heart-active {
          fill: #EF4444 !important;
          color: #EF4444 !important;
        }
        .mc-rating-text {
          font-size: 0.74rem;
          color: var(--text-muted, #6B7280);
          margin-left: 4px;
        }

        /* Detail rows */
        .mc-detail-section {
          border-top: 1px solid var(--card-border, #F3F4F6);
          padding-top: 14px;
          display: flex; flex-direction: column; gap: 9px;
        }
        .mc-detail-row {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 0.82rem;
        }
        .mc-detail-icon {
          color: #0A58A3; flex-shrink: 0;
          margin-top: 2px; font-size: 0.85rem;
        }
        .mc-detail-label {
          display: block;
          font-size: 0.72rem;
          color: var(--text-muted, #9CA3AF);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .mc-detail-value {
          color: var(--text-secondary, #4B5563);
          font-weight: 500;
        }

        /* Card footer */
        .mc-card-footer {
          margin-top: 16px;
          display: flex; align-items: center;
          gap: 10px; flex-wrap: wrap;
        }
        .mc-avail-badge {
          display: flex; align-items: center; gap: 5px;
          background: var(--content-bg, #F0FDF4);
          border: 1px solid #BBF7D0;
          border-radius: 8px; padding: 5px 11px;
          font-size: 0.77rem; color: #16A34A; font-weight: 700;
        }
        .mc-avail-today {
          background: #FFF7ED !important;
          border-color: #FED7AA !important;
          color: #EA580C !important;
        }
        .mc-video-btn {
          display: flex; align-items: center; justify-content: center;
          background: rgba(10,88,163,0.07);
          border: 1.5px solid #0A58A3; color: #0A58A3;
          border-radius: 8px; padding: 7px 10px;
          font-size: 0.78rem; cursor: pointer;
          transition: background 0.18s;
        }
        .mc-video-btn:hover { background: rgba(10,88,163,0.15); }
        .mc-book-btn {
          margin-left: auto;
          background: linear-gradient(135deg, #FACC15 0%, #F59E0B 100%);
          color: #422006; border: none; border-radius: 8px;
          padding: 8px 16px; font-size: 0.82rem; font-weight: 700;
          cursor: pointer; box-shadow: 0 2px 10px rgba(245,158,11,0.28);
          transition: opacity 0.18s, transform 0.15s;
          white-space: nowrap;
        }
        .mc-book-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        /* Empty state */
        .mc-empty {
          grid-column: 1 / -1;
          text-align: center; padding: 60px 20px;
          color: var(--text-muted, #6B7280);
        }
        .mc-empty-icon {
          font-size: 3rem; color: var(--card-border, #D1D5DB);
          margin-bottom: 16px;
        }
        .mc-empty h3 { margin: 0 0 8px; color: var(--text-primary, #374151); }
        .mc-empty p  { margin: 0; font-size: 0.9rem; }

        /* Skeleton */
        .mc-skeleton-card {
          background: var(--card-bg, #fff);
          border-radius: 16px; padding: 24px;
          border: 1px solid var(--card-border, #E5E7EB);
          animation: mc-pulse 1.5s ease-in-out infinite;
        }
        .mc-skel-box {
          background: var(--card-border, #F3F4F6);
          border-radius: 6px;
        }
        @keyframes mc-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .mc-header { padding: 24px 16px 20px; }
          .mc-dept-bar { padding: 12px 16px; }
          .mc-results { padding: 16px; }
          .mc-cards-grid { grid-template-columns: 1fr; }
          .mc-header-inner { flex-direction: column; }
          .mc-stats-strip { gap: 10px; }
        }

        /* ── Booking modal ── */
        .mc-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: mc-fade-in 0.18s ease;
        }
        @keyframes mc-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .mc-modal {
          background: var(--card-bg, #fff);
          border-radius: 20px;
          width: 100%; max-width: 460px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.22);
          overflow: hidden;
          animation: mc-slide-up 0.22s ease;
        }
        @keyframes mc-slide-up {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .mc-modal-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 24px 24px 0;
        }
        .mc-modal-title {
          margin: 0; font-size: 1.25rem; font-weight: 800;
          color: var(--text-primary, #111827);
        }
        .mc-modal-sub {
          margin: 4px 0 0; font-size: 0.85rem;
          color: var(--text-muted, #6B7280);
        }
        .mc-modal-close {
          background: var(--content-bg, #F3F4F6);
          border: none; border-radius: 8px;
          padding: 6px; cursor: pointer;
          color: var(--text-muted, #6B7280);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .mc-modal-close:hover { background: #E5E7EB; }
        .mc-modal-body { padding: 20px 24px 24px; }
        .mc-modal-label {
          display: block; font-size: 0.82rem; font-weight: 700;
          color: var(--text-secondary, #374151);
          text-transform: uppercase; letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .mc-modal-input {
          width: 100%; box-sizing: border-box;
          padding: 12px 14px;
          border: 1.5px solid var(--card-border, #E5E7EB);
          border-radius: 10px;
          font-size: 0.95rem; font-family: inherit;
          color: var(--text-primary, #111827);
          background: var(--content-bg, #F8FAFC);
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .mc-modal-input:focus {
          border-color: #0A58A3;
          box-shadow: 0 0 0 3px rgba(10,88,163,0.12);
          background: var(--card-bg, #fff);
        }
        .mc-modal-hint {
          margin: 5px 0 0; font-size: 0.75rem;
          color: var(--text-muted, #9CA3AF);
          text-align: right;
        }
        .mc-modal-actions {
          display: flex; gap: 10px; justify-content: flex-end;
          margin-top: 20px;
        }
        .mc-modal-cancel {
          background: var(--content-bg, #F3F4F6);
          border: none; border-radius: 8px;
          padding: 10px 20px; font-size: 0.88rem; font-weight: 600;
          color: var(--text-secondary, #374151);
          cursor: pointer; transition: background 0.15s;
        }
        .mc-modal-cancel:hover { background: #E5E7EB; }
        .mc-book-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }
        .mc-modal-success {
          padding: 48px 24px;
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
        }
      `}</style>
    </div>
  );
}
