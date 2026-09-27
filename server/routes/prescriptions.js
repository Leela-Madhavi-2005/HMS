const express = require("express");
const Prescription = require("../models/Prescription");
const { protect } = require("../middleware/auth");
const { getIO } = require("../socket");

const router = express.Router();

// GET all prescriptions
router.get("/", protect, async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate("patientId", "name age")
      .populate("doctorId", "name specialization")
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch prescriptions" });
  }
});

// POST create prescription (Only doctor can issue)
router.post("/", protect, async (req, res) => {
  const allowedRoles = ["doctor", "admin", "receptionist", "nurse"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied. You do not have permission to issue prescriptions." });
  }
  try {
    const { doctorId, patientId, appointmentId, medicines, notes, price, isFinalized } = req.body;
    
    // Generate prescription number if finalized
    const prescriptionNumber = isFinalized ? `RX-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}` : "";
    
    const prescription = await Prescription.create({ 
      doctorId, patientId, appointmentId, medicines, notes, price: price || 25.00,
      isFinalized: isFinalized || false,
      prescriptionNumber
    });
    
    const populated = await prescription.populate([
      { path: "patientId", select: "name age" },
      { path: "doctorId", select: "name specialization" },
    ]);
    getIO().emit("prescription:created", {
      patientName: populated.patientId.name,
      doctorName: populated.doctorId.name,
      prescriptionId: populated._id,
    });
    
    if (isFinalized) {
      getIO().to("all_roles").emit("notification", { message: `New prescription finalized for ${populated.patientId.name}` });
      getIO().to("role_pharmacist").emit("notification", { message: `Prescription ${prescriptionNumber} finalized for ${populated.patientId.name} by Dr. ${populated.doctorId.name}` });
    } else {
      getIO().to("all_roles").emit("notification", { message: `New prescription draft added for ${populated.patientId.name}` });
    }
    
    getIO().to("role_patient").emit("notification", { message: `A new prescription has been added to your profile` });
    res.status(201).json(populated);
  } catch (error) {
    console.error("Failed to create prescription:", error);
    res.status(500).json({ message: error.message || "Failed to create prescription" });
  }
});

// PUT pay for prescription
router.put("/:id/pay", protect, async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "Paid" },
      { new: true }
    ).populate("patientId", "name age").populate("doctorId", "name specialization");
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    
    // Broadcast real-time socket events for pharmacy update
    getIO().emit("prescription:paid", prescription);
    getIO().to("role_pharmacist").emit("notification", { message: `Payment completed for prescription of ${prescription.patientId.name}` });
    getIO().to("role_patient").emit("notification", { message: `Prescription payment successful!` });

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: "Failed to process payment" });
  }
});

// PUT update prescription (Only doctor and admin)
router.put("/:id", protect, async (req, res) => {
  if (req.user.role !== "doctor" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Only doctors and admins can edit prescriptions." });
  }
  try {
    const { medicines, notes, isFinalized } = req.body;
    
    // Generate number if finalizing now and it doesn't have one.
    const existing = await Prescription.findById(req.params.id);
    
    const prescriptionNumber = isFinalized && !existing.prescriptionNumber ? `RX-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}` : existing.prescriptionNumber;
    
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { medicines, notes, isFinalized: isFinalized || false, prescriptionNumber },
      { new: true }
    )
      .populate("patientId", "name age")
      .populate("doctorId", "name specialization");
    
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    
    if (isFinalized) {
      getIO().to("all_roles").emit("notification", { message: `Prescription finalized for ${prescription.patientId.name}` });
      getIO().to("role_pharmacist").emit("notification", { message: `Prescription ${prescriptionNumber} finalized for ${prescription.patientId.name} by Dr. ${prescription.doctorId.name}` });
    }
    
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: "Failed to update prescription" });
  }
});

// DELETE prescription (Only doctor, admin, and pharmacist)
router.delete("/:id", protect, async (req, res) => {
  if (req.user.role !== "doctor" && req.user.role !== "admin" && req.user.role !== "pharmacist") {
    return res.status(403).json({ message: "Access denied. Only doctors, admins, and pharmacists can delete prescriptions." });
  }
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });
    res.json({ message: "Prescription deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete prescription" });
  }
});

module.exports = router;
