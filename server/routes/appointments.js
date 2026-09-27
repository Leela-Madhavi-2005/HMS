const express = require("express");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { getIO } = require("../socket");

const router = express.Router();

// GET all appointments
router.get("/", protect, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patientId", "name userId phone age gender")
      .populate("doctorId", "name specialization")
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

// GET single appointment
router.get("/:id", protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name userId age gender phone bloodGroup")
      .populate("doctorId", "name specialization phone");
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointment details" });
  }
});

// POST create appointment
router.post("/", protect, async (req, res) => {
  try {
    const { patientId, doctorId, date, reason, status, consultationFee, consultationFeePaid } = req.body;

    if (!patientId || !doctorId || !date) {
      return res.status(400).json({ message: "Please complete all appointment details before submitting the request." });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId) || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "Invalid patient or doctor reference." });
    }

    let resolvedPatientId = patientId;
    // Attempt to resolve if the provided ID belongs to a User instead of a Patient
    const isPatient = await Patient.findById(patientId);
    if (isPatient) {
      resolvedPatientId = isPatient._id;
    } else {
      const userObj = await User.findById(patientId);
      if (!userObj) {
        return res.status(400).json({ message: "Patient profile not found for this account." });
      }

      if (userObj) {
        let patProfile = await Patient.findOne({ userId: userObj._id });
        if (!patProfile) {
          patProfile = await Patient.create({
            userId: userObj._id,
            name: userObj.name,
            age: Number(req.body.age) || 0,
            gender: req.body.gender || "Other",
            phone: req.body.phone || userObj.email || "Unknown"
          });
        }
        resolvedPatientId = patProfile._id;
      }
    }

    // Auto-generate token: count today's appointments and increment
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await Appointment.countDocuments({ createdAt: { $gte: todayStart } });
    const token = `T-${String(todayCount + 1).padStart(3, "0")}`;

    const appointment = await Appointment.create({
      patientId: resolvedPatientId, doctorId, date,
      reason: reason || "General Checkup",
      status: status || "Pending",
      consultationFee: consultationFee || 300,
      consultationFeePaid: consultationFeePaid || false,
      token,
    });
    const populated = await appointment.populate([
      { path: "patientId", select: "name userId phone age gender" },
      { path: "doctorId",  select: "name specialization" },
    ]);
    const pName = populated.patientId?.name || "Patient";
    const dName = populated.doctorId?.name || "Doctor";

    getIO().emit("appointment:update", {
      message: `New appointment for ${pName} with Dr. ${dName}`,
      appointmentId: populated._id,
      status: populated.status,
    });
    
    // Broadcast notifications
    if (populated.reason?.startsWith("OP:")) {
      getIO().to("all_roles").emit("notification", { 
        message: `Walk-in OP registered: ${pName} assigned to Dr. ${dName}`,
        appointmentId: populated._id
      });
    } else {
      getIO().to("all_roles").emit("notification", { 
        message: `New appointment request from ${pName} — Token ${token}`,
        appointmentId: populated._id 
      });
      getIO().to("role_receptionist").emit("notification", { 
        message: `New online appointment pending review — Token ${token}`,
        appointmentId: populated._id
      });
    }
    
    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create appointment" });
  }
});

// PUT update appointment (edit or status change)
router.put("/:id", protect, async (req, res) => {
  try {
    const { status, consultationFeePaid, consultationFee, timelineEvent } = req.body;
    let updateData = { ...req.body };
    if (timelineEvent) {
      delete updateData.timelineEvent; // We push this manually via $push
      updateData.$push = { timeline: timelineEvent };
    }

    const appointmentBefore = await Appointment.findById(req.params.id)
      .populate("patientId", "name")
      .populate("doctorId", "name");
      
    if (!appointmentBefore) return res.status(404).json({ message: "Appointment not found" });

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("patientId", "name")
      .populate("doctorId", "name specialization");
      
    // Fee paid notification
    const pName2 = appointment.patientId?.name || "Patient";
    const dName2 = appointment.doctorId?.name || "Doctor";

    if (consultationFeePaid === true && !appointmentBefore.consultationFeePaid) {
      const fee = consultationFee || appointmentBefore.consultationFee || 0;
      getIO().to("all_roles").emit("notification", {
        message: `Consultation fee ₹${fee} collected from ${pName2}`,
      });
    }

    getIO().emit("appointment:update", {
      message: `Appointment ${appointment.status} for ${pName2}`,
      appointmentId: appointment._id,
      status: appointment.status,
    });
    
    if (status === "Approved") {
      getIO().to("all_roles").emit("notification", { 
        message: `Appointment approved for ${pName2} with Dr. ${dName2}`,
        appointmentId: appointment._id
      });
    } else if (status === "Cancelled") {
      getIO().to("all_roles").emit("notification", { 
        message: `Appointment cancelled for ${pName2}`,
        appointmentId: appointment._id 
      });
    } else if (status && status !== appointmentBefore.status) {
      getIO().to("all_roles").emit("notification", { 
        message: `Appointment status changed to ${appointment.status} for ${pName2}`,
        appointmentId: appointment._id 
      });
    }

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update appointment" });
  }
});

// DELETE appointment
router.delete("/:id", protect, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Appointment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete appointment" });
  }
});

module.exports = router;
