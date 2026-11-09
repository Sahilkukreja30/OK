import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { GENERAL_ENQUIRY_URL } from '../config/contact';
import { sectionLinks } from '../config/navigation';
import useCmsList from '../hooks/useCmsList';
import { fetchCaseStudies } from '../services/contentService';
import './Navbar.css';

export default function Navbar({ isLightMode }) {
  const { routeType, goToHome } = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { items: caseStudies } = useCmsList(fetchCaseStudies);
  const links = sectionLinks({ hasCaseStudies: caseStudies.length > 0 });

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

  const isLight = routeType === 'home' && isLightMode;

  return (
    <>
      <header
        className={`navbar-wrapper ${isScrolled ? 'is-scrolled' : 'is-transparent'} ${
          isLight ? 'theme-light' : ''
        } ${routeType !== 'home' ? 'is-blog-route' : ''}`}
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
              {links.map(({ id, label }) => (
                <a key={id} href={`#${id}`} onClick={handleNavClick(id)} className="nav-btn">
                  {label}
                </a>
              ))}
            </div>

            {/* Contact Us: Stays on the right */}
            <div className="nav-right-anchor">
              <a
                href={GENERAL_ENQUIRY_URL}
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

      {/* Phone: Smooth Sidebar */}
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
          {/* item-N sets each link's slide-in delay, so the numbering follows the visible links */}
          {links.map(({ id, label }, index) => (
            <a key={id} href={`#${id}`} className={`sidebar-link item-${index + 1}`} onClick={handleNavClick(id)}>
              {label}
            </a>
          ))}
          <a
            href={GENERAL_ENQUIRY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`sidebar-link item-${links.length + 1}`}
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
