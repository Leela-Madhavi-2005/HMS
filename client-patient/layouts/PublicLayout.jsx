import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import logoImg from '../assets/logo.png';
import footerLogoImg from '../assets/mc-logo.jpeg';
import { FaMoon, FaSun, FaBars, FaTimes, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import Chatbot from '../components/Chatbot';

export default function PublicLayout() {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="premium-layout-wrapper">
      {/* FLOATING NAVBAR */}
      <div className={`floating-nav-container ${scrolled ? 'scrolled' : ''}`}>
        <nav className="premium-floating-nav">
          
          {/* Logo Section */}
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <Link to="/" className="floating-nav-brand">
              <img src={logoImg} alt="MediCare" />
              <span className="brand-text">
                <span className="text-medi">Medi</span>
                <span className="text-care">Care</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Items (Supports Two Rows via Flex Wrap) */}
          <div className="floating-nav-links">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
            <Link to="/services" className={location.pathname === '/services' ? 'active' : ''}>Services</Link>
            <Link to="/facilities" className={location.pathname === '/facilities' ? 'active' : ''}>Facilities</Link>
            <Link to="/insurance" className={location.pathname === '/insurance' ? 'active' : ''}>Insurance</Link>
            <Link to="/gallery" className={location.pathname === '/gallery' ? 'active' : ''}>Gallery</Link>
            <a href="https://www.google.com/maps/search/?api=1&query=12.900039,80.228935" target="_blank" rel="noopener noreferrer" title="Location" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
              <FaMapMarkerAlt />
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="floating-nav-actions">
            <Link to="/register" className="premium-btn btn-appointment-yellow btn-sm">Book Appointment</Link>
            <Link to="/emergency" className="premium-btn btn-emergency btn-sm"><FaPhoneAlt /> Emergency</Link>
            <Link to="/login" className="premium-btn btn-login btn-sm">Login</Link>
          </div>

          {/* Mobile Hamburger */}
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-nav-dropdown">
          <Link to="/">Home</Link>
          <Link to="/services">Services</Link>
          <Link to="/facilities">Facilities</Link>
          <Link to="/insurance">Insurance</Link>
          <Link to="/gallery">Gallery</Link>
          <a href="https://www.google.com/maps/search/?api=1&query=12.900039,80.228935" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaMapMarkerAlt /> Location
          </a>
          <div className="mobile-nav-ctas" style={{marginTop: '10px'}}>
            <Link to="/login" className="premium-btn btn-login" style={{width:'100%', marginBottom:'10px'}}>Login</Link>
            <Link to="/register" className="premium-btn btn-appointment-yellow" style={{width:'100%'}}>Book Appointment</Link>
            <Link to="/emergency" className="premium-btn btn-emergency" style={{width:'100%', marginTop:'10px'}}>Emergency</Link>
          </div>
        </div>
      )}

      {/* PAGE CONTENT */}
      <main className="premium-main-content">
        <Outlet />
      </main>

      {/* PREMIUM FOOTER */}
      <footer className="premium-footer">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand">
              <img src={footerLogoImg} alt="MediCare logo" className="footer-logo" />
              <span className="brand-text" style={{fontSize: '1.8rem'}}>
                <span className="text-medi">Medi</span>
                <span className="text-care">Care</span>
              </span>
            </div>
            <p>Setting the gold standard in digital healthcare management. Trust us with your wellbeing.</p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/services">Our Services</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Departments</h4>
            <ul>
              <li><Link to="/departments">Cardiology</Link></li>
              <li><Link to="/departments">Neurology</Link></li>
              <li><Link to="/departments">Orthopedics</Link></li>
              <li><Link to="/departments">Pediatrics</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact Us</h4>
            <ul>
              <li><FaMapMarkerAlt style={{marginRight:'10px', color:'var(--premium-secondary)'}}/> 123 Healthcare Ave, NY</li>
              <li><FaPhoneAlt style={{marginRight:'10px', color:'var(--premium-secondary)'}}/> +1 (800) 123-4567</li>
              <li><FaEnvelope style={{marginRight:'10px', color:'var(--premium-secondary)'}}/> contact@medicare.com</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>&copy; 2026 MediCare Hospital. All Rights Reserved.</div>
          <div style={{display:'flex', gap:'20px'}}>
            <Link to="#" style={{color: 'inherit', textDecoration:'none'}}>Privacy Policy</Link>
            <Link to="#" style={{color: 'inherit', textDecoration:'none'}}>Terms of Service</Link>
          </div>
        </div>
      </footer>

      {/* FLOATING BUTTON */}
      <Link to="/emergency" className="floating-emergency" title="Emergency Contact">
        <FaPhoneAlt />
      </Link>

      {/* CHATBOT */}
      <Chatbot />
    </div>
  );
}
