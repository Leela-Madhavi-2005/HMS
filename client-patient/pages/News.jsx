import React from 'react';
import { FaCalendarAlt, FaUserEdit, FaArrowRight } from 'react-icons/fa';

export default function News() {
  const newsItems = [
    { title: "MediCare Launches New Robotic Surgery Wing", date: "Oct 15, 2026", author: "Admin", img: "/src/assets/gallery/cath_lab.jpg", excerpt: "Our hospital has successfully integrated the latest da Vinci robotic surgical systems to enhance precision." },
    { title: "Free Cardiac Screening Camp Concludes Successfully", date: "Sep 28, 2026", author: "Dr. Carter", img: "/src/assets/slider/1.jpg", excerpt: "Over 500 patients were screened during our recent 3-day cardiac health initiative." },
    { title: "NABH Re-accreditation Achieved for 2026-2029", date: "Aug 10, 2026", author: "Quality Team", img: "/src/assets/gallery/hospital.jpg", excerpt: "We are proud to announce that MediCare has once again met the highest standards of hospital quality." },
  ];

  return (
    <div className="page-animate-fade section-wrapper bg-light" style={{minHeight:'100vh'}}>
      <div className="section-header">
        <h2>News & Blogs</h2>
        <p>Stay updated with the latest advancements, events, and announcements from MediCare.</p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '30px', maxWidth: '1200px', margin: '0 auto'
      }}>
        {newsItems.map((news, idx) => (
          <div key={idx} style={{
            background: 'var(--premium-surface)', borderRadius: '20px', overflow: 'hidden',
            boxShadow: 'var(--shadow-soft)', transition: 'var(--transition-smooth)'
          }} className="news-card">
            <div style={{height: '220px', overflow: 'hidden'}}>
              <img src={news.img} alt={news.title} style={{width: '100%', height: '100%', objectFit: 'cover', transition: '0.5s'}} className="news-img"/>
            </div>
            <div style={{padding: '30px'}}>
              <div style={{display: 'flex', gap: '15px', color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '15px'}}>
                <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><FaCalendarAlt /> {news.date}</span>
                <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><FaUserEdit /> {news.author}</span>
              </div>
              <h3 style={{fontSize: '1.3rem', marginBottom: '15px', color: 'var(--text-main)', lineHeight: '1.4'}}>{news.title}</h3>
              <p style={{color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px'}}>{news.excerpt}</p>
              <a href="#" style={{color: 'var(--premium-primary)', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px'}}>
                Read Full Story <FaArrowRight style={{fontSize: '0.8rem'}}/>
              </a>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .news-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-hover);
        }
        .news-card:hover .news-img {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
