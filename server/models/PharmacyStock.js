const mongoose = require("mongoose");

const pharmacyStockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    batchNumber: { type: String, required: true, trim: true },
    expiryDate: { type: Date, required: true },
    quantity: { type: Number, required: true, default: 0 },
    unitPrice: { type: Number, required: true },
    gst: { type: Number, default: 18 },
    supplier: { type: String, trim: true },
  },
  { timestamps: true }
);
// Indexes for faster data fetching
pharmacyStockSchema.index({ name: 1 });
pharmacyStockSchema.index({ expiryDate: 1 });

module.exports = mongoose.model("PharmacyStock", pharmacyStockSchema);
