const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Employee = require("../models/Employee");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Helper: generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// @route  POST /api/auth/register
// @desc   Register a new user + role document
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, age, gender, phone, specialization } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address (e.g. user@example.com)" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const staffRoles = ["receptionist", "nurse", "pharmacist", "lab_technician", "accountant"];

    if (role === "patient") {
      if (age === undefined || age === null || isNaN(Number(age))) {
        return res.status(400).json({ message: "Age must be a valid number" });
      }
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required for patients" });
      }
    } else if (role === "doctor") {
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required for doctors" });
      }
    } else if (staffRoles.includes(role)) {
      if (!phone) {
        return res.status(400).json({ message: `Phone number is required for ${role}` });
      }
    }

    // Check for existing user
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create base user
    const user = await User.create({ name, email, password, role });

    // Create role-specific document
    let patientId = null;
    let doctorId = null;
    let employeeId = null;
    if (role === "patient") {
      const patient = await Patient.create({ userId: user._id, name, age: Number(age), gender, phone });
      patientId = patient._id;
    } else if (role === "doctor") {
      const doctor = await Doctor.create({ userId: user._id, name, specialization: specialization || "General Medicine", phone });
      doctorId = doctor._id;
      try {
        const { getIO } = require("../socket");
        getIO().emit("doctor:registered", doctor);
      } catch (e) {
        console.error("Socket emit doctor:registered error:", e);
      }
    } else if (staffRoles.includes(role)) {
      let designation = "Receptionist";
      if (role === "nurse") designation = "Nurse";
      else if (role === "pharmacist") designation = "Pharmacist";
      else if (role === "lab_technician") designation = "Lab Technician";
      else if (role === "accountant") designation = "Accountant";

      const salary = role === "nurse" ? 45000 : role === "pharmacist" ? 50000 : role === "lab_technician" ? 40000 : role === "accountant" ? 55000 : 30000;

      const employee = await Employee.create({
        userId: user._id,
        name,
        designation,
        phone,
        salary,
      });
      employeeId = employee._id;
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      patientId,
      doctorId,
      employeeId,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message || "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role, phone } = req.body;

    let user;
    if (phone) {
      const patient = await Patient.findOne({ phone });
      if (!patient) {
        return res.status(404).json({ message: "No patient account found with this mobile number" });
      }
      user = await User.findById(patient.userId);
      if (!user) {
        return res.status(404).json({ message: "User account associated with this mobile number not found" });
      }

      // Check password for phone login
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }
    } else {
      user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "No account found with this email" });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }
    }

    // Role verification
    if (role && user.role !== role.toLowerCase()) {
      return res.status(403).json({
        message: `Incorrect role. This account is registered as: ${user.role.toUpperCase()}`,
      });
    }

    let patientId = null;
    let doctorId = null;
    let employeeId = null;
    const staffRoles = ["receptionist", "nurse", "pharmacist", "lab_technician", "accountant"];

    if (user.role === "patient") {
      const patient = await Patient.findOne({ userId: user._id });
      if (patient) patientId = patient._id;
    } else if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor) doctorId = doctor._id;
    } else if (staffRoles.includes(user.role)) {
      const employee = await Employee.findOne({ userId: user._id });
      if (employee) employeeId = employee._id;
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      patientId,
      doctorId,
      employeeId,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// @route  GET /api/auth/me
// @desc   Get current logged-in user from token
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let patientId = null;
    let doctorId = null;
    let employeeId = null;
    const staffRoles = ["receptionist", "nurse", "pharmacist", "lab_technician", "accountant"];

    if (user.role === "patient") {
      const patient = await Patient.findOne({ userId: user._id });
      if (patient) patientId = patient._id;
    } else if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor) doctorId = doctor._id;
    } else if (staffRoles.includes(user.role)) {
      const employee = await Employee.findOne({ userId: user._id });
      if (employee) employeeId = employee._id;
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      patientId,
      doctorId,
      employeeId,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

