const express = require("express");
const AuditLog = require("../models/AuditLog");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET all audit logs (admin only)
router.get("/", protect, async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// POST create audit log entry
router.post("/", protect, async (req, res) => {
  try {
    const { action, details } = req.body;
    const log = await AuditLog.create({
      userId: req.user._id || req.user.id,
      action,
      details,
      ipAddress: req.ip,
    });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: "Failed to create audit log" });
  }
});

module.exports = router;
