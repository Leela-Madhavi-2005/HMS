const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId:           { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name:             { type: String, required: true, trim: true },
    specialization:   { type: String, required: true, default: "General Medicine" },
    phone:            { type: String, required: true },
    availableDates:   { type: [String], default: [] },
    availableHours:   { type: [String], default: [] },
    consultationFee:  { type: Number, default: 300 }, // ₹300 default, admin can set per doctor
  },
  { timestamps: true }
);
// Indexes for faster data fetching
doctorSchema.index({ userId: 1 });
doctorSchema.index({ specialization: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);
