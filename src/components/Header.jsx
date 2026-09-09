import React, { useState, useEffect } from 'react';
import './Header.css';

export default function Header() {
  const [time, setTime] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="header border-bottom">
      <div className="header-inner container">
        <div className="brand-group">
          <a href="#" className="brand-name">MAISON NOIR</a>
          <span className="brand-sub">DIGITAL ATELIER</span>
        </div>

        <nav className="desktop-nav">
          <a href="#promise" className="nav-link">
            <span className="nav-index">01</span> PROMISE
          </a>
          <a href="#services" className="nav-link">
            <span className="nav-index">02</span> SERVICES
          </a>
          <a href="#work" className="nav-link">
            <span className="nav-index">03</span> WORK
          </a>
          <a href="#initiation" className="nav-link">
            <span className="nav-index">04</span> INITIATION
          </a>
        </nav>

        <div className="header-actions">
          <div className="time-display">
            <span className="time-label">LOCAL STUDIO</span>
            <span className="time-val">{time || '00:00:00'}</span>
          </div>
          <a href="#initiation" className="cta-button">
            START PROJECT
          </a>
          <button 
            className="mobile-toggle" 
            onClick={toggleMenu}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? 'CLOSE' : 'MENU'}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-drawer border-bottom">
          <nav className="mobile-nav">
            <a href="#promise" className="mobile-nav-link" onClick={closeMenu}>
              <span className="nav-index">01</span> OUR PROMISE
            </a>
            <a href="#services" className="mobile-nav-link" onClick={closeMenu}>
              <span className="nav-index">02</span> SERVICES
            </a>
            <a href="#work" className="mobile-nav-link" onClick={closeMenu}>
              <span className="nav-index">03</span> OUR WORK
            </a>
            <a href="#initiation" className="mobile-nav-link" onClick={closeMenu}>
              <span className="nav-index">04</span> PROJECT INITIATION
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
