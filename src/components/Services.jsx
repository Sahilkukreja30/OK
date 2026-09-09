import React, { useState, useEffect, useRef } from 'react';
import './Services.css';

const servicesData = [
  {
    id: '01',
    title: 'WEBSITE DEVELOPMENT',
    description:
      'High-performance, bespoke web development tailored to your brand architecture. We engineer scalable, lightning-fast, and mobile-responsive websites utilizing clean modern codebases that elevate user engagement and maximize search engine discoverability.'
  },
  {
    id: '02',
    title: 'CUSTOM ECOMMERCE WEBSITE DEVELOPMENT',
    description:
      'Bespoke eCommerce platforms built for high-volume transactions, instant checkout velocity, and frictionless conversions. We craft tailored product catalogs, headless architectures, and encrypted payment flows built to scale your direct-to-consumer revenue.'
  },
  {
    id: '03',
    title: 'SHOPIFY ECOMMERCE STORE DEVELOPMENT',
    description:
      'End-to-end Shopify and Shopify Plus store development. We combine bespoke theme engineering, streamlined checkout optimization, and high-converting app integrations to maximize your average order value and customer lifetime value.'
  },
  {
    id: '04',
    title: 'ANDROID / IOS APPLICATION DEVELOPMENT',
    description:
      'Native and cross-platform mobile application development for iOS and Android. Engineered with resilient backend architectures, intuitive tactile UI/UX, and sub-second response times to deliver an uncompromising mobile experience.'
  },
  {
    id: '05',
    title: 'SOCIAL MEDIA ADVERTISING (META ADS)',
    description:
      'Algorithmic, data-driven paid acquisition campaigns across Instagram and Facebook. We leverage deep audience segmentation, cinematic creative production, and server-side tracking (CAPI) to consistently lower acquisition costs and scale verified ROAS.'
  },
  {
    id: '06',
    title: 'GOOGLE ADS',
    description:
      'High-intent search, display, and Performance Max advertising on Google. We systematically optimize keywords, ad copy relevance, and landing page funnels to capture qualified, high-value buyers with maximum commercial efficiency.'
  },
  {
    id: '07',
    title: 'SEARCH ENGINE OPTIMISATION (SEO)',
    description:
      'Comprehensive technical, on-page, and structural SEO engineered for sustainable organic visibility. We optimize Core Web Vitals, site crawlability, and semantic authority to secure top-tier organic rankings on competitive Google search results.'
  }
];

export default function Services({ onThemeChange }) {
  const [openServiceId, setOpenServiceId] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Turns whole site white when inside Services section, and back to black when leaving
        if (onThemeChange) {
          onThemeChange(entry.isIntersecting);
        }
      },
      {
        threshold: 0.25,
        rootMargin: "-20% 0px -20% 0px"
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [onThemeChange]);

  const toggleDropdown = (id) => {
    setOpenServiceId(openServiceId === id ? null : id);
  };

  const getWhatsAppUrl = (title) => {
    const msg = `HELLO, I WOULD LIKE TO START A PROJECT REGARDING ${title}!`;
    return `https://wa.me/919111110422?text=${encodeURIComponent(msg)}`;
  };

  return (
    <section ref={sectionRef} id="services" className="services-section">
      <div className="services-container">
        <h2 className="services-headline">
          OUR SERVICES
        </h2>

        <div className="services-minimal-list">
          {servicesData.map((service) => {
            const isOpen = openServiceId === service.id;

            return (
              <div 
                key={service.id} 
                className={`service-item ${isOpen ? 'active-dropdown' : ''}`}
              >
                {/* Clickable Header Row */}
                <div 
                  className="service-header-row" 
                  onClick={() => toggleDropdown(service.id)}
                >
                  <span className="service-number">{service.id}</span>
                  <h3 className="service-title">{service.title}</h3>
                  <span className={`service-toggle-icon ${isOpen ? 'rotated' : ''}`}>
                    +
                  </span>
                </div>

                {/* Dropdown Content with SEO Description and Shimmer Button */}
                <div className={`service-dropdown-body ${isOpen ? 'open' : ''}`}>
                  <div className="dropdown-inner-content">
                    <p className="service-seo-description">
                      {service.description}
                    </p>
                    
                    {/* Minimal Shimmer Button: START YOUR PROJECT */}
                    <div className="service-btn-wrap">
                      <a
                        href={getWhatsAppUrl(service.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="start-project-btn"
                      >
                        START YOUR PROJECT
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
