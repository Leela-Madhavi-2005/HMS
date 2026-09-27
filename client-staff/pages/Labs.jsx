import { useEffect, useState } from "react";
import { FiPlus, FiActivity, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/api";

export default function Labs() {
  const { userRole } = useAuth();
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [testName, setTestName] = useState("");
  const [category, setCategory] = useState("Blood");
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Result logging states
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [testResults, setTestResults] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const reportsData = await api.get("/labs");
      setReports(reportsData);

      const patientData = await api.get("/patients");
      setPatients(patientData);
      if (patientData.length > 0) setSelectedPatientId(patientData[0]._id);

      const doctorData = await api.get("/doctors");
      setDoctors(doctorData);
      if (doctorData.length > 0) setSelectedDoctorId(doctorData[0]._id);
    } catch (err) {
      console.error("Failed to fetch lab reports:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleOrderTest(e) {
    e.preventDefault();
    if (!testName || !selectedPatientId || !selectedDoctorId) return;
    try {
      await api.post("/labs", {
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        testName,
        category,
      });
      setTestName("");
      setShowOrderForm(false);
      fetchData();
    } catch (err) {
      console.error("Failed to order lab test", err);
    }
  }

  async function handleLogResults(e) {
    e.preventDefault();
    if (!selectedReportId || !testResults) return;
    try {
      await api.put(`/labs/${selectedReportId}`, {
        results: testResults,
        status: "Completed",
      });
      setSelectedReportId(null);
      setTestResults("");
      fetchData();
    } catch (err) {
      console.error("Failed to submit test results", err);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Laboratory & Diagnostics</h1>
          <p>Request diagnostic tests, view history, and enter patient lab results.</p>
        </div>
        {(userRole === "admin" || userRole === "doctor") && (
          <button className="btn-icon" onClick={() => setShowOrderForm(!showOrderForm)}>
            <FiPlus /> Order New Test
          </button>
        )}
      </div>

      {showOrderForm && (
        <form onSubmit={handleOrderTest} className="crud-form-card" style={{ marginBottom: "24px" }}>
          <h3 className="crud-form-title">🔬 Order Diagnostic Laboratory Test</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Select Patient</label>
              <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} (Phone: {p.phone})</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Requesting Doctor</label>
              <select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)}>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>Dr. {d.name} ({d.specialization})</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Test Name / Profile</label>
              <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="e.g. CBC, Lipid, Serum Creatinine" required />
            </div>
            <div className="form-field">
              <label>Test Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Blood">Blood (Hematology)</option>
                <option value="Urine">Urine (Urinalysis)</option>
                <option value="ECG">ECG (Cardiology)</option>
                <option value="X-Ray">X-Ray (Radiology)</option>
                <option value="MRI">MRI</option>
                <option value="CT Scan">CT Scan</option>
              </select>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: "16px" }}>
            <button type="submit" className="btn-primary">Place Test Order</button>
          </div>
        </form>
      )}

      {selectedReportId && (
        <form onSubmit={handleLogResults} className="crud-form-card" style={{ marginBottom: "24px", border: "2.5px solid var(--color-primary)" }}>
          <h3 className="crud-form-title">✍️ Record Lab Diagnostic Findings</h3>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="form-field">
              <label>Test Observations / Values / Pathology Summary</label>
              <textarea rows={3} value={testResults} onChange={(e) => setTestResults(e.target.value)} placeholder="e.g. Hb: 14.2 g/dL (Normal), WBC: 6,800 /mm3..." required />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: "16px" }}>
            <button type="button" className="btn-secondary" style={{ marginRight: "8px" }} onClick={() => { setSelectedReportId(null); setTestResults(""); }}>Cancel</button>
            <button type="submit" className="btn-primary">Submit Reports</button>
          </div>
        </form>
      )}

      <div className="crud-table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}><p>Loading records...</p></div>
        ) : reports.length === 0 ? (
          <div className="no-data-msg"><p>No lab requests recorded.</p></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Ordered By</th>
                  <th>Test Profile</th>
                  <th>Category</th>
                  <th>Results/Findings</th>
                  <th>Status</th>
                  {userRole === "lab_technician" || userRole === "admin" ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: "600" }}>{r.patientId?.name || "Unknown"}</td>
                    <td>Dr. {r.doctorId?.name || "Attending"}</td>
                    <td>{r.testName}</td>
                    <td>{r.category}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                      {r.results || "Awaiting findings..."}
                    </td>
                    <td>
                      <span className={`badge ${r.status === "Completed" ? "badge-success" : "badge-pending"}`}>
                        {r.status}
                      </span>
                    </td>
                    {(userRole === "lab_technician" || userRole === "admin") && (
                      <td>
                        {r.status !== "Completed" && (
                          <button
                            className="btn-table-action"
                            style={{ color: "var(--color-primary-light)" }}
                            onClick={() => setSelectedReportId(r._id)}
                            title="Enter Results"
                          >
                            <FiCheckCircle size={18} /> Enter Values
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
