import React from 'react';
import { FaAmbulance, FaPhoneAlt, FaHospitalAlt, FaHeartbeat } from 'react-icons/fa';

export default function Emergency() {
  return (
    <div className="page-animate-fade section-wrapper" style={{minHeight:'100vh', display:'flex', alignItems:'center', background:'#fee2e2'}}>
      <div style={{width:'100%', maxWidth:'1000px', margin:'0 auto', textAlign:'center'}}>
        <div style={{width:'100px', height:'100px', background:'#ef4444', color:'white', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', margin:'0 auto 30px', animation:'pulse-red 2s infinite'}}>
          <FaAmbulance />
        </div>
        <h2 style={{fontSize:'3.5rem', color:'#991b1b', marginBottom:'20px'}}>24/7 Emergency Services</h2>
        <p style={{fontSize:'1.3rem', color:'#7f1d1d', marginBottom:'40px', maxWidth:'600px', margin:'0 auto 40px'}}>
          If you are experiencing a medical emergency, please do not wait. Call our dedicated emergency hotline immediately or proceed to the nearest emergency room.
        </p>
        
        <div style={{display:'flex', justifyContent:'center', gap:'30px', flexWrap:'wrap', marginBottom:'50px'}}>
          <a href="tel:911" className="premium-btn" style={{background:'#dc2626', color:'white', fontSize:'1.5rem', padding:'20px 40px'}}>
            <FaPhoneAlt /> Call Ambulance: 911
          </a>
          <a href="tel:18001234567" className="premium-btn btn-white" style={{color:'#dc2626', fontSize:'1.5rem', padding:'20px 40px'}}>
            <FaHospitalAlt /> ER Desk: 1-800-123
          </a>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'20px', textAlign:'left'}}>
          <div style={{background:'white', padding:'30px', borderRadius:'16px', boxShadow:'var(--shadow-soft)'}}>
            <FaHeartbeat style={{fontSize:'2rem', color:'#dc2626', marginBottom:'15px'}}/>
            <h3 style={{color:'#991b1b'}}>Trauma Center</h3>
            <p style={{color:'var(--text-muted)'}}>Level 1 Trauma center equipped for all critical injuries and surgical emergencies.</p>
          </div>
          <div style={{background:'white', padding:'30px', borderRadius:'16px', boxShadow:'var(--shadow-soft)'}}>
            <FaAmbulance style={{fontSize:'2rem', color:'#dc2626', marginBottom:'15px'}}/>
            <h3 style={{color:'#991b1b'}}>Rapid Fleet</h3>
            <p style={{color:'var(--text-muted)'}}>Advanced Life Support (ALS) ambulances ready to dispatch within seconds.</p>
          </div>
          <div style={{background:'white', padding:'30px', borderRadius:'16px', boxShadow:'var(--shadow-soft)'}}>
            <FaHospitalAlt style={{fontSize:'2rem', color:'#dc2626', marginBottom:'15px'}}/>
            <h3 style={{color:'#991b1b'}}>Direct Admission</h3>
            <p style={{color:'var(--text-muted)'}}>Zero waiting time for critical patients. Direct routing to ICU or Operation Theatre.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
