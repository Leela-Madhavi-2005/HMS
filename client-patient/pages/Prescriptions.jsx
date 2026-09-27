import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FiPlus, FiFileText, FiTrash2, FiX, FiCheckCircle } from "react-icons/fi";
import api from "../api/api";

export default function Prescriptions() {
  const { currentUser, userRole } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Payment states
  const [payingRx, setPayingRx] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Name mapping lookups
  const [patientLookup, setPatientLookup] = useState({});
  const [doctorLookup, setDoctorLookup] = useState({});

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [medicines, setMedicines] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch patients
      const patientData = await api.get("/patients");
      const patList = patientData.map((p) => ({ id: p._id, ...p }));
      const patMap = {};
      patList.forEach((p) => {
        patMap[p.id] = p.name;
      });
      setPatients(patList);
      setPatientLookup(patMap);

      // Fetch doctors
      const doctorData = await api.get("/doctors");
      const docMap = {};
      doctorData.forEach((d) => {
        docMap[d._id] = d.name;
      });
      setDoctorLookup(docMap);

      // Fetch prescriptions
      const rxData = await api.get("/prescriptions");
      const rxList = rxData.map((r) => ({ id: r._id, ...r }));
      setPrescriptions(rxList);

      if (patList.length > 0) {
        setSelectedPatientId(patList[0].id);
      }
    } catch (error) {
      console.error("Error fetching prescriptions data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!medicines || !notes) return;

    try {
      const rxPayload = {
        doctorId: currentUser?.doctorId,
        patientId: selectedPatientId,
        medicines,
        notes,
      };

      await api.post("/prescriptions", rxPayload);
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving prescription:", error);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this prescription?")) return;
    try {
      await api.delete(`/prescriptions/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting prescription:", error);
    }
  }

  async function handleCompletePayment() {
    try {
      await api.put(`/prescriptions/${payingRx.id || payingRx._id}/pay`);
      setPaymentSuccess(true);
      setTimeout(() => {
        setPayingRx(null);
        setPaymentSuccess(false);
        fetchData();
      }, 1500);
    } catch (err) {
      console.error("Payment error:", err);
      alert("Failed to process payment");
    }
  }

  function resetForm() {
    setMedicines("");
    setNotes("");
    setShowForm(false);
  }

  // Filter list by role
  const filteredPrescriptions = prescriptions.filter((rx) => {
    const patIdString = typeof rx.patientId === "object" ? rx.patientId?._id : rx.patientId;
    const docIdString = typeof rx.doctorId === "object" ? rx.doctorId?._id : rx.doctorId;

    if (userRole === "patient") {
      return patIdString === currentUser?.patientId;
    }
    if (userRole === "doctor") {
      return docIdString === currentUser?.doctorId;
    }
    return true; // Admin sees all
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Prescriptions</h1>
          <p>View and manage patient drug and dosage instructions</p>
        </div>
        {userRole === "doctor" && !showForm && (
          <button className="btn-icon" onClick={() => setShowForm(true)}>
            <FiPlus /> New Prescription
          </button>
        )}
      </div>

      {showForm && userRole === "doctor" && (
        <form onSubmit={handleSubmit} className="crud-form-card">
          <h3 className="crud-form-title">📝 Draft Patient Prescription</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Select Patient</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Age: {p.age})
                  </option>
                ))}
                {patients.length === 0 && <option value="">No patients registered</option>}
              </select>
            </div>
            
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label>Medicines & Dosage</label>
              <textarea
                value={medicines}
                onChange={(e) => setMedicines(e.target.value)}
                placeholder="e.g. Paracetamol - 500mg - Twice a day"
                rows={2}
                required
              />
            </div>
            
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label>Instruction Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Take after meals, plenty of water."
                rows={2}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary btn-icon" onClick={resetForm}>
              <FiX /> Cancel
            </button>
            <button type="submit" className="btn-primary btn-icon">
              Issue Prescription
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="crud-table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="login-spinner" style={{ margin: "0 auto", borderTopColor: "var(--color-primary)" }}></div>
            <p style={{ marginTop: "12px", color: "var(--text-muted)" }}>Loading prescriptions...</p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="no-data-msg">
            <p>No prescriptions found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Medicines</th>
                  <th>Notes</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map((rx) => {
                  const patName = typeof rx.patientId === "object"
                    ? rx.patientId?.name
                    : (patientLookup[rx.patientId] || rx.patientId || "Unknown Patient");
                  const docName = typeof rx.doctorId === "object"
                    ? rx.doctorId?.name
                    : (doctorLookup[rx.doctorId] || rx.doctorId || "Unknown Doctor");
                  
                  return (
                    <tr key={rx.id}>
                      <td data-label="Patient" style={{ fontWeight: "600" }}>{patName}</td>
                      <td data-label="Doctor">{docName}</td>
                      <td data-label="Medicines" style={{ whiteSpace: "pre-wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FiFileText style={{ color: "var(--color-primary)" }} />
                          {rx.medicines}
                        </div>
                      </td>
                      <td data-label="Notes" style={{ color: "var(--text-secondary)" }}>{rx.notes}</td>
                      <td data-label="Price" style={{ fontWeight: "700" }}>${rx.price !== undefined ? rx.price.toFixed(2) : "25.00"}</td>
                      <td data-label="Status">
                        <span className={`badge ${rx.paymentStatus === "Paid" ? "badge-success" : "badge-pending"}`}>
                          {rx.paymentStatus || "Unpaid"}
                        </span>
                      </td>
                      <td data-label="Action">
                        {userRole === "patient" && rx.paymentStatus !== "Paid" && (
                          <button
                            onClick={() => setPayingRx(rx)}
                            style={{
                              padding: "6px 12px", background: "linear-gradient(135deg, #0A58A3 0%, #00A89E 100%)",
                              color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer",
                              fontSize: "0.85rem"
                            }}
                          >
                            Scan & Pay
                          </button>
                        )}
                        {rx.paymentStatus === "Paid" && (
                          <span style={{ fontSize: "0.85rem", color: "#10B981", fontWeight: "700" }}>✓ Paid</span>
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

      {payingRx && (
        <div 
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 1000, padding: "20px"
          }} 
          onClick={() => setPayingRx(null)}
        >
          <div 
            style={{
              background: "#1E293B", padding: "28px",
              borderRadius: "16px", maxWidth: "420px", width: "100%",
              textAlign: "center", color: "white", border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
            }} 
            onClick={e => e.stopPropagation()}
          >
            {!paymentSuccess ? (
              <>
                <h3 style={{ margin: "0 0 10px 0" }}>💳 Pay for Prescription</h3>
                <p style={{ margin: "0 0 20px 0", fontSize: "0.9rem", color: "#94A3B8" }}>
                  Scan the QR code below using your mobile scanner app to complete payment.
                </p>
                <div style={{
                  background: "white", padding: "16px", borderRadius: "12px",
                  display: "inline-block", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}>
                  {/* Mock UPI QR code */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=medicare@okaxis%26pn=MediCareHospital%26am=${payingRx.price || 25.00}%26cu=USD`} 
                    alt="Payment QR Code" 
                    style={{ width: "180px", height: "180px" }}
                  />
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "24px" }}>
                  Amount to Pay: ${payingRx.price !== undefined ? payingRx.price.toFixed(2) : "25.00"}
                </div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button 
                    onClick={() => setPayingRx(null)}
                    style={{ padding: "10px 18px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer", fontWeight: "600" }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCompletePayment}
                    style={{ padding: "10px 18px", borderRadius: "8px", background: "#10B981", border: "none", color: "white", fontWeight: "700", cursor: "pointer" }}
                  >
                    Confirm Payment
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: "20px 0" }}>
                <FiCheckCircle size={52} style={{ color: "#10B981", marginBottom: "16px" }} />
                <h3>Payment Successful!</h3>
                <p style={{ color: "#94A3B8", fontSize: "0.9rem", marginTop: "8px" }}>
                  Pharmacist has been notified. You can collect your medicines now.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
