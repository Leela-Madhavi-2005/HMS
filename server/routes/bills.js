const express = require("express");
const Bill = require("../models/Bill");
const { protect } = require("../middleware/auth");
const { getIO } = require("../socket");

const router = express.Router();

// GET all bills
router.get("/", protect, async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate("patientId", "name")
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bills" });
  }
});

// POST create bill
router.post("/", protect, async (req, res) => {
  try {
    const { patientId, amount, status } = req.body;
    const bill = await Bill.create({ patientId, amount: Number(amount), status: status || "Unpaid" });
    const populated = await bill.populate("patientId", "name");
    getIO().emit("bill:generated", {
      amount: populated.amount,
      patientName: populated.patientId.name,
      billId: populated._id,
      status: populated.status,
    });
    getIO().to("all_roles").emit("notification", { message: `New bill generated for ${populated.patientId.name}` });
    getIO().to("role_patient").emit("notification", { message: `A new bill has been generated for you` });
    getIO().to("role_admin").emit("notification", { message: `New bill generated` });
    getIO().to("role_receptionist").emit("notification", { message: `New bill generated` });
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Failed to create bill" });
  }
});

// PUT update bill
router.put("/:id", protect, async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("patientId", "name");
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    getIO().emit("bill:generated", {
      amount: bill.amount,
      patientName: bill.patientId.name,
      billId: bill._id,
      status: bill.status,
    });
    getIO().to("all_roles").emit("notification", { message: `Bill status updated for ${bill.patientId.name}` });
    getIO().to("role_patient").emit("notification", { message: `Your bill status has been updated` });
    getIO().to("role_admin").emit("notification", { message: `Bill status updated` });
    getIO().to("role_receptionist").emit("notification", { message: `Bill status updated` });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: "Failed to update bill" });
  }
});

// DELETE bill
router.delete("/:id", protect, async (req, res) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json({ message: "Bill deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete bill" });
  }
});

module.exports = router;
