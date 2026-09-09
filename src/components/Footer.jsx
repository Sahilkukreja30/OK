import React, { useEffect, useRef } from 'react';
import './Footer.css';

export default function Footer({ onThemeChange }) {
  const footerRef = useRef(null);

  const whatsappUrl =
    'https://wa.me/919111110422?text=HELLO%2C%20I%20WOULD%20LIKE%20TO%20KNOW%20MORE%20ABOUT%20YOUR%20SERVICES!';
  const instagramUrl = 'https://instagram.com/cityreachdigital';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (onThemeChange) {
          if (entry.isIntersecting) {
            // When scrolling down into Footer: Whole website smoothly transforms to WHITE
            onThemeChange(true);
          } else {
            // When scrolling back up into Brands: Website returns to BLACK
            onThemeChange(false);
          }
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      if (footerRef.current) {
        observer.unobserve(footerRef.current);
      }
    };
  }, [onThemeChange]);

  const handleScrollTo = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer ref={footerRef} id="contact" className="site-footer">
      <div className="footer-container">
        {/* Main Content Grid */}
        <div className="footer-main-grid">
          {/* Left Column: Brand Logo & Connect With Us */}
          <div className="footer-brand-column">
            <a href="#home" onClick={handleScrollTo('home')} className="footer-logo">
              CITYREACH
            </a>

            <div className="footer-connect-block">
              <span className="footer-connect-label">CONNECT WITH US</span>
              {/* Only the Logos for Instagram and WhatsApp (No usernames or numbers) */}
              <div className="footer-social-icons-row">
                {/* Instagram Icon */}
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-icon-btn"
                  aria-label="Instagram"
                >
                  <svg
                    className="social-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>

                {/* WhatsApp Icon */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-icon-btn"
                  aria-label="WhatsApp"
                >
                  <svg
                    className="social-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.53c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.13.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.18-.47-.3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Links */}
          <div className="footer-links-column">
            <h3 className="footer-col-heading">QUICK LINKS</h3>
            <nav className="footer-nav">
              <a href="#home" onClick={handleScrollTo('home')} className="footer-nav-link">
                HOME
              </a>
              <a href="#services" onClick={handleScrollTo('services')} className="footer-nav-link">
                SERVICES
              </a>
              <a href="#work" onClick={handleScrollTo('work')} className="footer-nav-link">
                OUR WORK
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-nav-link"
              >
                CONTACT US
              </a>
            </nav>
          </div>
        </div>

        {/* Delicate Hairline Divider */}
        <div className="footer-divider-line" />

        {/* Bottom Bar: Copyright Centered */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            © {new Date().getFullYear()} CITYREACH. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
