const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    prescriptionNumber: { type: String, default: "" }, // RX-12345
    medicines: { type: String, required: true },
    notes: { type: String, default: "" },
    price: { type: Number, default: 25.00 },
    paymentStatus: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
    isFinalized: { type: Boolean, default: false },
  },
  { timestamps: true }
);
// Indexes for faster data fetching
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ appointmentId: 1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);
