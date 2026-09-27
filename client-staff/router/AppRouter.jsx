import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import RoleRoute from "../components/RoleRoute";

import Login from "../pages/Login";
import AdminDashboard from "../pages/AdminDashboard";
import DoctorDashboard from "../pages/DoctorDashboard";
import ReceptionistDashboard from "../pages/ReceptionistDashboard";
import NurseDashboard from "../pages/NurseDashboard";
import PharmacistDashboard from "../pages/PharmacistDashboard";
import LabTechnicianDashboard from "../pages/LabTechnicianDashboard";
import Doctors from "../pages/Doctors";
import Patients from "../pages/Patients";
import PatientDetails from "../pages/PatientDetails";
import Appointments from "../pages/Appointments";
import Prescriptions from "../pages/Prescriptions";
import Bills from "../pages/Bills";
import Wards from "../pages/Wards";
import Labs from "../pages/Labs";
import Pharmacy from "../pages/Pharmacy";
import Employees from "../pages/Employees";
import AuditLog from "../pages/AuditLog";
import ConsultationDetails from "../pages/ConsultationDetails";

function DashboardRedirect() {
  const { userRole } = useAuth();

  switch (userRole) {
    case "admin":
      return <AdminDashboard />;
    case "doctor":
      return <DoctorDashboard />;
    case "receptionist":
      return <ReceptionistDashboard />;
    case "nurse":
      return <NurseDashboard />;
    case "pharmacist":
      return <PharmacistDashboard />;
    case "lab_technician":
      return <LabTechnicianDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to login page */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Login Route */}
        <Route path="/login" element={<LoginRedirect />} />

        {/* Protected Layout Route */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard — role-based */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Doctors — accessible to admin, receptionist */}
          <Route
            path="/doctors"
            element={
              <RoleRoute allowedRoles={["admin", "receptionist", "doctor", "nurse", "pharmacist", "lab_technician"]}>
                <Doctors />
              </RoleRoute>
            }
          />

          {/* Patients — accessible to admin, doctor, receptionist, nurse */}
          <Route
            path="/patients"
            element={
              <RoleRoute allowedRoles={["admin", "doctor", "receptionist", "nurse", "pharmacist", "lab_technician"]}>
                <Patients />
              </RoleRoute>
            }
          />

          {/* Patient Details Profile — accessible to admin, doctor, receptionist, nurse */}
          <Route
            path="/patients/:id"
            element={
              <RoleRoute allowedRoles={["admin", "doctor", "receptionist", "nurse", "pharmacist", "lab_technician"]}>
                <PatientDetails />
              </RoleRoute>
            }
          />

          {/* Appointments — accessible to admin, doctor, receptionist */}
          <Route
            path="/appointments"
            element={
              <RoleRoute allowedRoles={["admin", "doctor", "receptionist"]}>
                <Appointments />
              </RoleRoute>
            }
          />

          {/* Consultation Details — accessible to everyone */}
          <Route
            path="/consultation/:id"
            element={
              <RoleRoute allowedRoles={["admin", "doctor", "receptionist", "nurse", "pharmacist", "lab_technician"]}>
                <ConsultationDetails />
              </RoleRoute>
            }
          />

          {/* Prescriptions — accessible to admin, doctor */}
          <Route
            path="/prescriptions"
            element={
              <RoleRoute allowedRoles={["admin", "doctor"]}>
                <Prescriptions />
              </RoleRoute>
            }
          />

          {/* Bills — accessible to admin, receptionist */}
          <Route
            path="/bills"
            element={
              <RoleRoute allowedRoles={["admin", "receptionist"]}>
                <Bills />
              </RoleRoute>
            }
          />

          {/* Wards & Beds — accessible to admin, receptionist, nurse */}
          <Route
            path="/wards"
            element={
              <RoleRoute allowedRoles={["admin", "receptionist", "nurse"]}>
                <Wards />
              </RoleRoute>
            }
          />

          {/* Laboratory — accessible to admin, doctor, lab_technician */}
          <Route
            path="/labs"
            element={
              <RoleRoute allowedRoles={["admin", "doctor", "lab_technician"]}>
                <Labs />
              </RoleRoute>
            }
          />

          {/* Pharmacy — accessible to admin, pharmacist */}
          <Route
            path="/pharmacy"
            element={
              <RoleRoute allowedRoles={["admin", "pharmacist"]}>
                <Pharmacy />
              </RoleRoute>
            }
          />

          {/* Employees & HR — accessible to admin */}
          <Route
            path="/employees"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <Employees />
              </RoleRoute>
            }
          />

          {/* Audit Log — accessible to admin */}
          <Route
            path="/audit-log"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <AuditLog />
              </RoleRoute>
            }
          />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Redirect authenticated users away from login page
function LoginRedirect() {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
}
