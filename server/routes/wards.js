const express = require("express");
const Ward = require("../models/Ward");
const Bed = require("../models/Bed");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET all wards
router.get("/", protect, async (req, res) => {
  try {
    const wards = await Ward.find().sort({ createdAt: -1 });
    res.json(wards);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch wards" });
  }
});

// POST create ward
router.post("/", protect, async (req, res) => {
  try {
    const { name, type, totalBeds } = req.body;
    const ward = await Ward.create({ name, type, totalBeds: Number(totalBeds) });
    res.status(201).json(ward);
  } catch (error) {
    res.status(500).json({ message: "Failed to create ward" });
  }
});

// GET ward occupancy/beds status
router.get("/occupancy", protect, async (req, res) => {
  try {
    const beds = await Bed.find().populate("patientId", "name");
    res.json(beds);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bed status" });
  }
});

// PUT update bed assignment
router.put("/bed/:id", protect, async (req, res) => {
  try {
    const { status, patientId } = req.body;
    const bed = await Bed.findByIdAndUpdate(
      req.params.id,
      { status, patientId: patientId || null },
      { new: true }
    ).populate("patientId", "name");
    if (!bed) return res.status(404).json({ message: "Bed not found" });
    res.json(bed);
  } catch (error) {
    res.status(500).json({ message: "Failed to update bed assignment" });
  }
});

module.exports = router;
