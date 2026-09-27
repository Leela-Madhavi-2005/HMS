const express = require("express");
const Appointment = require("../models/Appointment");
const Bill = require("../models/Bill");
const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Role-specific stats
router.get("/patient/stats", protect, async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return res.status(404).json({ message: "Patient record not found" });

    const upcomingAppointments = await Appointment.find({ patientId: patient._id, status: { $in: ["Pending", "Approved"] } }).populate("doctorId", "name specialization").sort({ date: 1 });
    const bills = await Bill.find({ patientId: patient._id, status: "Unpaid" });
    const recentPrescriptions = await Prescription.find({ patientId: patient._id }).populate("doctorId", "name").sort({ createdAt: -1 });
    const medicalRecords = 1; // placeholder for records count

    res.json({
      upcomingAppointmentsCount: upcomingAppointments.length,
      upcomingAppointments,
      pendingBills: bills.reduce((sum, bill) => sum + bill.amount, 0),
      recentPrescriptionsCount: recentPrescriptions.length,
      recentPrescriptions,
      medicalRecords,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch patient dashboard stats" });
  }
});

router.get("/doctor/stats", protect, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: "Doctor record not found" });

    const todayStr = new Date().toLocaleDateString("en-CA");
    const todayAppointments = await Appointment.find({ 
      doctorId: doctor._id, 
      date: { $regex: new RegExp(`^${todayStr}`) },
      status: { $in: ["Approved", "Checked-In", "Consulting"] } 
    }).populate("patientId", "name age").sort({ date: 1 });
    
    const activePatients = todayAppointments.filter(a => a.status === "Approved").length;
    const pendingPrescriptions = await Prescription.countDocuments({ doctorId: doctor._id });
    const consultationHours = 0; // placeholder

    res.json({ 
      todayAppointmentsCount: todayAppointments.length, 
      todayAppointments,
      activePatients, 
      pendingPrescriptions, 
      consultationHours 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctor dashboard stats" });
  }
});

router.get("/receptionist/stats", protect, async (req, res) => {
  try {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const todaysAppointments = await Appointment.find({ 
      date: { $regex: new RegExp(`^${todayStr}`) },
      status: { $in: ["Pending", "Approved"] } 
    }).populate("doctorId", "name").populate("patientId", "name");
    
    const checkedInPatients = todaysAppointments.filter(a => a.status === "Approved").length;
    const pendingRegistrations = await Patient.countDocuments({});
    
    const unpaidBills = await Bill.find({ status: "Unpaid" }).populate("patientId", "name");
    const paidBills = await Bill.find({ status: "Paid" });

    res.json({ 
      todaysAppointmentsCount: todaysAppointments.length,
      appointments: todaysAppointments,
      checkedInPatients, 
      pendingRegistrations, 
      avgWaitTime: "12m",
      unpaidBillsCount: unpaidBills.length,
      paidBillsCount: paidBills.length,
      unpaidBills
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch receptionist dashboard stats" });
  }
});

module.exports = router;