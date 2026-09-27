import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaBed,
  FaCalendarCheck,
  FaFileMedical,
  FaFlask,
  FaHeartbeat,
  FaImages,
  FaMapMarkerAlt,
  FaPills,
  FaReceipt,
  FaStethoscope,
  FaUserMd,
} from 'react-icons/fa';

import campusImg from '../assets/gallery/hospital.jpg';
import receptionImg from '../assets/gallery/reception.jpg';
import cathLabImg from '../assets/gallery/cath_lab.jpg';
import roomImg from '../assets/gallery/room1.jpg';
import doctorImg from '../assets/team/1.jpg';

export default function Home() {
  const stats = [
    { label: 'Doctors', value: '2', note: 'General Medicine & Cardiology' },
    { label: 'Departments', value: '8', note: 'Listed centers of excellence' },
    { label: 'Ward Beds', value: '10', note: 'General and ICU capacity' },
    { label: 'Appointments', value: '4', note: 'Seeded patient visit records' },
  ];

  const careFlow = [
    { icon: <FaCalendarCheck />, title: 'Book Appointments', desc: 'Patients can request visits and track appointment status online.' },
    { icon: <FaFileMedical />, title: 'Digital Prescriptions', desc: 'Doctors can record prescriptions and patients can view them securely.' },
    { icon: <FaReceipt />, title: 'Billing Records', desc: 'Paid and unpaid bills stay connected with each patient profile.' },
    { icon: <FaFlask />, title: 'Lab Reports', desc: 'CBC and ECG reports are managed through the hospital system.' },
    { icon: <FaPills />, title: 'Pharmacy Stock', desc: 'Medicine batches, expiry dates, quantity, and pricing are tracked.' },
    { icon: <FaBed />, title: 'Ward Management', desc: 'General and ICU ward beds show available, occupied, and maintenance states.' },
  ];

  const quickLinks = [
    { to: '/about', img: receptionImg, title: 'About MediCare', desc: 'Learn about the campus, patient-first care, and hospital services.' },
    { to: '/doctors', img: doctorImg, title: 'Meet Doctors', desc: 'View the medical specialists available for consultation.' },
    { to: '/departments', img: cathLabImg, title: 'Departments', desc: 'Explore cardiology, neurology, orthopedics, pediatrics, and more.' },
  ];

  return (
    <div className="page-animate-fade home-page">
      <section className="home-hero-section">
        <div className="home-hero-copy">
          <h1 className="home-hero-title">Care You Can Trust</h1>
          <p>
            A connected hospital portal for patients and staff, supported by real modules for doctors,
            prescriptions, pharmacy stock, ward beds, lab reports, appointments, and bills.
          </p>
          <div className="home-hero-actions">
            <Link to="/register" className="premium-btn btn-appointment-yellow">Book Appointment <FaArrowRight /></Link>
            <Link to="/gallery" className="premium-btn btn-white"><FaImages /> View Campus Gallery</Link>
          </div>
          <div className="home-location-pill">
            <FaMapMarkerAlt />
            <span>Hospital campus and care spaces showcased from local assets</span>
          </div>
        </div>

        <div className="home-campus-showcase">
          <img src={campusImg} alt="MediCare hospital campus" />
          <div className="home-campus-card">
            <FaHeartbeat />
            <div>
              <strong>24/7 care workflow</strong>
              <span>Emergency, OPD, wards, pharmacy, and lab coordination</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-stats-section" aria-label="Current HMS data snapshot">
        <div className="home-stats-header">
          <span>Current HMS Snapshot</span>
          <p>Numbers are aligned with the project seed data and public department list.</p>
        </div>
        <div className="home-stats-grid">
          {stats.map((item) => (
            <div key={item.label} className="home-stat-card">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-campus-section">
        <div className="home-section-copy">
          <span className="home-eyebrow"><FaStethoscope /> Campus Care Areas</span>
          <h2>Built around the patient visit journey.</h2>
          <p>
            From reception and consultation to diagnostics, admission, billing, and medicines,
            MediCare keeps each step organized through the hospital management system.
          </p>
        </div>
        <div className="home-campus-grid">
          <img src={receptionImg} alt="MediCare reception area" />
          <img src={roomImg} alt="MediCare patient room" />
          <img src={cathLabImg} alt="MediCare cath lab" />
        </div>
      </section>

      <section className="home-workflow-section">
        <div className="section-header">
          <h2>Hospital Workflows</h2>
          <p>Useful modules are already connected across the patient and staff experience.</p>
        </div>
        <div className="home-workflow-grid">
          {careFlow.map((item) => (
            <div key={item.title} className="home-workflow-card">
              <div className="feature-icon-wrapper">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-quick-section">
        <div className="section-header">
          <h2>Discover MediCare</h2>
          <p>Continue into the existing pages without changing the app flow.</p>
        </div>
        <div className="home-quick-grid">
          {quickLinks.map((item) => (
            <Link key={item.title} to={item.to} className="home-quick-card">
              <img src={item.img} alt={item.title} />
              <div>
                <span>{item.title}</span>
                <p>{item.desc}</p>
                <strong>Open page <FaArrowRight /></strong>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-appointment-band">
        <div>
          <h2>Need a consultation?</h2>
          <p>Patients can register, book an appointment, and continue into the dashboard for prescriptions and bills.</p>
        </div>
        <Link to="/register" className="premium-btn btn-appointment-yellow">Book Appointment <FaArrowRight /></Link>
      </section>
    </div>
  );
}
