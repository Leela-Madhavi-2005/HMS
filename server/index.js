require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const { initSocket } = require("./socket");

// Import Routes
const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patients");
const doctorRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");
const prescriptionRoutes = require("./routes/prescriptions");
const billRoutes = require("./routes/bills");
const dashboardRoutes = require("./routes/dashboard");
const dashboardRealtimeRoutes = require("./routes/dashboardRealtime");
const wardRoutes = require("./routes/wards");
const labRoutes = require("./routes/labs");
const pharmacyRoutes = require("./routes/pharmacy");
const employeeRoutes = require("./routes/employees");
const auditLogRoutes = require("./routes/auditlogs");

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

// Middlewares
const configuredOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173,http://127.0.0.1:5173,http://0.0.0.0:5173,http://10.207.33.31:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set(configuredOrigins);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin) || allowedOrigins.has("*")) return true;

  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
      return true;
    }

    return (
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.")
    );
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/dashboard/realtime", dashboardRealtimeRoutes);
app.use("/api/wards", wardRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/auditlogs", auditLogRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Hospital Management System API is running" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const preferredPort = Number(process.env.PORT || 5000);
const maxPortAttempts = 10;

function startServer(port, attempt = 1) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attempt < maxPortAttempts) {
      const nextPort = port + 1;
      console.warn(`⚠️ Port ${port} is busy. Trying ${nextPort} instead...`);
      startServer(nextPort, attempt + 1);
    } else {
      console.error("❌ Server failed to start:", error.message);
      process.exit(1);
    }
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

startServer(preferredPort);

module.exports = { io };
