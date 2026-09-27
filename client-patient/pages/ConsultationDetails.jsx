import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import {
  FiArrowLeft, FiCalendar, FiUser, FiInfo, FiFileText,
  FiActivity, FiCreditCard, FiPackage, FiClock, FiDownload, FiEye, FiCheck
} from "react-icons/fi";
import { FaStethoscope, FaFlask, FaQrcode } from "react-icons/fa";

const empty = "Not recorded yet";

function getId(value) {
  return typeof value === "object" ? value?._id : value;
}

function getDateTime(value) {
  if (!value) return { date: empty, time: empty };
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime()) && /T|GMT|Z/.test(String(value))) {
    return {
      date: parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: parsed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    };
  }
  const [datePart, timePart] = String(value).split(" at ");
  return { date: datePart || String(value), time: timePart || empty };
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function Field({ label, value }) {
  return (
    <div className="consult-field">
      <span>{label}</span>
      <strong>{value || empty}</strong>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <section className="consult-section">
      <div className="consult-section-head">
        <h2>{icon} {title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatusPill({ children, tone = "pending" }) {
  return <span className={`consult-pill consult-pill-${tone}`}>{children}</span>;
}

export default function ConsultationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  async function fetchDetails() {
    try {
      setError("");
      const appointmentData = await api.get(`/appointments/${id}`);
      
      const patientId = getId(appointmentData.patientId);
      const linkedUserId = appointmentData.patientId?.userId;
      const allowedIds = [currentUser?.patientId, currentUser?._id, currentUser?.id, currentUser?.uid].filter(Boolean).map(String);

      if (allowedIds.length && !allowedIds.includes(String(patientId)) && linkedUserId && !allowedIds.includes(String(linkedUserId))) {
        setError("You can only view your own consultation.");
        return;
      }

      setAppointment(appointmentData);

      const [prescriptionData, labData, billData] = await Promise.all([
        api.get("/prescriptions").catch(() => []),
        api.get("/labs").catch(() => []),
        api.get("/bills").catch(() => [])
      ]);

      setPrescriptions((Array.isArray(prescriptionData) ? prescriptionData : []).filter((item) => {
        return String(getId(item.appointmentId)) === String(id);
      }));
      setLabReports((Array.isArray(labData) ? labData : []).filter((item) => {
        return String(getId(item.appointmentId)) === String(id);
      }));
      setBills((Array.isArray(billData) ? billData : []).filter((item) => String(getId(item.patientId)) === String(patientId)));
    } catch (err) {
      console.error("Failed to fetch consultation:", err);
      setError("Unable to load consultation details. It may have been deleted.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetails();
    window.handlePayPrescription = async (prescId) => {
      try {
        await api.put(`/prescriptions/${prescId}/pay`);
        fetchDetails();
        alert("Prescription payment successful!");
      } catch (err) {
        console.error("Payment failed:", err);
      }
    };
  }, [id, currentUser]);

  async function handleSimulatePayment() {
    try {
      setSimulatingPayment(true);
      await api.put(`/appointments/${id}`, {
        consultationFeePaid: true,
        timelineEvent: { label: "Payment Completed", by: "Patient (via portal)", role: "System" }
      });
      await fetchDetails();
    } catch (err) {
      alert("Payment failed");
    } finally {
      setSimulatingPayment(false);
    }
  }

  const appointmentDateTime = useMemo(() => getDateTime(appointment?.date), [appointment]);
  const patient = appointment?.patientId || {};
  const doctor = appointment?.doctorId || {};
  const isCancelled = appointment?.status === "Cancelled";
  
  const medicineCost = prescriptions.reduce((sum, p) => sum + Number(p.price || 0), 0);
  const consultationFee = appointment?.consultationFee || 0;
  const totalAmount = consultationFee + medicineCost;
  const paymentStatus = appointment?.consultationFeePaid ? "Paid" : "Pending";
  const isFinalizedRx = prescriptions.some(p => p.isFinalized);

  const timeline = useMemo(() => {
    if (!appointment) return [];
    let events = appointment.timeline || [];
    
    if (events.length === 0) {
      events = [
        { label: "Appointment Booked", at: appointment.createdAt, by: patient.name || "Patient", role: "Patient" },
        appointment.consultationFeePaid && { label: "Payment Completed", at: appointment.updatedAt, by: "Billing", role: "Receptionist" },
        appointment.notes && { label: "Doctor Consultation Updated", at: appointment.updatedAt, by: doctor.name || "Doctor", role: "Doctor" },
        ...prescriptions.map((p) => ({ label: "Prescription Created", at: p.createdAt, by: p.doctorId?.name || doctor.name || "Doctor", role: "Doctor" })),
        ...labReports.map((l) => ({ label: `Lab Test ${l.status}`, at: l.updatedAt || l.createdAt, by: "Lab Technician", role: "Lab Technician" })),
        appointment.status === "Completed" && { label: "Consultation Completed", at: appointment.updatedAt, by: doctor.name || "Staff", role: "Care Team" }
      ].filter(Boolean);
    }
    
    return events.sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
  }, [appointment, prescriptions, labReports]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading consultation details...</div>;
  }

  if (error || !appointment) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#EF4444" }}>
        <h2>Error</h2>
        <p>{error || "Consultation not found."}</p>
        <button className="btn-secondary" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
          <FiArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="consult-page">
      <button className="consult-back" onClick={() => navigate(-1)}>
        <FiArrowLeft /> Back
      </button>

      {isCancelled ? (
        <div className="consult-cancelled">
          <FiInfo size={48} />
          <h1>Appointment Cancelled</h1>
          <p>This appointment request was not approved and has been cancelled.</p>
        </div>
      ) : (
        <>
          <header className="consult-hero">
            <div>
              <StatusPill tone={paymentStatus === "Paid" ? "paid" : "pending"}>{paymentStatus}</StatusPill>
              <h1>Consultation View</h1>
              <p><FiCalendar /> {appointment.date}</p>
            </div>
            <StatusPill tone={["Completed", "Approved"].includes(appointment.status) ? "paid" : "pending"}>
              {appointment.status}
            </StatusPill>
          </header>

          <div className="consult-grid">
            <Section icon={<FiUser />} title="Patient Information">
              <div className="consult-fields">
                <Field label="Patient ID" value={getId(patient)} />
                <Field label="Name" value={patient.name} />
                <Field label="Age" value={patient.age ? `${patient.age} yrs` : ""} />
                <Field label="Gender" value={patient.gender} />
                <Field label="Phone" value={patient.phone || patient.contact} />
                <Field label="Address" value={patient.address} />
                <Field label="Blood Group" value={patient.bloodGroup} />
                <Field label="Allergies" value={patient.allergies} />
                <Field label="Emergency Contact" value={patient.emergencyContact} />
              </div>
            </Section>

            <Section icon={<FaStethoscope />} title="Appointment Details">
              <div className="consult-fields">
                <Field label="Appointment ID" value={appointment._id} />
                <Field label="Date" value={appointmentDateTime.date} />
                <Field label="Time" value={appointmentDateTime.time} />
                <Field label="Department" value={doctor.specialization} />
                <Field label="Doctor" value={doctor.name ? `Dr. ${doctor.name}` : ""} />
                <Field label="Consultation Type" value={appointment.reason?.startsWith("OP:") ? "Walk-in OP" : "Online Appointment"} />
                <Field label="Token Number" value={appointment.token} />
                <Field label="Appointment Status" value={appointment.status} />
              </div>
            </Section>
          </div>

          <Section icon={<FiActivity />} title="Vitals">
            <div className="consult-fields vitals">
              <Field label="Height" value={appointment.height} />
              <Field label="Weight" value={appointment.weight} />
              <Field label="BMI" value={appointment.bmi} />
              <Field label="Blood Pressure" value={appointment.bloodPressure} />
              <Field label="Pulse" value={appointment.pulse} />
              <Field label="Temperature" value={appointment.temperature} />
              <Field label="Oxygen Saturation" value={appointment.oxygenSaturation} />
              <Field label="Sugar Level" value={appointment.sugarLevel} />
            </div>
          </Section>

          <div className="consult-grid">
            <Section icon={<FiFileText />} title="Symptoms">
              <p className="consult-copy">{appointment.reason || empty}</p>
            </Section>
            <Section icon={<FiFileText />} title="Medical History">
              <p className="consult-copy">{patient.medicalHistory || appointment.medicalHistory || empty}</p>
            </Section>
          </div>

          <Section icon={<FiFileText />} title="Diagnosis & Notes">
            <div>
              <strong style={{display: 'block', marginBottom: 4}}>Diagnosis</strong>
              <p className="consult-copy prewrap">{appointment.notes || empty}</p>
              <strong style={{display: 'block', marginTop: 12, marginBottom: 4}}>Follow-up Instructions</strong>
              <p className="consult-copy prewrap">{appointment.followUpInstructions || empty}</p>
            </div>
          </Section>

          <Section icon={<FiFileText />} title="Prescription">
            {prescriptions.length ? prescriptions.map((prescription) => (
              <div className="consult-list-item" key={prescription._id}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{prescription.prescriptionNumber ? prescription.prescriptionNumber : `Draft Rx ${String(prescription._id).slice(-6)}`}</strong>
                    <div>
                      {prescription.paymentStatus === "Paid" ? (
                        <StatusPill tone="paid">Paid</StatusPill>
                      ) : (
                        <StatusPill tone="pending">Unpaid</StatusPill>
                      )}
                      {prescription.paymentStatus !== "Paid" && (
                        <button 
                          onClick={() => {
                            const printWindow = window.open("", "_blank", "width=400,height=550");
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Scan & Pay Prescription</title>
                                  <style>
                                    body { background: #111827; color: #fff; font-family: sans-serif; text-align: center; padding: 24px; }
                                    img { width: 100%; max-width: 300px; border-radius: 12px; margin: 16px 0; border: 1px solid #374151; }
                                    .btn { background: #10B981; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 12px; width: 100%; }
                                  </style>
                                </head>
                                <body>
                                  <h2>💳 Pay Prescription</h2>
                                  <h1 style="color: #10B981;">₹${prescription.price || 25}</h1>
                                  <p>Scan with PhonePe / GooglePay</p>
                                  <div style="background:#fff;padding:10px;display:inline-block;border-radius:12px;">
                                    <img src="/assets/qr_matrix.png" onerror="this.style.display='none';" />
                                  </div>
                                  <button class="btn" onclick="window.opener.handlePayPrescription('${prescription._id}'); window.close();">Confirm Payment ✓</button>
                                </body>
                              </html>
                            `);
                          }}
                          style={{ marginLeft: 10, background: '#10B981', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}
                        >
                          Pay ₹{prescription.price || 25}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="prewrap">{prescription.medicines}</p>
                  <small>{prescription.notes || "No special instructions"}</small>
                </div>
              </div>
            )) : <p className="consult-copy">{empty}</p>}
          </Section>

          <Section icon={<FaFlask />} title="Ordered Lab Tests">
            {labReports.length ? labReports.map((report) => (
              <div className="consult-list-item lab-row" key={report._id}>
                <div>
                  <strong>{report.testName}</strong>
                  <p>{report.category || "Lab"} - <StatusPill tone={report.status === "Completed" ? "paid" : "pending"}>{report.status}</StatusPill></p>
                  <small className="prewrap">{report.results || "No completion notes yet."}</small>
                  {report.reportFileUrl && (
                    <div className="consult-actions">
                      <a href={report.reportFileUrl} target="_blank" rel="noreferrer"><FiEye /> Preview</a>
                      <a href={report.reportFileUrl} download><FiDownload /> Download</a>
                    </div>
                  )}
                </div>
              </div>
            )) : <p className="consult-copy">{empty}</p>}
          </Section>

          <div className="consult-grid">
            <Section icon={<FiCreditCard />} title="Billing">
              <div className="consult-fields">
                <Field label="Consultation Fee" value={money(consultationFee)} />
                <Field label="Medicine Cost" value={money(medicineCost)} />
                <Field label="Total Amount" value={money(totalAmount)} />
                <Field label="Payment Status" value={paymentStatus} />
              </div>
              
              {isFinalizedRx && paymentStatus !== "Paid" && (
                <div className="qr-box">
                  <FaQrcode size={64} style={{ color: '#0A58A3', marginBottom: 10 }} />
                  <p style={{ margin: 0 }}>Scan to pay Total Amount</p>
                  <button className="consult-primary" onClick={handleSimulatePayment} disabled={simulatingPayment} style={{marginTop: 15, width: '100%', justifyContent: 'center'}}>
                    {simulatingPayment ? "Processing..." : "Pay Now (Mock)"}
                  </button>
                </div>
              )}
            </Section>

            <Section icon={<FiPackage />} title="Pharmacy Status">
              <p className="consult-copy">
                {paymentStatus === "Paid" 
                  ? (appointment.medicineDispensed ? "Medicine dispensed." : "Payment completed. Medicine is ready to be dispensed by pharmacy.") 
                  : "Medicine cannot be dispensed until payment is completed."}
              </p>
              <Field label="Medicine Status" value={appointment.medicineDispensed ? "Dispensed" : (paymentStatus === "Paid" ? "Ready for dispensing" : "Blocked by pending payment")} />
              
              {appointment.medicineDispensed && (
                <>
                  <Field label="Dispensed By" value={appointment.dispensedBy} />
                  <Field label="Dispensed Date/Time" value={getDateTime(appointment.dispensedAt).date + " " + getDateTime(appointment.dispensedAt).time} />
                </>
              )}
            </Section>
          </div>

          <Section icon={<FiClock />} title="Consultation Timeline">
            <div className="timeline">
              {timeline.map((event, index) => {
                const dt = getDateTime(event.at);
                return (
                  <div className="timeline-item" key={`${event.label}-${index}`}>
                    <span />
                    <div>
                      <strong>{event.label}</strong>
                      <p>{dt.date} {dt.time !== empty ? `at ${dt.time}` : ""}</p>
                      <small>{event.by} - {event.role}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </>
      )}

      <style>{`
        .consult-page { padding: 32px; max-width: 1180px; margin: 0 auto; font-family: 'Inter', sans-serif; color: var(--text-primary, #111827); }
        .consult-back { background: none; border: none; color: var(--text-muted, #6B7280); display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 24px; font-size: .95rem; font-weight: 600; }
        .consult-hero, .consult-section, .consult-cancelled { background: var(--card-bg, #fff); border: 1px solid var(--card-border, #E5E7EB); border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.03); }
        .consult-hero { padding: 28px; display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 20px; }
        .consult-hero h1 { margin: 10px 0 6px; font-size: 1.8rem; }
        .consult-hero p { margin: 0; display: flex; align-items: center; gap: 6px; color: var(--text-muted, #6B7280); }
        .consult-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
        .consult-section { padding: 22px; margin-bottom: 20px; }
        .consult-section-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--card-border, #E5E7EB); padding-bottom: 12px; }
        .consult-section h2 { margin: 0; font-size: 1.05rem; display: flex; align-items: center; gap: 8px; color: var(--text-primary, #374151); }
        .consult-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .consult-fields.vitals { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .consult-field { background: var(--content-bg, #F8FAFC); border: 1px solid var(--card-border, #E5E7EB); border-radius: 10px; padding: 12px; min-width: 0; }
        .consult-field span { display: block; color: var(--text-muted, #6B7280); font-size: .74rem; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
        .consult-field strong { display: block; overflow-wrap: anywhere; font-size: .92rem; }
        .consult-copy { margin: 0; color: var(--text-primary, #4B5563); line-height: 1.6; }
        .prewrap { white-space: pre-wrap; }
        .consult-pill { display: inline-flex; padding: 5px 12px; border-radius: 999px; font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; margin-left: 10px; }
        .consult-pill-paid { background: rgba(16,185,129,.14); color: #059669; }
        .consult-pill-pending { background: rgba(245,158,11,.14); color: #D97706; }
        .consult-primary, .consult-secondary { border: none; border-radius: 8px; padding: 8px 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .consult-primary { background: #0A58A3; color: #fff; }
        .consult-secondary { background: transparent; color: var(--text-muted, #6B7280); border: 1px solid var(--card-border, #E5E7EB); }
        .consult-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .consult-list-item { display: flex; justify-content: space-between; gap: 16px; padding: 14px; border: 1px solid var(--card-border, #E5E7EB); border-radius: 12px; background: var(--content-bg, #F8FAFC); margin-bottom: 10px; }
        .lab-row { align-items: flex-start; }
        .consult-actions { display: flex; gap: 10px; margin-top: 8px; }
        .consult-actions a { color: #0A58A3; font-weight: 700; text-decoration: none; display: inline-flex; gap: 5px; align-items: center; }
        .qr-box { margin-top: 14px; border: 1px dashed var(--card-border, #CBD5E1); border-radius: 12px; padding: 18px; text-align: center; color: var(--text-muted, #64748B); font-weight: 700; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #F8FAFC; }
        .timeline { position: relative; display: flex; flex-direction: column; gap: 14px; }
        .timeline-item { display: grid; grid-template-columns: 18px 1fr; gap: 12px; }
        .timeline-item > span { width: 12px; height: 12px; background: #0A58A3; border-radius: 50%; margin-top: 5px; box-shadow: 0 0 0 4px rgba(10,88,163,.1); }
        .timeline-item p { margin: 3px 0; color: var(--text-muted, #6B7280); font-size: 0.9rem; }
        .timeline-item small { color: var(--text-muted, #64748B); font-size: 0.8rem; }
        .consult-cancelled { padding: 40px; text-align: center; color: #EF4444; }
        .consult-cancelled p { color: var(--text-primary, #374151); }
        @media (max-width: 820px) {
          .consult-page { padding: 18px; }
          .consult-grid, .consult-fields, .consult-fields.vitals { grid-template-columns: 1fr; }
          .consult-list-item { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
