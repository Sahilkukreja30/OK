import React, { useState, useEffect } from 'react';
import './Hero.css';

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamic dimming as content slides over
  const heroDim = Math.min(0.55, scrollY * 0.001);

  // Tagline moves downwards as user scrolls down towards the next section
  const taglineY = scrollY * 0.45;
  const taglineOpacity = Math.max(0, 1 - scrollY * 0.0032);

  return (
    <div className="hero-viewport-anchor" id="home">
      {/* FIXED HERO STAGE: Stays anchored while scrolling down */}
      <div className="hero-fixed-stage">
        <video
          className="hero-media hero-video"
          src="/images/TOP.mp4"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/images/TOP.mp4" type="video/mp4" />
        </video>

        {/* Clean dark overlay for optimal contrast */}
        <div 
          className="hero-overlay" 
          style={{ backgroundColor: `rgba(0, 0, 0, ${0.4 + heroDim})` }}
        />

        {/* Minimal Tagline: moves downwards as user scrolls towards next section */}
        <div 
          className="hero-content"
          style={{
            transform: `translate3d(0, ${taglineY}px, 0)`,
            opacity: taglineOpacity
          }}
        >
          <h1 className="hero-tagline">
            Websites That Convert, Ads That Scale.
          </h1>
        </div>
      </div>
    </div>
  );
}
