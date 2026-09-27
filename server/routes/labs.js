const express = require("express");
const LabReport = require("../models/LabReport");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET all reports
router.get("/", protect, async (req, res) => {
  try {
    const reports = await LabReport.find()
      .populate("patientId", "name age gender")
      .populate("doctorId", "name specialization")
      .populate("appointmentId", "date reason token status")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch lab reports" });
  }
});

// POST order report
router.post("/", protect, async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId, testName, category } = req.body;
    const report = await LabReport.create({ patientId, doctorId, appointmentId, testName, category, status: "Ordered" });
    const populated = await report.populate([
      { path: "patientId", select: "name age gender" },
      { path: "doctorId", select: "name specialization" },
      { path: "appointmentId", select: "date reason token status" }
    ]);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Failed to create lab report order" });
  }
});

// PUT update report results (technician completes test)
router.put("/:id", protect, async (req, res) => {
  try {
    const { results, status, reportFileUrl } = req.body;
    const report = await LabReport.findByIdAndUpdate(
      req.params.id,
      { results, status: status || "Completed", reportFileUrl },
      { new: true }
    )
      .populate("patientId", "name age gender")
      .populate("doctorId", "name specialization");
    
    if (!report) return res.status(404).json({ message: "Lab report not found" });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: "Failed to update lab report results" });
  }
});

module.exports = router;
