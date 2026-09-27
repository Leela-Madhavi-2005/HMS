import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import {
  FiArrowLeft, FiCalendar, FiUser, FiInfo, FiFileText, FiSave,
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

function Section({ icon, title, children, action }) {
  return (
    <section className="consult-section">
      <div className="consult-section-head">
        <h2>{icon} {title}</h2>
        {action}
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
  const { currentUser, userRole } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Vitals State
  const [editingVitals, setEditingVitals] = useState(false);
  const [vitalsInput, setVitalsInput] = useState({});
  const [savingVitals, setSavingVitals] = useState(false);

  // Clinical Notes State
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [followUpInput, setFollowUpInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  
  // Prescription State
  const [showRxForm, setShowRxForm] = useState(false);
  const [rxInput, setRxInput] = useState({ medicines: "", notes: "", price: 25 });
  const [savingRx, setSavingRx] = useState(false);
  
  // Edit Prescription State
  const [editPrescId, setEditPrescId] = useState(null);
  const [editRxInput, setEditRxInput] = useState({ medicines: "", notes: "", price: 25 });
  const [updatingRx, setUpdatingRx] = useState(false);

  // Lab Drafts
  const [labDrafts, setLabDrafts] = useState({});
  const [showLabForm, setShowLabForm] = useState(false);
  const [labInput, setLabInput] = useState({ testName: "", category: "Blood" });
  
  // Payment Simulation
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  // Pharmacy
  const [dispensing, setDispensing] = useState(false);

  async function fetchDetails() {
    try {
      setError("");
      const appointmentData = await api.get(`/appointments/${id}`);
      setAppointment(appointmentData);
      setNotesInput(appointmentData.notes || "");
      setFollowUpInput(appointmentData.followUpInstructions || "");
      setVitalsInput({
        height: appointmentData.height || "", weight: appointmentData.weight || "", bmi: appointmentData.bmi || "",
        bloodPressure: appointmentData.bloodPressure || "", pulse: appointmentData.pulse || "", temperature: appointmentData.temperature || "",
        oxygenSaturation: appointmentData.oxygenSaturation || "", sugarLevel: appointmentData.sugarLevel || ""
      });

      const [prescriptionData, labData, billData] = await Promise.all([
        api.get("/prescriptions").catch(() => []),
        api.get("/labs").catch(() => []),
        api.get("/bills").catch(() => [])
      ]);

      const patientId = getId(appointmentData.patientId);
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
  }, [id]);

  async function handleSaveVitals() {
    try {
      setSavingVitals(true);
      const data = await api.put(`/appointments/${id}`, { 
        ...vitalsInput,
        timelineEvent: { label: "Vitals Recorded", by: currentUser.name || "Nurse", role: userRole === "doctor" ? "Doctor" : "Nurse" }
      });
      setAppointment(data);
      setEditingVitals(false);
    } catch (err) {
      alert("Error saving vitals");
    } finally {
      setSavingVitals(false);
    }
  }

  async function handleSaveNotes() {
    try {
      setSavingNotes(true);
      const data = await api.put(`/appointments/${id}`, { 
        notes: notesInput, 
        followUpInstructions: followUpInput,
        timelineEvent: { label: "Diagnosis Added", by: currentUser.name || "Doctor", role: "Doctor" }
      });
      setAppointment(data);
      setEditingNotes(false);
    } catch (err) {
      alert("Error saving diagnosis");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleCreatePrescription(finalize) {
    if (!rxInput.medicines) return alert("Medicines cannot be empty");
    try {
      setSavingRx(true);
      await api.post("/prescriptions", {
        patientId: getId(appointment.patientId),
        doctorId: getId(appointment.doctorId),
        appointmentId: id,
        medicines: rxInput.medicines,
        notes: rxInput.notes,
        price: rxInput.price,
        isFinalized: finalize
      });
      
      // Update timeline on the appointment
      await api.put(`/appointments/${id}`, {
        timelineEvent: { label: "Prescription Finalized", by: currentUser.name || "Doctor", role: "Doctor" }
      });

      setShowRxForm(false);
      setRxInput({ medicines: "", notes: "", price: 25 });
    } catch (err) {
      console.error("Prescription creation failed", err);
      alert("Failed to save prescription.");
    } finally {
      setSavingRx(false);
    }
  }

  async function handleUpdatePrescription(prescId, isFinalized) {
    if (!editRxInput.medicines) return;
    try {
      setUpdatingRx(true);
      await api.put(`/prescriptions/${prescId}`, {
        ...editRxInput,
        isFinalized
      });
      setEditPrescId(null);
      fetchDetails();
      alert(isFinalized ? "Prescription finalized!" : "Draft saved successfully.");
    } catch (err) {
      console.error("Prescription update failed", err);
      alert("Failed to update prescription.");
    } finally {
      setUpdatingRx(false);
    }
  }

  async function handleCreateLabTest() {
    if (!labInput.testName) return alert("Test name is required");
    try {
      await api.post("/labs", {
        patientId: getId(appointment.patientId),
        doctorId: getId(appointment.doctorId),
        appointmentId: id,
        testName: labInput.testName,
        category: labInput.category
      });
      // Update timeline
      await api.put(`/appointments/${id}`, {
        timelineEvent: { label: "Lab Tests Ordered", by: currentUser.name || "Doctor", role: "Doctor" }
      });
      setShowLabForm(false);
      setLabInput({ testName: "", category: "Blood" });
      fetchDetails();
    } catch (err) {
      alert("Failed to order lab test");
    }
  }

  async function handleUpdateLab(reportId) {
    const draft = labDrafts[reportId] || {};
    try {
      await api.put(`/labs/${reportId}`, {
        status: draft.status,
        results: draft.results,
        reportFileUrl: draft.reportFileUrl
      });
      await api.put(`/appointments/${id}`, {
        timelineEvent: { label: "Lab Report Uploaded", by: currentUser.name || "Lab Technician", role: "Lab Technician" }
      });
      await fetchDetails();
      alert("Lab report updated.");
    } catch (err) {
      alert("Unable to update lab report.");
    }
  }

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

  async function handleDispense() {
    try {
      setDispensing(true);
      await api.put(`/appointments/${id}`, {
        medicineDispensed: true,
        dispensedBy: currentUser.name || "Pharmacist",
        dispensedAt: new Date(),
        timelineEvent: { label: "Medicine Dispensed", by: currentUser.name || "Pharmacist", role: "Pharmacist" }
      });
      await fetchDetails();
    } catch (err) {
      alert("Failed to dispense medicine");
    } finally {
      setDispensing(false);
    }
  }

  const appointmentDateTime = useMemo(() => getDateTime(appointment?.date), [appointment]);
  const patient = appointment?.patientId || {};
  const doctor = appointment?.doctorId || {};
  const isCancelled = appointment?.status === "Cancelled";
  const doctorId = getId(appointment?.doctorId);
  
  // Permissions
  const isAssignedDoctor = userRole === "doctor" && String(doctorId) === String(currentUser?.doctorId || currentUser?._id);
  const canEditClinical = isAssignedDoctor;
  const canEditVitals = userRole === "nurse" || userRole === "doctor" || userRole === "admin";
  const canEditLab = userRole === "lab_technician" || userRole === "admin";
  const canEditPharmacy = userRole === "pharmacist" || userRole === "admin";
  const canViewAudit = userRole === "admin";
  
  const medicineCost = prescriptions.reduce((sum, p) => sum + Number(p.price || 0), 0);
  const consultationFee = appointment?.consultationFee || 0;
  const totalAmount = consultationFee + medicineCost;
  const paymentStatus = appointment?.consultationFeePaid ? "Paid" : "Pending";
  const isFinalizedRx = prescriptions.some(p => p.isFinalized);

  const timeline = useMemo(() => {
    if (!appointment) return [];
    let events = appointment.timeline || [];
    
    // In case there are no timeline events from new system, we fake the basic ones
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

          <Section 
            icon={<FiActivity />} 
            title="Vitals"
            action={canEditVitals && !editingVitals && (
              <button className="consult-primary" onClick={() => setEditingVitals(true)}>Record Vitals</button>
            )}
          >
            {editingVitals ? (
              <div className="consult-editor">
                <div className="consult-fields vitals">
                  {["height", "weight", "bmi", "bloodPressure", "pulse", "temperature", "oxygenSaturation", "sugarLevel"].map(key => (
                    <div key={key}>
                      <small style={{display: 'block', marginBottom: 4, textTransform: 'capitalize'}}>{key.replace(/([A-Z])/g, ' $1')}</small>
                      <input 
                        type="text" 
                        value={vitalsInput[key]} 
                        onChange={(e) => setVitalsInput(prev => ({...prev, [key]: e.target.value}))} 
                        placeholder={key}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <button className="consult-secondary" onClick={() => setEditingVitals(false)}>Cancel</button>
                  <button className="consult-primary" onClick={handleSaveVitals} disabled={savingVitals}>
                    <FiSave /> Save Vitals
                  </button>
                </div>
              </div>
            ) : (
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
            )}
          </Section>

          <div className="consult-grid">
            <Section icon={<FiFileText />} title="Symptoms">
              <p className="consult-copy">{appointment.reason || empty}</p>
            </Section>
            <Section icon={<FiFileText />} title="Medical History">
              <p className="consult-copy">{patient.medicalHistory || appointment.medicalHistory || empty}</p>
            </Section>
          </div>

          <Section
            icon={<FiFileText />}
            title="Diagnosis & Notes"
            action={canEditClinical && !editingNotes && (
              <button className="consult-primary" onClick={() => setEditingNotes(true)}>Edit Diagnosis</button>
            )}
          >
            {editingNotes ? (
              <div className="consult-editor">
                <small style={{display: 'block', marginBottom: 4, fontWeight: 'bold'}}>Diagnosis</small>
                <textarea
                  value={notesInput}
                  onChange={(event) => setNotesInput(event.target.value)}
                  placeholder="Clinical diagnosis and notes..."
                  rows={4}
                />
                <small style={{display: 'block', margin: '10px 0 4px', fontWeight: 'bold'}}>Follow-up Instructions</small>
                <textarea
                  value={followUpInput}
                  onChange={(event) => setFollowUpInput(event.target.value)}
                  placeholder="Follow-up instructions for the patient..."
                  rows={2}
                />
                <div>
                  <button className="consult-secondary" onClick={() => { setEditingNotes(false); setNotesInput(appointment.notes || ""); }}>Cancel</button>
                  <button className="consult-primary" onClick={handleSaveNotes} disabled={savingNotes}>
                    <FiSave /> {savingNotes ? "Saving..." : "Save Diagnosis"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <strong style={{display: 'block', marginBottom: 4}}>Diagnosis</strong>
                <p className="consult-copy prewrap">{appointment.notes || empty}</p>
                <strong style={{display: 'block', marginTop: 12, marginBottom: 4}}>Follow-up Instructions</strong>
                <p className="consult-copy prewrap">{appointment.followUpInstructions || empty}</p>
              </div>
            )}
          </Section>

          <Section 
            icon={<FiFileText />} 
            title="Prescription"
            action={canEditClinical && !showRxForm && (
              <button className="consult-primary" onClick={() => setShowRxForm(true)}>+ Add Prescription</button>
            )}
          >
            {showRxForm && (
              <div className="consult-editor" style={{ marginBottom: 20, padding: 15, border: '1px solid #E5E7EB', borderRadius: 8 }}>
                <small style={{fontWeight: 'bold'}}>Medicines (Name, Strength, Dosage, Frequency, Duration, Qty)</small>
                <textarea
                  value={rxInput.medicines}
                  onChange={(e) => setRxInput(prev => ({...prev, medicines: e.target.value}))}
                  placeholder="e.g., Paracetamol 500mg - 1 tab - twice a day - 5 days - 10 tabs"
                  rows={4}
                />
                <small style={{fontWeight: 'bold', marginTop: 10, display: 'block'}}>Additional Notes</small>
                <input 
                  type="text" 
                  value={rxInput.notes} 
                  onChange={(e) => setRxInput(prev => ({...prev, notes: e.target.value}))} 
                  placeholder="Take after food..." 
                  style={{width: '100%', padding: 8, marginTop: 4}} 
                />
                <div style={{marginTop: 15}}>
                  <button className="consult-secondary" onClick={() => setShowRxForm(false)}>Cancel</button>
                  <button className="consult-primary" onClick={() => handleCreatePrescription(false)} disabled={savingRx}>
                    {savingRx ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="spinner" style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                        Adding...
                      </span>
                    ) : (
                      <><FiCheck /> Add</>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {prescriptions.length ? prescriptions.map((prescription) => (
              <div className="consult-list-item" key={prescription._id}>
                {editPrescId === prescription._id ? (
                  <div className="consult-editor" style={{ marginBottom: 10, padding: 15, border: '1px solid #E5E7EB', borderRadius: 8 }}>
                    <small style={{fontWeight: 'bold'}}>Medicines (Name, Strength, Dosage, Frequency, Duration, Qty)</small>
                    <textarea
                      value={editRxInput.medicines}
                      onChange={(e) => setEditRxInput(prev => ({...prev, medicines: e.target.value}))}
                      rows={4}
                    />
                    <small style={{fontWeight: 'bold', marginTop: 10, display: 'block'}}>Additional Notes</small>
                    <input 
                      type="text" 
                      value={editRxInput.notes} 
                      onChange={(e) => setEditRxInput(prev => ({...prev, notes: e.target.value}))} 
                      style={{width: '100%', padding: 8, marginTop: 4}} 
                    />
                    <div style={{marginTop: 15, display: 'flex', gap: 10}}>
                      <button className="consult-secondary" onClick={() => setEditPrescId(null)}>Cancel</button>
                      <button className="consult-primary" onClick={() => handleUpdatePrescription(prescription._id, false)} disabled={updatingRx}>
                        {updatingRx ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className="spinner" style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                            Saving...
                          </span>
                        ) : (
                          <><FiCheck /> Save</>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{prescription.prescriptionNumber ? prescription.prescriptionNumber : `Draft Rx ${String(prescription._id).slice(-6)}`}</strong>
                      <div>
                        {prescription.paymentStatus === "Paid" ? (
                          <StatusPill tone="paid">Paid</StatusPill>
                        ) : (
                          <StatusPill tone="pending">Unpaid</StatusPill>
                        )}
                        {canEditClinical && userRole === "doctor" && (
                          <button 
                            onClick={() => {
                              setEditPrescId(prescription._id);
                              setEditRxInput({ medicines: prescription.medicines, notes: prescription.notes || "", price: prescription.price || 25 });
                            }}
                            style={{ marginLeft: 10, background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Edit
                          </button>
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
                )}
              </div>
            )) : !showRxForm && <p className="consult-copy">{empty}</p>}
          </Section>

          <Section 
            icon={<FaFlask />} 
            title="Ordered Lab Tests"
            action={canEditClinical && (
              <button className="consult-primary" onClick={() => setShowLabForm(!showLabForm)}>+ Order Lab Test</button>
            )}
          >
            {showLabForm && (
              <div className="consult-editor" style={{ marginBottom: 20, padding: 15, border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                <input 
                  style={{flex: 1}}
                  value={labInput.testName}
                  onChange={(e) => setLabInput(prev => ({...prev, testName: e.target.value}))}
                  placeholder="Test Name (e.g., CBC, Blood Sugar)"
                />
                <select style={{padding: 8}} value={labInput.category} onChange={(e) => setLabInput(prev => ({...prev, category: e.target.value}))}>
                  <option>Blood</option>
                  <option>Urine</option>
                  <option>ECG</option>
                  <option>X-Ray</option>
                  <option>MRI</option>
                  <option>CT Scan</option>
                </select>
                <button className="consult-primary" onClick={handleCreateLabTest}>Order Test</button>
              </div>
            )}

            {labReports.length ? labReports.map((report) => {
              const draft = labDrafts[report._id] || {};
              return (
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
                  {canEditLab && (
                    <div className="lab-edit">
                      <select value={draft.status || report.status} onChange={(e) => setLabDrafts((prev) => ({ ...prev, [report._id]: { ...draft, status: e.target.value } }))}>
                        <option>Ordered</option>
                        <option>Sample Collected</option>
                        <option>Completed</option>
                      </select>
                      <input value={draft.reportFileUrl ?? report.reportFileUrl ?? ""} placeholder="Report file URL" onChange={(e) => setLabDrafts((prev) => ({ ...prev, [report._id]: { ...draft, reportFileUrl: e.target.value } }))} />
                      <textarea value={draft.results ?? report.results ?? ""} placeholder="Completion notes" rows={2} onChange={(e) => setLabDrafts((prev) => ({ ...prev, [report._id]: { ...draft, results: e.target.value } }))} />
                      <button className="consult-primary" onClick={() => handleUpdateLab(report._id)}>Update Test</button>
                    </div>
                  )}
                </div>
              );
            }) : <p className="consult-copy">{empty}</p>}
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
                    {simulatingPayment ? "Processing..." : "Simulate Successful Payment"}
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

              {canEditPharmacy && paymentStatus === "Paid" && !appointment.medicineDispensed && (
                <button className="consult-primary" onClick={handleDispense} disabled={dispensing} style={{marginTop: 15, width: '100%', justifyContent: 'center'}}>
                  <FiCheck /> {dispensing ? "Dispensing..." : "Dispense Medicine"}
                </button>
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

          {canViewAudit && (
            <Section icon={<FiInfo />} title="Audit Log">
              <p className="consult-copy">Audit log records are implicit in the Consultation Timeline.</p>
            </Section>
          )}
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
        .consult-editor textarea, .consult-editor input, .lab-edit textarea, .lab-edit input, .lab-edit select { width: 100%; box-sizing: border-box; border: 1px solid var(--card-border, #E5E7EB); border-radius: 8px; padding: 10px; font-family: inherit; background: var(--content-bg, #fff); color: var(--text-primary, #111827); }
        .consult-editor div { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
        .consult-editor .vitals { display: grid; gap: 12px; }
        .consult-list-item { display: flex; justify-content: space-between; gap: 16px; padding: 14px; border: 1px solid var(--card-border, #E5E7EB); border-radius: 12px; background: var(--content-bg, #F8FAFC); margin-bottom: 10px; }
        .lab-row { align-items: flex-start; }
        .lab-edit { width: min(360px, 45%); display: flex; flex-direction: column; gap: 8px; }
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
          .lab-edit { width: 100%; }
        }
      `}</style>
    </div>
  );
}
