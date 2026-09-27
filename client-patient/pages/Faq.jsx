import React, { useState } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    { question: "How do I book an appointment?", answer: "You can book an appointment easily by clicking the 'Book Appointment' button on the navigation bar. You will be redirected to our registration page where you can select your preferred department, doctor, and time slot." },
    { question: "Do you accept international health insurance?", answer: "Yes, we partner with major global health insurance providers. Please visit our Insurance page or contact our admission desk to verify your specific provider." },
    { question: "What are the visiting hours for the ICU?", answer: "To maintain a sterile environment and ensure patient rest, ICU visiting hours are strictly between 10:00 AM - 11:00 AM and 5:00 PM - 6:00 PM. Only one visitor is allowed at a time." },
    { question: "Are my medical records available online?", answer: "Absolutely. Once you register as a patient, you can log in to your Patient Dashboard to view your prescriptions, lab reports, and billing history anytime." },
    { question: "Is there a pharmacy inside the hospital?", answer: "Yes, our in-house pharmacy is open 24/7 and stocks all prescribed medications, surgical items, and general wellness products." }
  ];

  return (
    <div className="page-animate-fade section-wrapper bg-light" style={{minHeight:'100vh'}}>
      <div className="section-header">
        <h2>Frequently Asked Questions</h2>
        <p>Find quick answers to common queries about our services, admissions, and facilities.</p>
      </div>

      <div style={{maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px'}}>
        {faqs.map((faq, idx) => (
          <div key={idx} style={{
            background: 'var(--premium-surface)', borderRadius: '16px', border: '1px solid #e2e8f0',
            overflow: 'hidden', boxShadow: 'var(--shadow-soft)', transition: 'var(--transition-smooth)'
          }}>
            <button 
              onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
              style={{
                width: '100%', padding: '25px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', color: openIndex === idx ? 'var(--premium-primary)' : 'var(--text-main)',
                fontWeight: '600', fontSize: '1.1rem', transition: '0.3s'
              }}
            >
              {faq.question}
              <span style={{
                width: '30px', height: '30px', borderRadius: '50%', background: openIndex === idx ? 'var(--premium-primary)' : 'var(--premium-bg)',
                color: openIndex === idx ? 'white' : 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: '0.3s'
              }}>
                {openIndex === idx ? <FaMinus size={12}/> : <FaPlus size={12}/>}
              </span>
            </button>
            
            <div style={{
              maxHeight: openIndex === idx ? '200px' : '0', overflow: 'hidden', transition: 'max-height 0.4s ease-in-out',
              padding: openIndex === idx ? '0 25px 25px 25px' : '0 25px', color: 'var(--text-muted)', lineHeight: '1.7'
            }}>
              {faq.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
