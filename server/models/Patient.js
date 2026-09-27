const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Male" },
    phone: { type: String, required: true },
    isAdmitted: { type: Boolean, default: false },
    admissionDate: { type: Date },
    assignedWard: { type: String, default: "" },
    assignedBed: { type: String, default: "" },
    admissionHistory: [
      {
        admittedAt: { type: Date, default: Date.now },
        dischargedAt: { type: Date },
        ward: { type: String, default: "" },
        bedNumber: { type: String, default: "" },
        notes: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);
// Indexes for faster data fetching
patientSchema.index({ userId: 1 });

module.exports = mongoose.model("Patient", patientSchema);
