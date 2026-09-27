import React, { useMemo, useState } from 'react';
import { FaHeartbeat, FaHospital, FaMapMarkerAlt, FaMicroscope, FaQuoteLeft, FaSearchPlus, FaStar, FaTimes, FaUserMd } from 'react-icons/fa';

import hospitalImg from '../assets/gallery/hospital.jpg';
import receptionImg from '../assets/gallery/reception.jpg';
import opdImg from '../assets/gallery/opd.jpg';
import opd2Img from '../assets/gallery/opd2.jpg';
import roomImg from '../assets/gallery/room1.jpg';
import cathLabImg from '../assets/gallery/cath_lab.jpg';
import platinumWingImg from '../assets/gallery/platinum_wing.jpg';
import parkingImg from '../assets/gallery/parking.jpg';
import sliderImg from '../assets/slider/1.jpg';
import careImg from '../assets/careyoucantrust.png';
import blogOneImg from '../assets/blogs/1.jpg';
import blogTwoImg from '../assets/blogs/2.jpg';
import blogThreeImg from '../assets/blogs/3.jpg';
import blogFourImg from '../assets/blogs/4.jpg';
import teamOneImg from '../assets/team/1.jpg';
import teamTwoImg from '../assets/team/2.jpg';
import teamThreeImg from '../assets/team/3.jpg';
import teamFourImg from '../assets/team/4.jpg';
import teamFiveImg from '../assets/team/5.jpg';
import teamSixImg from '../assets/team/6.jpg';
import teamSevenImg from '../assets/team/7.jpg';
import teamEightImg from '../assets/team/8.jpg';

const categories = [
  'All',
  'Campus',
  'Patient Areas',
  'Diagnostics',
  'Doctors',
  'Care Moments',
  'Events',
  'Testimonials',
];

const galleryImages = [
  { src: hospitalImg, title: 'MediCare Hospital Campus', category: 'Campus', size: 'wide' },
  { src: receptionImg, title: 'Main Reception Lounge', category: 'Patient Areas', size: 'tall' },
  { src: opdImg, title: 'Outpatient Care Unit', category: 'Patient Areas' },
  { src: opd2Img, title: 'Consultation Waiting Area', category: 'Patient Areas' },
  { src: roomImg, title: 'Private Recovery Suite', category: 'Patient Areas', size: 'wide' },
  { src: cathLabImg, title: 'Advanced Cath Lab', category: 'Diagnostics' },
  { src: platinumWingImg, title: 'Platinum Care Wing', category: 'Patient Areas' },
  { src: parkingImg, title: 'Visitor Parking & Access', category: 'Campus', size: 'tall' },
  { src: sliderImg, title: 'Modern Care Environment', category: 'Campus', size: 'wide' },
  { src: careImg, title: 'Care You Can Trust', category: 'Care Moments' },
  { src: blogOneImg, title: 'Health Awareness Session', category: 'Events' },
  { src: blogTwoImg, title: 'Community Wellness Program', category: 'Events', size: 'wide' },
  { src: blogThreeImg, title: 'Patient Education Moment', category: 'Care Moments' },
  { src: blogFourImg, title: 'Clinical Care Story', category: 'Care Moments' },
  { src: teamOneImg, title: 'Senior Medical Specialist', category: 'Doctors' },
  { src: teamTwoImg, title: 'Consultant Physician', category: 'Doctors', size: 'tall' },
  { src: teamThreeImg, title: 'Care Team Member', category: 'Doctors' },
  { src: teamFourImg, title: 'Department Specialist', category: 'Doctors' },
  { src: teamFiveImg, title: 'Patient Care Doctor', category: 'Doctors' },
  { src: teamSixImg, title: 'Clinical Specialist', category: 'Doctors', size: 'wide' },
  { src: teamSevenImg, title: 'Medical Consultant', category: 'Doctors' },
  { src: teamEightImg, title: 'Healthcare Professional', category: 'Doctors' },
];

