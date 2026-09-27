const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: "Doctor",  required: true },
    date:      { type: String, required: true },
    reason:    { type: String, required: true },
    token:     { type: String, default: "" },       // e.g. T-001
    notes:     { type: String, default: "" },        // doctor diagnosis and notes
    consultationFee:     { type: Number, default: 0 },
    consultationFeePaid: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Checked-In", "Consulting", "Completed", "Cancelled"],
      default: "Pending",
    },
    // Vitals
    height: { type: String, default: "" },
    weight: { type: String, default: "" },
    bmi: { type: String, default: "" },
    bloodPressure: { type: String, default: "" },
    pulse: { type: String, default: "" },
    temperature: { type: String, default: "" },
    oxygenSaturation: { type: String, default: "" },
    sugarLevel: { type: String, default: "" },
    
    // Follow-up
    followUpInstructions: { type: String, default: "" },
    
    // Pharmacy workflow
    medicineDispensed: { type: Boolean, default: false },
    dispensedBy: { type: String, default: "" },
    dispensedAt: { type: Date },

    // Timeline Events
    timeline: [
      {
        label: { type: String },
        at: { type: Date, default: Date.now },
        by: { type: String },
        role: { type: String }
      }
    ]
  },
  { timestamps: true }
);
// Indexes for faster data fetching
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
