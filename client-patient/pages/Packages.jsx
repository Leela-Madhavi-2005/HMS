import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeartbeat, FaStethoscope, FaUserMd, FaChild, FaFemale, FaWheelchair, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

export default function Packages() {
  const packages = [
    {
      title: "Full Body Checkup",
      icon: <FaStethoscope />,
      price: "$299",
      duration: "1 Day",
      tests: ["Blood Count", "Lipid Profile", "Liver Function", "Kidney Function", "ECG", "Chest X-Ray"],
      benefits: "Comprehensive health overview for early disease detection.",
      popular: true
    },
    {
      title: "Heart Care Package",
      icon: <FaHeartbeat />,
      price: "$349",
      duration: "1 Day",
      tests: ["TMT / Echo", "Lipid Profile", "ECG", "Cardiologist Consult", "Dietician Consult"],
      benefits: "Detailed cardiovascular assessment for a healthy heart.",
      popular: false
    },
    {
      title: "Diabetes Screening",
      icon: <FaUserMd />,
      price: "$149",
      duration: "Half Day",
      tests: ["HbA1c", "Fasting Blood Sugar", "Urine Routine", "Physician Consult"],
      benefits: "Monitor and manage blood sugar levels effectively.",
      popular: false
    },
    {
      title: "Women's Wellness",
      icon: <FaFemale />,
      price: "$399",
      duration: "1 Day",
      tests: ["Pap Smear", "Mammogram", "Thyroid Profile", "Bone Density", "Gynecologist Consult"],
      benefits: "Tailored health screening specifically for women over 30.",
      popular: true
    },
    {
      title: "Children's Health",
      icon: <FaChild />,
      price: "$199",
      duration: "Half Day",
      tests: ["Growth Assessment", "Vision & Hearing", "Dental Checkup", "Pediatric Consult"],
      benefits: "Ensure your child's milestones and immunity are on track.",
      popular: false
    },
    {
      title: "Senior Citizen Package",
      icon: <FaWheelchair />,
      price: "$449",
      duration: "1.5 Days",
      tests: ["Bone Densitometry", "Arthritis Profile", "Eye & Dental", "Prostate/Ovarian Screen"],
      benefits: "Holistic care focusing on age-related health management.",
      popular: false
    }
  ];

  return (
    <div className="page-animate-fade section-wrapper bg-light" style={{minHeight:'100vh'}}>
      <div className="section-header">
        <h2>Premium Health Packages</h2>
        <p>Preventive healthcare tailored to your needs. Choose a package to safeguard your future.</p>
      </div>

      <div style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '30px', 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>
        {packages.map((pkg, idx) => (
          <div key={idx} style={{
            background: 'var(--premium-surface)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: 'var(--shadow-soft)',
            position: 'relative',
            border: pkg.popular ? '2px solid var(--premium-primary)' : '1px solid #e2e8f0',
            transition: 'var(--transition-smooth)'
          }} className="hover-lift">
            
            {pkg.popular && (
              <div style={{
                position: 'absolute', top: 0, right: '30px', transform: 'translateY(-50%)',
                background: 'var(--premium-primary)', color: 'white', padding: '5px 15px', 
                borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600'
              }}>Most Popular</div>
            )}

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px'}}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '15px', 
                background: 'var(--premium-bg-gradient)', color: 'var(--premium-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'
              }}>
                {pkg.icon}
              </div>
              <h3 style={{fontSize:'2rem', color:'var(--premium-primary)', margin:0}}>{pkg.price}</h3>
            </div>
            
            <h3 style={{fontSize:'1.4rem', marginBottom:'10px'}}>{pkg.title}</h3>
            <p style={{color:'var(--text-muted)', fontSize:'0.95rem', marginBottom:'20px', minHeight:'45px'}}>
              {pkg.benefits}
            </p>
            
            <div style={{background:'var(--premium-bg)', padding:'15px', borderRadius:'12px', marginBottom:'20px'}}>
              <div style={{fontSize:'0.9rem', fontWeight:'600', marginBottom:'10px'}}>Duration: {pkg.duration}</div>
              <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'8px'}}>
                {pkg.tests.map((test, i) => (
                  <li key={i} style={{display:'flex', alignItems:'center', gap:'10px', fontSize:'0.9rem', color:'var(--text-muted)'}}>
                    <FaCheckCircle style={{color:'var(--premium-accent)'}}/> {test}
                  </li>
                ))}
              </ul>
            </div>
            
            <Link to="/register" className="premium-btn btn-primary" style={{width:'100%', justifyContent:'center'}}>
              Book Now <FaArrowRight />
            </Link>
          </div>
        ))}
      </div>

      <style>{`
        .hover-lift:hover {
          transform: translateY(-10px);
          box-shadow: var(--shadow-hover);
        }
      `}</style>
    </div>
  );
}
