const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema(
  {
    bedNumber: { type: String, required: true, unique: true },
    ward: { type: String, required: true },
    status: {
      type: String,
      enum: ["Available", "Occupied", "Maintenance"],
      default: "Available",
    },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  },
  { timestamps: true }
);
// Indexes for faster data fetching
bedSchema.index({ ward: 1 });
bedSchema.index({ status: 1 });
bedSchema.index({ patientId: 1 });

module.exports = mongoose.model("Bed", bedSchema);
