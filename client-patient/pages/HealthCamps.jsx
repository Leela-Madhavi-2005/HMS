import React from 'react';
import { FaCalendarDay, FaMapMarkerAlt, FaUsers, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function HealthCamps() {
  const camps = [
    { title: "Free Diabetes Screening Camp", date: "November 10 - 12, 2026", location: "Main Campus Atrium", audience: "Open to All Ages", icon: "🩸", color: "#ef4444" },
    { title: "Women's Wellness & Mammography Drive", date: "December 01 - 05, 2026", location: "Block B, Platinum Wing", audience: "Women (Age 30+)", icon: "🎀", color: "#ec4899" },
    { title: "Pediatric Vaccination Drive", date: "January 15, 2027", location: "Pediatrics Ward", audience: "Children (0-12 Years)", icon: "👶", color: "#3b82f6" }
  ];

  return (
    <div className="page-animate-fade section-wrapper" style={{minHeight:'100vh'}}>
      <div className="section-header">
        <h2>Upcoming Health Camps</h2>
        <p>Participate in our community outreach programs for free screenings and expert consultations.</p>
      </div>

      <div style={{maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '25px'}}>
        {camps.map((camp, idx) => (
          <div key={idx} style={{
            background: 'var(--premium-surface)', borderRadius: '20px', padding: '30px',
            boxShadow: 'var(--shadow-soft)', display: 'flex', gap: '30px', alignItems: 'center',
            border: '1px solid #e2e8f0', transition: 'var(--transition-smooth)', flexWrap: 'wrap'
          }} className="camp-card">
            
            <div style={{
              width: '100px', height: '100px', borderRadius: '20px', background: `${camp.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem'
            }}>
              {camp.icon}
            </div>
            
            <div style={{flex: 1, minWidth: '300px'}}>
              <h3 style={{fontSize: '1.4rem', marginBottom: '15px'}}>{camp.title}</h3>
              <div style={{display: 'flex', gap: '20px', color: 'var(--text-muted)', fontSize: '0.95rem', flexWrap: 'wrap'}}>
                <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><FaCalendarDay style={{color: 'var(--premium-primary)'}}/> {camp.date}</span>
                <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><FaMapMarkerAlt style={{color: 'var(--premium-primary)'}}/> {camp.location}</span>
                <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><FaUsers style={{color: 'var(--premium-primary)'}}/> {camp.audience}</span>
              </div>
            </div>

            <div>
              <Link to="/register" className="premium-btn btn-primary" style={{padding: '12px 25px'}}>
                Register Free <FaArrowRight style={{marginLeft: '8px', fontSize: '0.8rem'}}/>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .camp-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-hover);
          border-color: var(--premium-primary);
        }
      `}</style>
    </div>
  );
}
