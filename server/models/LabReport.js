const mongoose = require("mongoose");

const labReportSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    testName: { type: String, required: true },
    category: { type: String, enum: ["Blood", "Urine", "ECG", "X-Ray", "MRI", "CT Scan"], required: true },
    results: { type: String, default: "" },
    status: { type: String, enum: ["Ordered", "Sample Collected", "Completed"], default: "Ordered" },
    reportFileUrl: { type: String, default: "" },
  },
  { timestamps: true }
);
// Indexes for faster data fetching
labReportSchema.index({ patientId: 1 });
labReportSchema.index({ doctorId: 1 });
labReportSchema.index({ appointmentId: 1 });
labReportSchema.index({ status: 1 });

module.exports = mongoose.model("LabReport", labReportSchema);
