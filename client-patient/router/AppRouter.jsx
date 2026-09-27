import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicLayout from "../layouts/PublicLayout";

import Home from "../pages/Home";
import About from "../pages/About";
import Services from "../pages/Services";
import Departments from "../pages/Departments";
import Doctors from "../pages/Doctors";
import Gallery from "../pages/Gallery";
import Testimonials from "../pages/Testimonials";
import Emergency from "../pages/Emergency";

import Facilities from "../pages/Facilities";
import Insurance from "../pages/Insurance";

import Register from "../pages/Register";
import Login from "../pages/Login";
import PatientDashboard from "../pages/PatientDashboard";
import Appointments from "../pages/Appointments";
import Prescriptions from "../pages/Prescriptions";
import Bills from "../pages/Bills";
import PatientProfile from "../pages/PatientProfile";
import MediCare from "../pages/MediCare";
import ConsultationDetails from "../pages/ConsultationDetails";

function DashboardRedirect() {
  const { userRole } = useAuth();
  
  if (userRole === "patient") return <Navigate to="/dashboard" replace />;
  if (userRole === "doctor") return <Navigate to="http://localhost:5174/" replace />;
  if (userRole === "receptionist" || userRole === "admin") return <Navigate to="http://localhost:5175/" replace />;
  
  return <Navigate to="/login" replace />;
}

function LoginRedirect() {
  const { currentUser } = useAuth();
  if (currentUser) {
    return <DashboardRedirect />;
  }
  return <Login />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Public Routes with Floating Navbar */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/facilities" element={<Facilities />} />
          <Route path="/insurance" element={<Insurance />} />
        </Route>

        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes */}
        <Route path="/" element={<ProtectedRoute allowedRoles={["patient"]}><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="bills" element={<Bills />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="medicare" element={<MediCare />} />
          <Route path="consultation/:id" element={<ConsultationDetails />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
