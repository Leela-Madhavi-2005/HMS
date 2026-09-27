import React from 'react';
import { FaShieldAlt, FaCheckCircle, FaFileMedicalAlt, FaHospitalUser } from 'react-icons/fa';

export default function Insurance() {
  const partners = [
    { name: "MediCare Shield", tier: "Premium Partner" },
    { name: "Global Health Insure", tier: "Gold Partner" },
    { name: "CareFirst Alliance", tier: "Gold Partner" },
    { name: "LifeGuard Health", tier: "Silver Partner" },
    { name: "SafeCare Solutions", tier: "Silver Partner" },
    { name: "Wellness Prime", tier: "Silver Partner" },
  ];

  const steps = [
    { icon: <FaHospitalUser />, title: "1. Admission", desc: "Present your insurance card at the admission desk." },
    { icon: <FaFileMedicalAlt />, title: "2. Pre-Auth", desc: "Our desk sends a pre-authorization request to your insurer." },
    { icon: <FaCheckCircle />, title: "3. Approval", desc: "Once approved, you enjoy cashless treatment." },
    { icon: <FaShieldAlt />, title: "4. Discharge", desc: "Final bill is settled directly with your insurance provider." }
  ];

  return (
    <div className="page-animate-fade section-wrapper bg-light" style={{minHeight:'100vh'}}>
      <div className="section-header">
        <h2>Insurance & Cashless Facility</h2>
        <p>Your health should be your only focus. We handle the paperwork.</p>
      </div>

      {/* Process Section */}
      <div style={{maxWidth:'1200px', margin:'0 auto 60px'}}>
        <h3 style={{textAlign:'center', marginBottom:'40px', fontSize:'1.8rem', color:'var(--text-main)'}}>Cashless Treatment Process</h3>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'30px'}}>
          {steps.map((step, idx) => (
            <div key={idx} style={{
              background:'var(--premium-surface)', padding:'30px', borderRadius:'20px', 
              boxShadow:'var(--shadow-soft)', textAlign:'center', position:'relative', zIndex:1
            }}>
              <div style={{
                width:'60px', height:'60px', background:'var(--premium-primary)', color:'white',
                borderRadius:'15px', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1.8rem', margin:'0 auto 20px', transform:'rotate(10deg)'
              }}>
                <div style={{transform:'rotate(-10deg)'}}>{step.icon}</div>
              </div>
              <h4 style={{fontSize:'1.2rem', marginBottom:'10px'}}>{step.title}</h4>
              <p style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Partners Section */}
      <div style={{maxWidth:'1200px', margin:'0 auto'}}>
        <h3 style={{textAlign:'center', marginBottom:'40px', fontSize:'1.8rem', color:'var(--text-main)'}}>Our Insurance Partners</h3>
        <div style={{display:'flex', flexWrap:'wrap', gap:'20px', justifyContent:'center'}}>
          {partners.map((partner, idx) => (
            <div key={idx} className="partner-card hover-lift" style={{
              background:'white', border:'1px solid #e2e8f0', borderRadius:'16px', padding:'30px',
              width:'250px', textAlign:'center', transition:'var(--transition-smooth)'
            }}>
              <FaShieldAlt style={{fontSize:'2.5rem', color:'var(--premium-secondary)', marginBottom:'15px'}}/>
              <h4 style={{margin:'0 0 5px 0', fontSize:'1.1rem'}}>{partner.name}</h4>
              <span style={{fontSize:'0.8rem', color:'var(--premium-primary)', fontWeight:'600', textTransform:'uppercase'}}>{partner.tier}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-hover);
          border-color: var(--premium-primary);
        }
      `}</style>
    </div>
  );
}
