import React from 'react';
import { FaHeartbeat, FaBrain, FaBone, FaBaby, FaStethoscope, FaUserMd, FaTooth, FaXRay } from 'react-icons/fa';

export default function Departments() {
  const departments = [
    { icon: <FaHeartbeat />, name: "Cardiology", desc: "Advanced heart care and cardiovascular surgery." },
    { icon: <FaBrain />, name: "Neurology", desc: "Brain, spine, and nervous system disorders." },
    { icon: <FaBone />, name: "Orthopedics", desc: "Bone and joint specialists, physical therapy." },
    { icon: <FaBaby />, name: "Pediatrics", desc: "Child care experts and neonatal care." },
    { icon: <FaStethoscope />, name: "General Medicine", desc: "Primary healthcare and chronic disease management." },
    { icon: <FaUserMd />, name: "Dermatology", desc: "Skin, hair and nail treatments." },
    { icon: <FaTooth />, name: "Dentistry", desc: "Complete oral care and maxillofacial surgery." },
    { icon: <FaXRay />, name: "Radiology", desc: "Advanced imaging, MRI, and CT scans." },
  ];

  return (
    <div className="page-animate-fade section-wrapper" style={{minHeight:'100vh'}}>
      <div className="section-header">
        <h2>Centers of Excellence</h2>
        <p>Explore our specialized medical departments equipped with world-class facilities.</p>
      </div>
      <div className="dept-grid">
        {departments.map((d, i) => (
          <div key={i} className="dept-card">
            <div className="dept-icon">{d.icon}</div>
            <h3>{d.name}</h3>
            <p>{d.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
