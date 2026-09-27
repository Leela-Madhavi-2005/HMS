const express = require("express");
const Patient = require("../models/Patient");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET all patients
router.get("/", protect, async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch patients" });
  }
});

// POST create patient
router.post("/", protect, async (req, res) => {
  try {
    const { name, age, gender, phone, isAdmitted } = req.body;
    const patient = await Patient.create({ name, age: Number(age), gender, phone, isAdmitted: isAdmitted || false });
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: "Failed to create patient" });
  }
});

// PUT update patient
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, age, gender, phone, isAdmitted } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = Number(age);
    if (gender !== undefined) updateData.gender = gender;
    if (phone !== undefined) updateData.phone = phone;
    if (isAdmitted !== undefined) updateData.isAdmitted = isAdmitted;

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: "Failed to update patient" });
  }
});

const Bed = require("../models/Bed");

// PUT admit patient
router.put("/:id/admit", protect, async (req, res) => {
  try {
    const { ward, bedNumber, notes } = req.body;
    const now = new Date();

    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    patient.isAdmitted = true;
    patient.admissionDate = now;
    patient.assignedWard = ward || "General Ward";
    patient.assignedBed = bedNumber || "Unassigned";
    patient.admissionHistory.push({
      admittedAt: now,
      ward: ward || "General Ward",
      bedNumber: bedNumber || "Unassigned",
      notes: notes || "Admitted for inpatient care."
    });

    await patient.save();

    // Occupy bed if bedNumber provided
    if (bedNumber) {
      await Bed.findOneAndUpdate(
        { bedNumber },
        { status: "Occupied", patientId: patient._id }
      );
    }

    res.json(patient);
  } catch (error) {
    console.error("Admit error:", error);
    res.status(500).json({ message: "Failed to admit patient" });
  }
});

// PUT discharge patient
router.put("/:id/discharge", protect, async (req, res) => {
  try {
    const { notes } = req.body;
    const now = new Date();

    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    patient.isAdmitted = false;
    patient.assignedWard = "";
    patient.assignedBed = "";

    // Close the active admission in history
    if (patient.admissionHistory.length > 0) {
      const activeEntry = [...patient.admissionHistory].reverse().find(h => !h.dischargedAt);
      if (activeEntry) {
        activeEntry.dischargedAt = now;
        if (notes) activeEntry.notes = (activeEntry.notes ? activeEntry.notes + " | " : "") + `Discharged: ${notes}`;
      }
    }

    await patient.save();

    // Free any occupied bed for this patient
    await Bed.updateMany(
      { patientId: patient._id },
      { status: "Available", patientId: null }
    );

    res.json(patient);
  } catch (error) {
    console.error("Discharge error:", error);
    res.status(500).json({ message: "Failed to discharge patient" });
  }
});

// DELETE patient
router.delete("/:id", protect, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "Patient deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete patient" });
  }
});

module.exports = router;
