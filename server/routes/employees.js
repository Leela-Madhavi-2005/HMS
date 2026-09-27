const express = require("express");
const Employee = require("../models/Employee");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET all employees
router.get("/", protect, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employee database" });
  }
});

// PUT update employee profile
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, phone, salary, shift, status } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { name, phone, salary: Number(salary), shift, status },
      { new: true }
    );
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Sync name back to User account if linked
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { name });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Failed to update employee profile" });
  }
});

// DELETE employee profile
router.delete("/:id", protect, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Also delete user account if linked
    if (employee.userId) {
      await User.findByIdAndDelete(employee.userId);
    }

    res.json({ message: "Employee profile deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete employee profile" });
  }
});

module.exports = router;
