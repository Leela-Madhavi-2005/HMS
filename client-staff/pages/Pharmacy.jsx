import { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiAlertCircle, FiTrendingUp } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/api";

export default function Pharmacy() {
  const { userRole } = useAuth();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [gst, setGst] = useState(18);
  const [supplier, setSupplier] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Restock state
  const [restockId, setRestockId] = useState(null);
  const [additionalQty, setAdditionalQty] = useState("");

  useEffect(() => {
    fetchStock();
  }, []);

  async function fetchStock() {
    try {
      setLoading(true);
      const stockData = await api.get("/pharmacy");
      setStock(stockData);
    } catch (err) {
      console.error("Failed to fetch pharmacy stock:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMedicine(e) {
    e.preventDefault();
    if (!name || !batchNumber || !expiryDate || !quantity || !unitPrice) return;
    try {
      await api.post("/pharmacy", {
        name,
        batchNumber,
        expiryDate,
        quantity,
        unitPrice,
        gst,
        supplier,
      });
      setName("");
      setBatchNumber("");
      setExpiryDate("");
      setQuantity("");
      setUnitPrice("");
      setSupplier("");
      setShowAddForm(false);
      fetchStock();
    } catch (err) {
      console.error("Failed to add medicine", err);
    }
  }

  async function handleRestock(e) {
    e.preventDefault();
    if (!restockId || !additionalQty) return;
    try {
      const item = stock.find((s) => s._id === restockId);
      const newQty = Number(item.quantity) + Number(additionalQty);
      await api.put(`/pharmacy/${restockId}`, { quantity: newQty });
      setRestockId(null);
      setAdditionalQty("");
      fetchStock();
    } catch (err) {
      console.error("Failed to restock drug item", err);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this medication from inventory?")) return;
    try {
      await api.delete(`/pharmacy/${id}`);
      fetchStock();
    } catch (err) {
      console.error("Failed to delete stock item", err);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Pharmacy Inventory</h1>
          <p>Track medicine stocks, expiry dates, batch logs, and record supplier details.</p>
        </div>
        {(userRole === "pharmacist" || userRole === "admin") && (
          <button className="btn-icon" onClick={() => setShowAddForm(!showAddForm)}>
            <FiPlus /> Add Drug Item
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddMedicine} className="crud-form-card" style={{ marginBottom: "24px" }}>
          <h3 className="crud-form-title">💊 Add New Medicine / Drug Item</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Medicine Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Metformin 500mg" required />
            </div>
            <div className="form-field">
              <label>Batch Code</label>
              <input type="text" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="e.g. BATCH-993-C" required />
            </div>
            <div className="form-field">
              <label>Expiry Date</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Initial Quantity</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 100" required />
            </div>
            <div className="form-field">
              <label>Unit Price ($)</label>
              <input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="e.g. 1.25" required />
            </div>
            <div className="form-field">
              <label>GST Rate (%)</label>
              <input type="number" value={gst} onChange={(e) => setGst(e.target.value)} />
            </div>
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label>Supplier Details</label>
              <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. Biotech Laboratories Ltd." />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: "16px" }}>
            <button type="submit" className="btn-primary">Add to Inventory</button>
          </div>
        </form>
      )}

      {restockId && (
        <form onSubmit={handleRestock} className="crud-form-card" style={{ marginBottom: "24px", border: "2.5px solid var(--color-primary)" }}>
          <h3 className="crud-form-title">📦 Restock Medication Batch</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Additional Quantity to Add</label>
              <input type="number" value={additionalQty} onChange={(e) => setAdditionalQty(e.target.value)} placeholder="e.g. 50" required />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: "16px" }}>
            <button type="button" className="btn-secondary" style={{ marginRight: "8px" }} onClick={() => { setRestockId(null); setAdditionalQty(""); }}>Cancel</button>
            <button type="submit" className="btn-primary">Update Stock</button>
          </div>
        </form>
      )}

      <div className="crud-table-wrapper">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}><p>Loading stock inventory...</p></div>
        ) : stock.length === 0 ? (
          <div className="no-data-msg"><p>No medications in stock.</p></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Drug Name</th>
                  <th>Batch Code</th>
                  <th>Quantity</th>
                  <th>Expiry Date</th>
                  <th>Unit Price ($)</th>
                  <th>Supplier</th>
                  {(userRole === "pharmacist" || userRole === "admin") && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {stock.map((item) => {
                  const isLow = item.quantity <= 15;
                  const daysToExpiry = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  const isExpiringSoon = daysToExpiry > 0 && daysToExpiry < 90;

                  return (
                    <tr key={item._id}>
                      <td style={{ fontWeight: "600" }}>{item.name}</td>
                      <td>{item.batchNumber}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {item.quantity}
                          {isLow && (
                            <span
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", background: "rgba(239,68,68,0.2)", color: "#f87171", padding: "2px 6px", borderRadius: "8px" }}
                              title="Low Stock"
                            >
                              <FiAlertCircle /> Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {new Date(item.expiryDate).toLocaleDateString()}
                          {isExpiringSoon && (
                            <span
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", background: "rgba(245,158,11,0.2)", color: "#fbbf24", padding: "2px 6px", borderRadius: "8px" }}
                              title={`Expiring in ${daysToExpiry} days`}
                            >
                              <FiAlertCircle /> Soon
                            </span>
                          )}
                        </div>
                      </td>
                      <td>${item.unitPrice}</td>
                      <td>{item.supplier || "Not specified"}</td>
                      {(userRole === "pharmacist" || userRole === "admin") && (
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-table-action"
                              style={{ color: "var(--color-primary-light)", marginRight: "12px" }}
                              onClick={() => setRestockId(item._id)}
                              title="Restock"
                            >
                              <FiTrendingUp size={16} /> Restock
                            </button>
                            {userRole === "admin" && (
                              <button
                                className="btn-table-action btn-delete"
                                onClick={() => handleDelete(item._id)}
                                title="Delete"
                              >
                                <FiTrash2 />
                              </button>
                            )}
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