const testimonialItems = [
  {
    type: 'testimonial',
    category: 'Testimonials',
    name: 'Sarah Jenkins',
    title: 'Compassion from entry to discharge',
    text: 'The care at MediCare felt organized and kind. From reception to the clinical team, every step was clearly handled.',
  },
  {
    type: 'testimonial',
    category: 'Testimonials',
    name: 'Mark Robinson',
    title: 'Cardiology care that built confidence',
    text: 'The cardiology consultation and diagnostic process were smooth. The team explained my reports and next steps clearly.',
  },
  {
    type: 'testimonial',
    category: 'Testimonials',
    name: 'Amanda Lee',
    title: 'The portal saves time',
    text: 'Booking appointments and checking prescriptions online made follow-up care much easier for my family.',
  },
  {
    type: 'testimonial',
    category: 'Testimonials',
    name: 'David Kim',
    title: 'Comfortable family care',
    text: 'The doctors were patient, gentle, and professional. We felt supported throughout the visit.',
  },
];

const galleryItems = [
  ...galleryImages,
  ...testimonialItems,
];

const categoryIcons = {
  All: FaHospital,
  Campus: FaMapMarkerAlt,
  'Patient Areas': FaHeartbeat,
  Diagnostics: FaMicroscope,
  Doctors: FaUserMd,
  'Care Moments': FaHeartbeat,
  Events: FaHospital,
  Testimonials: FaQuoteLeft,
};

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const filteredImages = useMemo(() => (
    activeCategory === 'All'
      ? galleryItems
      : galleryItems.filter((img) => img.category === activeCategory)
  ), [activeCategory]);

  const activeImage = lightboxIndex === null ? null : filteredImages[lightboxIndex];

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  return (
    <div className="page-animate-fade gallery-showcase-page">
      <section className="gallery-showcase-hero">
        <div>
          <span className="gallery-eyebrow">MediCare Moments</span>
          <h2>Hospital Gallery</h2>
          <p>Explore our care spaces, clinical teams, patient areas, and community health moments through real hospital visuals.</p>
        </div>
        <div className="gallery-hero-preview">
          <img src={hospitalImg} alt="MediCare Hospital campus" />
          <div>
            <strong>{galleryItems.length}</strong>
            <span>gallery items</span>
          </div>
        </div>
      </section>

      <section className="gallery-filter-bar" aria-label="Gallery categories">
        {categories.map((category) => {
          const Icon = categoryIcons[category];
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`gallery-filter-btn ${activeCategory === category ? 'active' : ''}`}
            >
              <Icon />
              <span>{category}</span>
            </button>
          );
        })}
      </section>

      <section className="gallery-bento-grid">
        {filteredImages.map((img, index) => (
          img.type === 'testimonial' ? (
            <article key={`${img.name}-${img.category}`} className="gallery-photo-card gallery-testimonial-card">
              <div className="gallery-testimonial-icon"><FaQuoteLeft /></div>
              <div className="gallery-testimonial-stars"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></div>
              <h3>{img.title}</h3>
              <p>{img.text}</p>
              <strong>{img.name}</strong>
            </article>
          ) : (
            <button
              key={`${img.title}-${img.category}`}
              type="button"
              className={`gallery-photo-card ${img.size ? `is-${img.size}` : ''}`}
              onClick={() => openLightbox(index)}
            >
              <img src={img.src} alt={img.title} loading="lazy" />
              <span className="gallery-photo-shade" />
              <span className="gallery-photo-meta">
                <span className="gallery-photo-category">{img.category}</span>
                <strong>{img.title}</strong>
              </span>
              <span className="gallery-zoom-icon" aria-hidden="true">
                <FaSearchPlus />
              </span>
            </button>
          )
        ))}
      </section>

      {activeImage && activeImage.type !== 'testimonial' && (
        <div className="gallery-lightbox-modern" onClick={closeLightbox}>
          <button type="button" className="lightbox-close-modern" onClick={closeLightbox} aria-label="Close image preview">
            <FaTimes />
          </button>
          <figure onClick={(event) => event.stopPropagation()}>
            <img src={activeImage.src} alt={activeImage.title} />
            <figcaption>
              <span>{activeImage.category}</span>
              <strong>{activeImage.title}</strong>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
