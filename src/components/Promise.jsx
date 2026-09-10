import React, { useState, useEffect, useRef } from 'react';
import './Promise.css';

export default function Promise() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const node = sectionRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      {
        threshold: 0.2,
      }
    );

    if (node) {
      observer.observe(node);
    }

    return () => {
      if (node) {
        observer.unobserve(node);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} id="about" className="promise-section">
      <div className="promise-container">
        {/* Headline: WHO ARE WE? */}
        <h2 className={`promise-heading ${inView ? 'in-view' : ''}`}>
          WHO ARE WE?
        </h2>

        {/* Minimal Description */}
        <p className={`promise-description ${inView ? 'in-view' : ''}`}>
          At Cityreach, we combine thoughtful web development with strategic social media advertising to help businesses build a stronger digital presence and achieve meaningful growth.
        </p>

        {/* Minimal Text-Only Button with Shimmer Effect (No Box) */}
        <div className={`promise-action-wrap ${inView ? 'in-view' : ''}`}>
          <a
            href="#services"
            className="explore-btn"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('services');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            EXPLORE
          </a>
        </div>
      </div>
    </section>
  );
}
