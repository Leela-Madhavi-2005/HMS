import React from 'react';
import { FaTrophy, FaMedal, FaAward, FaStar } from 'react-icons/fa';

export default function Awards() {
  const awards = [
    { year: "2025", title: "Best Healthcare Award", icon: <FaTrophy />, desc: "Awarded by the National Health Council for excellence in digital healthcare and patient management." },
    { year: "2023", title: "NABH Accreditation", icon: <FaAward />, desc: "Achieved the highest quality standards in hospital accreditation, ensuring top-tier patient safety." },
    { year: "2020", title: "Patient Excellence Award", icon: <FaStar />, desc: "Recognized globally for outstanding patient recovery rates and compassionate care." },
    { year: "2015", title: "ISO 9001:2015 Certification", icon: <FaMedal />, desc: "Certified for maintaining exceptional quality management systems in healthcare delivery." }
  ];

  return (
    <div className="page-animate-fade section-wrapper" style={{minHeight:'100vh'}}>
      <div className="section-header">
        <h2>Awards & Accreditations</h2>
        <p>A legacy of excellence recognized by the world's leading healthcare institutions.</p>
      </div>

      <div style={{maxWidth: '800px', margin: '0 auto', padding: '20px'}}>
        {awards.map((award, idx) => (
          <div key={idx} style={{
            display: 'flex', gap: '30px', marginBottom: '40px', position: 'relative'
          }}>
            {/* Timeline Line */}
            {idx !== awards.length - 1 && (
              <div style={{
                position: 'absolute', left: '35px', top: '70px', bottom: '-40px',
                width: '2px', background: 'var(--premium-primary)', opacity: 0.2
              }}></div>
            )}
            
            {/* Timeline Icon */}
            <div style={{
              width: '70px', height: '70px', minWidth: '70px',
              borderRadius: '50%', background: 'var(--premium-primary)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)', zIndex: 1
            }}>
              {award.icon}
            </div>
            
            {/* Timeline Content */}
            <div style={{
              background: 'var(--premium-surface)', padding: '30px', borderRadius: '16px',
              boxShadow: 'var(--shadow-soft)', flex: 1, border: '1px solid #e2e8f0',
              transition: 'var(--transition-smooth)'
            }} className="award-card">
              <span style={{
                display: 'inline-block', background: 'var(--premium-bg-gradient)',
                color: 'var(--premium-primary)', padding: '5px 15px', borderRadius: '20px',
                fontWeight: '700', fontSize: '0.9rem', marginBottom: '10px'
              }}>{award.year}</span>
              <h3 style={{fontSize: '1.5rem', marginBottom: '10px'}}>{award.title}</h3>
              <p style={{color: 'var(--text-muted)', lineHeight: '1.6'}}>{award.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .award-card:hover {
          transform: translateX(10px);
          box-shadow: var(--shadow-hover);
          border-color: var(--premium-primary);
        }
      `}</style>
    </div>
  );
}
