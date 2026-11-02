import React, { useState, useEffect, useRef } from 'react';
import useCmsList from '../hooks/useCmsList';
import { logosToShow } from '../data/defaultClientLogos';
import { fetchClientLogos } from '../services/contentService';
import './Brands.css';

export default function Brands({ onThemeChange }) {
  const sectionRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const { items: cmsLogos } = useCmsList(fetchClientLogos);
  const clientLogos = logosToShow(cmsLogos);

  useEffect(() => {
    const node = sectionRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Enforce pure black theme when Brands section comes into view
        if (entry.isIntersecting) {
          if (onThemeChange) {
            onThemeChange(false);
          }
          setIsRevealed(true);
        }
      },
      {
        threshold: 0.15,
        rootMargin: "-10% 0px -10% 0px"
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
  }, [onThemeChange]);

  return (
    <section ref={sectionRef} id="work" className="brands-section">
      <div className="brands-container">
        {/* Centered Headline with Smooth Reveal & Lightning Strip */}
        <div className={`brands-headline-wrap ${isRevealed ? 'is-revealed' : ''}`}>
          <h2 className="brands-headline">
            BRANDS WE'VE WORKED WITH
          </h2>
          <div className="headline-reveal-laser" />
        </div>

        {/* 4x4 Client Wall with Animated Laser Border Frame */}
        <div className="laser-grid-outer-frame">
          <div className="brands-wall-grid">
            {/* Animated Laser Sweep Beams for PC (Hidden on Phone) */}
            <div className="laser-sweep-beam-h" aria-hidden="true" />
            <div className="laser-sweep-beam-v" aria-hidden="true" />

            {clientLogos.map((logo) => {
              const hasUrl = Boolean(logo.url);
              const CellTag = hasUrl ? 'a' : 'div';
              const linkProps = hasUrl
                ? {
                    href: logo.url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    'aria-label': `${logo.name} website (opens in new tab)`
                  }
                : {};

              return (
                <CellTag
                  key={logo.id}
                  {...linkProps}
                  className={`brand-cell brand-type-${logo.type} ${hasUrl ? 'is-clickable' : 'is-static'}`}
                >
                  {/* Subtle Spotlight on Hover */}
                  <div className="cell-spotlight" />

                  {/* Client Logo */}
                  <div className="brand-logo-stage">
                    <img
                      src={logo.src}
                      alt={logo.name}
                      loading="lazy"
                      className={`brand-logo-img logo-img-${logo.id}`}
                    />
                  </div>

                  {/* Brand Name Below Logo */}
                  <div className="brand-name-wrap">
                    <span className="brand-name-text">
                      {logo.name}
                    </span>
                    {hasUrl && (
                      <span className="brand-link-indicator">
                        ↗
                      </span>
                    )}
                  </div>
                </CellTag>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
