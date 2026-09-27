const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    patientId:   { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    amount:      { type: Number, required: true, min: 0 },
    description: { type: String, default: "Consultation Fee" },
    status:      { type: String, enum: ["Paid", "Unpaid"], default: "Unpaid" },
  },
  { timestamps: true }
);
// Indexes for faster data fetching
billSchema.index({ patientId: 1 });
billSchema.index({ status: 1 });

module.exports = mongoose.model("Bill", billSchema);
