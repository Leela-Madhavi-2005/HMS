const express = require("express");
const Doctor = require("../models/Doctor");
const { protect } = require("../middleware/auth");

const router = express.Router();

const { getIO } = require("../socket");

// GET all doctors (Public directory)
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

// POST create doctor
router.post("/", protect, async (req, res) => {
  try {
    const { name, specialization, phone } = req.body;
    const doctor = await Doctor.create({ name, specialization, phone });

    // Broadcast real-time doctor creation
    try {
      getIO().emit("doctor:registered", doctor);
    } catch (e) {
      console.error("Socket emit failed:", e);
    }

    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Failed to create doctor" });
  }
});

// PUT update doctor
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, specialization, phone, availableDates, availableHours, consultationFee } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { name, specialization, phone, availableDates, availableHours, consultationFee },
      { new: true }
    );
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    
    // Broadcast real-time availability updates
    try {
      getIO().emit("doctor:availability", doctor);
      getIO().emit("doctor:registered", doctor);
    } catch (e) {
      console.error("Socket emit failed:", e);
    }
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Failed to update doctor" });
  }
});

// DELETE doctor
router.delete("/:id", protect, async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    try {
      getIO().emit("doctor:deleted", { id: req.params.id });
    } catch (e) {
      console.error("Socket emit failed:", e);
    }

    res.json({ message: "Doctor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete doctor" });
  }
});

module.exports = router;
