import React from 'react';
import { FaHeartbeat, FaAppleAlt, FaRunning, FaBrain, FaChild, FaStethoscope } from 'react-icons/fa';

export default function HealthTips() {
  const tips = [
    { title: "Healthy Diet Tips", icon: <FaAppleAlt />, color: "#10b981", excerpt: "Incorporate more leafy greens and lean proteins. A balanced diet is the cornerstone of immunity and longevity." },
    { title: "Daily Exercise Routine", icon: <FaRunning />, color: "#3b82f6", excerpt: "Just 30 minutes of moderate exercise a day can significantly reduce your risk of cardiovascular diseases." },
    { title: "Heart Care Secrets", icon: <FaHeartbeat />, color: "#ef4444", excerpt: "Monitor your cholesterol and blood pressure regularly. Avoid trans fats and excess sodium in your diet." },
    { title: "Mental Wellbeing", icon: <FaBrain />, color: "#8b5cf6", excerpt: "Practice mindfulness and ensure you get 7-8 hours of sleep. Mental health is just as important as physical health." },
    { title: "Child Immunity Booster", icon: <FaChild />, color: "#f59e0b", excerpt: "Ensure your child's vaccination schedule is up to date and encourage outdoor play for natural immunity." },
    { title: "Diabetes Prevention", icon: <FaStethoscope />, color: "#14b8a6", excerpt: "Cut down on refined sugars and simple carbohydrates. Regular checkups are vital if you have a family history." }
  ];

  return (
    <div className="page-animate-fade section-wrapper bg-light" style={{minHeight:'100vh'}}>
      <div className="section-header">
        <h2>Expert Health Tips</h2>
        <p>Stay informed with our doctor-curated advice for a healthier, happier life.</p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px', maxWidth: '1200px', margin: '0 auto'
      }}>
        {tips.map((tip, idx) => (
          <div key={idx} style={{
            background: 'var(--premium-surface)', borderRadius: '20px', padding: '30px',
            boxShadow: 'var(--shadow-soft)', transition: 'var(--transition-smooth)',
            borderTop: `4px solid ${tip.color}`
          }} className="hover-lift">
            <div style={{
              width: '60px', height: '60px', borderRadius: '15px', background: `${tip.color}15`,
              color: tip.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', marginBottom: '20px'
            }}>
              {tip.icon}
            </div>
            <h3 style={{fontSize: '1.3rem', marginBottom: '15px'}}>{tip.title}</h3>
            <p style={{color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '20px'}}>{tip.excerpt}</p>
            <a href="#" style={{color: tip.color, textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px'}}>
              Read Full Article &rarr;
            </a>
          </div>
        ))}
      </div>

      <style>{`
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-hover);
        }
      `}</style>
    </div>
  );
}
