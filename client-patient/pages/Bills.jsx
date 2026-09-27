import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FiPlus, FiDollarSign, FiTrash2, FiX, FiCheckCircle } from "react-icons/fi";
import api from "../api/api";

export default function Bills() {
  const { currentUser, userRole } = useAuth();
  const isStaff = userRole === "admin" || userRole === "receptionist";

  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Name mapping lookup
  const [patientLookup, setPatientLookup] = useState({});

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("Unpaid");
  const [editingId, setEditingId] = useState(null);

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

      // Fetch bills
      const billsData = await api.get("/bills");
      const billsList = billsData.map((b) => ({ id: b._id, ...b }));
      setBills(billsList);

      if (patList.length > 0) {
        setSelectedPatientId(patList[0].id);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount) return;

    try {
      const billData = {
        patientId: selectedPatientId,
        amount: Number(amount),
        status,
      };

      if (editingId) {
        await api.put(`/bills/${editingId}`, billData);
      } else {
        await api.post("/bills", billData);
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving bill:", error);
    }
  }

  async function handleTogglePaid(id, currentStatus) {
    try {
      const newStatus = currentStatus === "Paid" ? "Unpaid" : "Paid";
      await api.put(`/bills/${id}`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error("Error toggling bill status:", error);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this bill record?")) return;
    try {
      await api.delete(`/bills/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting bill:", error);
    }
  }

  function handleEdit(bill) {
    const patIdString = typeof bill.patientId === "object" ? bill.patientId?._id : bill.patientId;
    setEditingId(bill.id);
    setSelectedPatientId(patIdString);
    setAmount(bill.amount);
    setStatus(bill.status);
    setShowForm(true);
  }

  function resetForm() {
    setAmount("");
    setStatus("Unpaid");
    setEditingId(null);
    setShowForm(false);
  }

  // Filter bills list by role
  const filteredBills = bills.filter((bill) => {
    const patIdString = typeof bill.patientId === "object" ? bill.patientId?._id : bill.patientId;
    if (userRole === "patient") {
      return patIdString === currentUser?.patientId;
    }
    return true; // Admin/Receptionist sees all
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Bills & Invoices</h1>
          <p>Create, track, and pay patient medical invoices</p>
        </div>
        {isStaff && !showForm && (
          <button className="btn-icon" onClick={() => setShowForm(true)}>
            <FiPlus /> Create Invoice
          </button>
        )}
      </div>

      {showForm && isStaff && (
        <form onSubmit={handleSubmit} className="crud-form-card">
          <h3 className="crud-form-title">
            {editingId ? "📝 Edit Patient Invoice" : "💵 Generate New Invoice"}
          </h3>
          <div className="form-grid">
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
                {patients.length === 0 && <option value="">No patients registered</option>}
              </select>
            </div>

            <div className="form-field">
              <label>Invoice Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                min="0"
                required
              />
            </div>

            <div className="form-field">
              <label>Payment Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary btn-icon" onClick={resetForm}>
              <FiX /> Cancel
            </button>
            <button type="submit" className="btn-primary btn-icon">
              Issue Invoice
            </button>
          </div>
        </form>
      )}

      {/* Invoice List */}
      <div className="crud-table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="login-spinner" style={{ margin: "0 auto", borderTopColor: "var(--color-primary)" }}></div>
            <p style={{ marginTop: "12px", color: "var(--text-muted)" }}>Loading invoices...</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="no-data-msg">
            <p>No billing invoices found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Amount</th>
                  <th>Status</th>
                  {isStaff && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => {
                  const patName = typeof bill.patientId === "object"
                    ? bill.patientId?.name
                    : (patientLookup[bill.patientId] || bill.patientId || "Unknown Patient");
                  
                  return (
                    <tr key={bill.id}>
                      <td data-label="Patient" style={{ fontWeight: "600" }}>{patName}</td>
                      <td data-label="Amount">
                        <div style={{ display: "flex", alignItems: "center", fontWeight: "700", color: "var(--text-primary)" }}>
                          <FiDollarSign />
                          {bill.amount}
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className={`badge ${bill.status === "Paid" ? "badge-success" : "badge-danger"}`}>
                          {bill.status}
                        </span>
                      </td>
                      {isStaff && (
                        <td data-label="Actions">
                          <div className="action-buttons">
                            <button
                              className="btn-table-action btn-edit"
                              onClick={() => handleTogglePaid(bill.id, bill.status)}
                              title={bill.status === "Paid" ? "Mark Unpaid" : "Mark Paid"}
                              style={{ color: bill.status === "Paid" ? "var(--color-danger)" : "var(--color-success)" }}
                            >
                              <FiCheckCircle />
                            </button>
                            <button
                              className="btn-table-action btn-edit"
                              onClick={() => handleEdit(bill)}
                              title="Edit Details"
                            >
                              <FiPlus style={{ transform: "rotate(45deg)" }} />
                            </button>
                            <button
                              className="btn-table-action btn-delete"
                              onClick={() => handleDelete(bill.id)}
                              title="Delete Invoice"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      )}
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
