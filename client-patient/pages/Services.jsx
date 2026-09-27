import React from 'react';
import { FaLaptopMedical, FaHospitalUser, FaUserMd, FaPills, FaAmbulance, FaFileMedical, FaStethoscope, FaCheckCircle } from 'react-icons/fa';

export default function Services() {
  const features = [
    { icon: <FaUserMd />, title: "Experienced Doctors", desc: "Our team consists of internationally trained medical experts." },
    { icon: <FaLaptopMedical />, title: "Advanced Equipment", desc: "State-of-the-art diagnostic and surgical technology." },
    { icon: <FaAmbulance />, title: "24×7 Emergency", desc: "Round-the-clock emergency and trauma care services." },
    { icon: <FaFileMedical />, title: "Online Appointment", desc: "Book your visits easily from home." },
    { icon: <FaStethoscope />, title: "Digital Reports", desc: "Access your medical history securely online." },
    { icon: <FaHospitalUser />, title: "Affordable Healthcare", desc: "Premium care at accessible pricing." },
    { icon: <FaPills />, title: "Pharmacy", desc: "Fully stocked 24/7 in-house pharmacy." },
    { icon: <FaCheckCircle />, title: "Ambulance Service", desc: "Rapid response fleet for critical emergencies." },
  ];

  return (
    <div className="page-animate-fade section-wrapper bg-light" style={{minHeight:'100vh'}}>
      <div className="section-header">
        <h2>Our Services</h2>
        <p>Comprehensive healthcare solutions designed for your comfort and speedy recovery.</p>
      </div>
      <div className="features-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon-wrapper">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
