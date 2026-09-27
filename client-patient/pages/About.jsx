import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="page-animate-fade section-wrapper" style={{minHeight:'100vh', display:'flex', alignItems:'center'}}>
      <div style={{display:'flex', gap:'50px', alignItems:'center', flexWrap:'wrap', maxWidth: '1200px', margin: '0 auto'}}>
        <div style={{flex: 1, minWidth:'300px'}}>
          <img src="/src/assets/gallery/hospital.jpg" alt="MediCare Building" style={{width:'100%', borderRadius:'24px', boxShadow:'var(--shadow-soft)'}}/>
        </div>
        <div style={{flex: 1, minWidth:'300px'}}>
          <h2 style={{fontSize:'3rem', marginBottom:'20px'}}>About <span style={{color:'var(--premium-primary)'}}>MediCare</span></h2>
          <p style={{fontSize:'1.1rem', color:'var(--text-muted)', lineHeight:'1.8', marginBottom:'20px'}}>
            MediCare was established with a singular vision: to bring world-class, premium healthcare to everyone. For over 15 years, we have been at the forefront of medical innovation, combining cutting-edge technology with compassionate care.
          </p>
          <p style={{fontSize:'1.1rem', color:'var(--text-muted)', lineHeight:'1.8', marginBottom:'30px'}}>
            Our facility houses over 20 specialized departments, 50 internationally recognized doctors, and a fully digitized portal for patient management. We believe that your health is our priority, and we strive to ensure every patient experiences a seamless recovery journey.
          </p>
          <Link to="/register" className="premium-btn btn-primary">Join Our Care Network</Link>
        </div>
      </div>
    </div>
  );
}
