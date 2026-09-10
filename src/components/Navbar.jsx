import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import './Navbar.css';

export default function Navbar({ isLightMode }) {
  const { routeType, goToHome, goToBlogIndex } = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const whatsappUrl =
    'https://wa.me/919111110422?text=HELLO%2C%20I%20WOULD%20LIKE%20TO%20KNOW%20MORE%20ABOUT%20YOUR%20SERVICES!';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMenu = () => setMobileMenuOpen(false);

  const handleNavClick = (sectionId) => (e) => {
    e.preventDefault();
    closeMenu();
    if (routeType === 'home') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      goToHome(sectionId);
    }
  };

  const handleBlogClick = (e) => {
    e.preventDefault();
    closeMenu();
    goToBlogIndex();
  };

  const isBlogActive = routeType === 'blog_list' || routeType === 'blog_detail';

  return (
    <>
      <header
        className={`navbar-wrapper ${isScrolled ? 'is-scrolled' : 'is-transparent'} ${
          isLightMode ? 'theme-light' : ''
        }`}
      >
        <div className="navbar-container">
          {/* Top Left Text Logo */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              goToHome();
            }}
            className="logo"
          >
            CITYREACH
          </a>

          {/* Desktop Navigation Group */}
          <nav className="nav-desktop-group">
            {/* Main Links */}
            <div className="nav-main-links">
              <a href="#home" onClick={handleNavClick('home')} className="nav-btn">
                HOME
              </a>
              <a href="#services" onClick={handleNavClick('services')} className="nav-btn">
                SERVICES
              </a>
              <a href="#work" onClick={handleNavClick('work')} className="nav-btn">
                OUR WORK
              </a>
              <a
                href="/blog"
                onClick={handleBlogClick}
                className={`nav-btn ${isBlogActive ? 'active' : ''}`}
                style={isBlogActive ? { opacity: 1, borderBottom: '1px solid currentColor' } : {}}
              >
                BLOG
              </a>
            </div>

            {/* Contact Us: Stays on the right, opens WhatsApp on PC */}
            <div className="nav-right-anchor">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-btn nav-contact-btn"
              >
                CONTACT US
              </a>
            </div>
          </nav>

          {/* Mobile: 2-Strip Hamburger on Top Right */}
          <div className="mobile-toggle-wrapper">
            <button
              className={`hamburger-icon ${mobileMenuOpen ? 'open' : ''}`}
              onClick={toggleMenu}
              aria-label="Toggle Navigation"
            >
              <span className="ham-line"></span>
              <span className="ham-line"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Phone: Smooth Sidebar with Buttons Dropping in One-by-One from Right */}
      <div
        className={`mobile-sidebar-backdrop ${mobileMenuOpen ? 'active' : ''}`}
        onClick={closeMenu}
      />
      <aside className={`mobile-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">CITYREACH</span>
          <button className="sidebar-close-btn" onClick={closeMenu} aria-label="Close Menu">
            ✕
          </button>
        </div>

        <nav className="sidebar-nav-list">
          <a href="#home" className="sidebar-link item-1" onClick={handleNavClick('home')}>
            HOME
          </a>
          <a href="#services" className="sidebar-link item-2" onClick={handleNavClick('services')}>
            SERVICES
          </a>
          <a href="#work" className="sidebar-link item-3" onClick={handleNavClick('work')}>
            OUR WORK
          </a>
          <a href="/blog" className="sidebar-link item-4" onClick={handleBlogClick}>
            BLOG
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link item-5"
            onClick={() => {
              setTimeout(closeMenu, 150);
            }}
          >
            CONTACT US
          </a>
        </nav>
      </aside>
    </>
  );
}
