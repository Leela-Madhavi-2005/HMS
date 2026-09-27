const mongoose = require("mongoose");

const wardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["ICU", "General", "Private", "Deluxe"], required: true },
    totalBeds: { type: Number, required: true },
  },
  { timestamps: true }
);
// Indexes for faster data fetching
wardSchema.index({ name: 1 });
wardSchema.index({ type: 1 });

module.exports = mongoose.model("Ward", wardSchema);
