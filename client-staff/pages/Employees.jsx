import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2, FiUser, FiSliders } from "react-icons/fi";
import api from "../api/api";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit employee state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [editShift, setEditShift] = useState("Day");
  const [editStatus, setEditStatus] = useState("Active");

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    try {
      setLoading(true);
      const data = await api.get("/employees");
      setEmployees(data);
    } catch (err) {
      console.error("Failed to fetch employees roster:", err);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(emp) {
    setEditingId(emp._id);
    setEditName(emp.name);
    setEditPhone(emp.phone);
    setEditSalary(emp.salary);
    setEditShift(emp.shift);
    setEditStatus(emp.status);
  }

  async function handleUpdateEmployee(e) {
    e.preventDefault();
    if (!editName || !editPhone || !editSalary) return;
    try {
      await api.put(`/employees/${editingId}`, {
        name: editName,
        phone: editPhone,
        salary: editSalary,
        shift: editShift,
        status: editStatus,
      });
      setEditingId(null);
      fetchEmployees();
    } catch (err) {
      console.error("Failed to update employee details:", err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete and terminate this employee profile? This deletes their associated user login as well.")) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      console.error("Failed to delete employee profile", err);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Employees & HR Directory</h1>
          <p>Manage hospital staff roles, edit shifts, allocate salary parameters, and monitor status schedules.</p>
        </div>
      </div>

      {editingId && (
        <form onSubmit={handleUpdateEmployee} className="crud-form-card" style={{ marginBottom: "24px", border: "2.5px solid var(--color-primary)" }}>
          <h3 className="crud-form-title">📝 Edit Employee Profile & Contract</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Full Name</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Phone Number</label>
              <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Monthly Salary ($)</label>
              <input type="number" value={editSalary} onChange={(e) => setEditSalary(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Duty Shift</label>
              <select value={editShift} onChange={(e) => setEditShift(e.target.value)}>
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
                <option value="Rotation">Rotation Shift</option>
              </select>
            </div>
            <div className="form-field">
              <label>Contract Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="Active">Active Employee</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: "16px" }}>
            <button type="button" className="btn-secondary" style={{ marginRight: "8px" }} onClick={() => setEditingId(null)}>Cancel</button>
            <button type="submit" className="btn-primary">Update Contract</button>
          </div>
        </form>
      )}

      <div className="crud-table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}><p>Loading employee records...</p></div>
        ) : employees.length === 0 ? (
          <div className="no-data-msg"><p>No employees registered. Register a staff user to populate.</p></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Designation</th>
                  <th>Phone Number</th>
                  <th>Monthly Salary</th>
                  <th>Duty Shift</th>
                  <th>Contract Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <FiUser style={{ color: "var(--color-primary-light)" }} />
                        <strong style={{ color: "white" }}>{emp.name}</strong>
                      </div>
                    </td>
                    <td>{emp.designation}</td>
                    <td>{emp.phone}</td>
                    <td>${emp.salary?.toLocaleString()}</td>
                    <td>{emp.shift}</td>
                    <td>
                      <span className={`badge ${emp.status === "Active" ? "badge-success" : emp.status === "On Leave" ? "badge-pending" : "badge-cancelled"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-table-action"
                          style={{ color: "var(--color-primary-light)", marginRight: "12px" }}
                          onClick={() => startEdit(emp)}
                          title="Edit Contract"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="btn-table-action btn-delete"
                          onClick={() => handleDelete(emp._id)}
                          title="Terminate"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
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
