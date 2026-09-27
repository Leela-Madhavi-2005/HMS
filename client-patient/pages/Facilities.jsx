import React from 'react';
import { FaBed, FaVials, FaPills, FaBrain, FaXRay, FaAmbulance, FaCoffee, FaParking } from 'react-icons/fa';

export default function Facilities() {
  const facilities = [
    { title: "Intensive Care Unit (ICU)", icon: <FaBed />, desc: "State-of-the-art life support systems and 24/7 monitoring." },
    { title: "24/7 Blood Bank", icon: <FaVials />, desc: "Fully equipped blood bank with all major blood groups available." },
    { title: "In-house Pharmacy", icon: <FaPills />, desc: "Complete range of medicines available round the clock." },
    { title: "Advanced MRI", icon: <FaBrain />, desc: "High-resolution 3 Tesla MRI for precise diagnostics." },
    { title: "CT Scan & X-Ray", icon: <FaXRay />, desc: "Low-radiation, rapid imaging technology." },
    { title: "Modern Laboratory", icon: <FaVials />, desc: "Automated pathology lab for quick and accurate results." },
    { title: "ALS Ambulances", icon: <FaAmbulance />, desc: "Advanced Life Support fleet ready for immediate dispatch." },
    { title: "Cafeteria", icon: <FaCoffee />, desc: "Hygienic, nutritious food for patients and visitors." },
    { title: "Ample Parking", icon: <FaParking />, desc: "Spacious multi-level parking facility with valet service." }
  ];

  return (
    <div className="page-animate-fade section-wrapper" style={{minHeight:'100vh'}}>
      <div className="section-header">
        <h2>World-Class Facilities</h2>
        <p>Experience healthcare infrastructure designed for excellence and comfort.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '25px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {facilities.map((fac, idx) => (
          <div key={idx} style={{
            background: 'var(--premium-surface)',
            padding: '35px 25px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-soft)',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            transition: 'var(--transition-smooth)'
          }} className="hover-lift">
            <div style={{
              width: '70px', height: '70px', margin: '0 auto 20px',
              borderRadius: '50%', background: 'var(--premium-bg-gradient)',
              color: 'var(--premium-primary)', fontSize: '2rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {fac.icon}
            </div>
            <h3 style={{fontSize:'1.3rem', marginBottom:'15px', color:'var(--text-main)'}}>{fac.title}</h3>
            <p style={{color:'var(--text-muted)', fontSize:'0.95rem', lineHeight:'1.6'}}>{fac.desc}</p>
          </div>
        ))}
      </div>
      
      <style>{`
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-hover);
          border-color: var(--premium-primary);
        }
      `}</style>
    </div>
  );
}
