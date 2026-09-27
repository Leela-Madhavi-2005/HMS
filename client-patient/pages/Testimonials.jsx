import React from 'react';
import { FaStar } from 'react-icons/fa';

export default function Testimonials() {
  const testimonials = [
    { name: "Sarah Jenkins", text: "The level of care at MediCare is simply unmatched. From the front desk to the surgical team, everyone treated me with incredible compassion." },
    { name: "Mark Robinson", text: "Dr. Carter in Cardiology saved my life. The advanced equipment and her expertise made all the difference. I highly recommend this hospital." },
    { name: "Amanda Lee", text: "The digital portal makes booking appointments and checking my prescriptions so easy! I don't have to wait in line anymore." },
    { name: "David Kim", text: "My daughter's pediatrician was incredibly gentle and kind. We are so happy to have found MediCare for our family's health needs." }
  ];

  return (
    <div className="page-animate-fade testimonials-section" style={{minHeight:'100vh', display:'flex', flexDirection:'column', justifyContent:'center'}}>
      <div className="section-header">
        <h2>Patient Stories</h2>
        <p>Hear what our patients have to say about their recovery journey.</p>
      </div>
      <div className="testimonials-carousel" style={{flexWrap:'wrap', justifyContent:'center'}}>
        {testimonials.map((t, i) => (
          <div key={i} className="test-card" style={{margin:'15px', maxWidth:'450px'}}>
            <div className="test-user">
              <div className="test-avatar"></div>
              <div>
                <h4 style={{margin:0}}>{t.name}</h4>
                <div style={{color:'#f59e0b', fontSize:'0.9rem'}}><FaStar/><FaStar/><FaStar/><FaStar/><FaStar/></div>
              </div>
            </div>
            <p className="test-quote">"{t.text}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}
