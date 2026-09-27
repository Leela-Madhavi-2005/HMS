const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    designation: {
      type: String,
      enum: ["Nurse", "Pharmacist", "Lab Technician", "Accountant", "Receptionist"],
      required: true,
    },
    phone: { type: String, required: true },
    salary: { type: Number, required: true },
    shift: { type: String, enum: ["Day", "Night", "Rotation"], default: "Day" },
    status: { type: String, enum: ["Active", "On Leave", "Terminated"], default: "Active" },
  },
  { timestamps: true }
);
// Indexes for faster data fetching
employeeSchema.index({ userId: 1 });
employeeSchema.index({ designation: 1 });

module.exports = mongoose.model("Employee", employeeSchema);
