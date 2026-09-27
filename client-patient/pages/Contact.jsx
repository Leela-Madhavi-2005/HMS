import React from 'react';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';

export default function Contact() {
  return (
    <div className="page-animate-fade section-wrapper bg-light" style={{minHeight:'100vh', display:'flex', alignItems:'center'}}>
      <div style={{width:'100%', maxWidth:'1200px', margin:'0 auto'}}>
        <div className="section-header">
          <h2>Get in Touch</h2>
          <p>We are here to help you 24/7. Reach out to us for any queries.</p>
        </div>
        
        <div style={{display:'flex', gap:'50px', flexWrap:'wrap'}}>
          <div style={{flex: 1, minWidth:'300px', background:'white', padding:'40px', borderRadius:'24px', boxShadow:'var(--shadow-soft)'}}>
            <h3>Contact Information</h3>
            <p style={{color:'var(--text-muted)', marginBottom:'30px'}}>Our reception desk is open for inquiries.</p>
            
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <div style={{width:'50px', height:'50px', background:'var(--premium-primary)', color:'white', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem'}}><FaPhoneAlt /></div>
                <div>
                  <strong style={{display:'block'}}>Phone</strong>
                  <span style={{color:'var(--text-muted)'}}>+1 (800) 123-4567</span>
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <div style={{width:'50px', height:'50px', background:'var(--premium-primary)', color:'white', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem'}}><FaEnvelope /></div>
                <div>
                  <strong style={{display:'block'}}>Email</strong>
                  <span style={{color:'var(--text-muted)'}}>contact@medicare.com</span>
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <div style={{width:'50px', height:'50px', background:'var(--premium-primary)', color:'white', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem'}}><FaMapMarkerAlt /></div>
                <div>
                  <strong style={{display:'block'}}>Location</strong>
                  <span style={{color:'var(--text-muted)'}}>123 Healthcare Ave, NY</span>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{flex: 1, minWidth:'300px', background:'white', padding:'40px', borderRadius:'24px', boxShadow:'var(--shadow-soft)'}}>
            <h3>Send a Message</h3>
            <form style={{display:'flex', flexDirection:'column', gap:'20px', marginTop:'20px'}} onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder="Your Name" style={{padding:'15px', borderRadius:'10px', border:'1px solid #e2e8f0', fontFamily:'inherit'}} required />
              <input type="email" placeholder="Your Email" style={{padding:'15px', borderRadius:'10px', border:'1px solid #e2e8f0', fontFamily:'inherit'}} required />
              <textarea placeholder="Your Message" rows="4" style={{padding:'15px', borderRadius:'10px', border:'1px solid #e2e8f0', fontFamily:'inherit'}} required></textarea>
              <button type="submit" className="premium-btn btn-primary" style={{width:'100%'}}>Send Message <FaArrowRight /></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
