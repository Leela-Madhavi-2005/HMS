const express = require("express");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Bill = require("../models/Bill");
const Bed = require("../models/Bed");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET /api/dashboard/stats
router.get("/stats", protect, async (req, res) => {
  try {
    const [doctorsCount, patientsCount, appointmentsCount, bills, beds] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Bill.find(),
      Bed.find()
    ]);

    const totalRevenue = bills.filter(b => b.status === "Paid").reduce((sum, b) => sum + b.amount, 0);
    const pendingPaymentsCount = bills.filter(b => b.status === "Unpaid").length;
    
    // Revenue mock calculation (since we don't have historical data generation yet, we just provide the actual totals)
    const analytics = [
      { label: "Total revenue", value: `$${totalRevenue}` },
      { label: "Pending payments", value: `${pendingPaymentsCount}` },
    ];

    const occupiedBeds = beds.filter(b => b.status === "Occupied").length;
    const availableBeds = beds.filter(b => b.status === "Available").length;
    
    const management = [
      { title: "Bed management", detail: `${beds.length} beds · ${occupiedBeds} occupied · ${availableBeds} available` },
      { title: "Staff on duty", detail: `${doctorsCount} doctors` },
    ];

    res.json({
      doctors: doctorsCount,
      patients: patientsCount,
      appointments: appointmentsCount,
      revenue: totalRevenue,
      analytics,
      management
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

// GET /api/dashboard/receptionist/stats
router.get("/receptionist/stats", protect, async (req, res) => {
  try {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const [appointments, patientsCount, bills] = await Promise.all([
      Appointment.find({ date: { $regex: new RegExp(`^${todayStr}`) } }).populate("patientId", "name phone").populate("doctorId", "name specialization").sort({ createdAt: -1 }),
      Patient.countDocuments(),
      Bill.find()
    ]);

    const todaysAppointmentsCount = appointments.length;
    const checkedInPatients = appointments.filter(a => a.status === "Approved" || a.status === "Checked-In").length;
    const unpaidBills = bills.filter(b => b.status === "Unpaid");

    res.json({
      todaysAppointmentsCount,
      checkedInPatients,
      pendingRegistrations: patientsCount,
      avgWaitTime: "12m",
      appointments,
      unpaidBills
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch receptionist stats" });
  }
});

module.exports = router;
