import React from 'react';
import { Link } from 'react-router-dom';
import { FaStethoscope, FaStar, FaClock } from 'react-icons/fa';

export default function Doctors() {
  const doctors = [
    { id: 1, name: "Dr. Emily Carter", qual: "MD, FACC", dept: "Cardiology", exp: "15 Years", timing: "9:00 AM - 5:00 PM", rating: "4.9" },
    { id: 2, name: "Dr. Michael Wilson", qual: "PhD", dept: "Neurology", exp: "12 Years", timing: "10:00 AM - 4:00 PM", rating: "4.8" },
    { id: 3, name: "Dr. Sarah Johnson", qual: "MD, FAAP", dept: "Pediatrics", exp: "10 Years", timing: "8:00 AM - 2:00 PM", rating: "5.0" },
    { id: 4, name: "Dr. David Brown", qual: "MS Ortho", dept: "Orthopedics", exp: "18 Years", timing: "1:00 PM - 7:00 PM", rating: "4.9" },
    { id: 5, name: "Dr. Olivia Martinez", qual: "MD", dept: "General Medicine", exp: "8 Years", timing: "9:00 AM - 6:00 PM", rating: "4.7" },
    { id: 6, name: "Dr. James Anderson", qual: "BDS, MDS", dept: "Dentistry", exp: "14 Years", timing: "10:00 AM - 5:00 PM", rating: "4.8" },
  ];

  return (
    <div className="page-animate-fade section-wrapper bg-light" style={{minHeight:'100vh'}}>
      <div className="section-header">
        <h2>Meet Our Specialists</h2>
        <p>Highly qualified professionals dedicated to your recovery.</p>
      </div>
      <div className="doctors-grid">
        {doctors.map(doc => (
          <div key={doc.id} className="doctor-card">
            <div className="doctor-img-box">
              <img src={`/src/assets/team/${doc.id}.jpg`} alt={doc.name} />
              <div className="doc-dept-badge">{doc.dept}</div>
            </div>
            <div className="doctor-info">
              <h3>{doc.name}</h3>
              <div className="doc-qual">{doc.qual}</div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'15px', marginBottom:'15px'}}>
                <div className="doc-exp"><FaStethoscope /> {doc.exp}</div>
                <div className="doc-exp" style={{color:'var(--text-main)'}}><FaClock /> {doc.timing}</div>
              </div>
              <div className="doc-rating" style={{borderTop:'1px solid #e2e8f0', paddingTop:'15px'}}>
                <FaStar /> <FaStar /> <FaStar /> <FaStar /> <FaStar style={{color: '#d1d5db'}}/>
                <span style={{color: '#64748b', marginLeft: '5px'}}>{doc.rating} Rating</span>
              </div>
              <Link to="/register" className="premium-btn btn-appointment-yellow" style={{marginTop:'20px'}}>Book Appointment</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
