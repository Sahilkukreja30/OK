import React, { useState, useEffect, useRef } from 'react';
import './Brands.css';

const clientLogos = [
  // ROW 1: LEFT TO RIGHT
  {
    id: 'twoblends',
    name: 'TWO BLENDS COFFEE',
    url: 'https://twoblends.ae',
    src: '/LOGO/2BLENDS.png',
    type: 'white-on-dark'
  },
  {
    id: 'bclub',
    name: 'THE B CLUB',
    url: 'https://thebclub.me',
    src: '/LOGO/BCLUB.png',
    type: 'invert-white'
  },
  {
    id: 'bilingual',
    name: 'BILINGUAL',
    url: null,
    src: '/LOGO/BILINGUAL.jpg',
    type: 'invert-white'
  },
  {
    id: 'fold',
    name: 'FOLD BAKEHOUSE',
    url: null,
    src: '/LOGO/FOLD.jpg',
    type: 'color-badge'
  },

  // ROW 2: LEFT TO RIGHT
  {
    id: 'ghazi',
    name: 'GHAZI COLD STORAGE',
    url: 'https://ghazicold.com',
    src: '/LOGO/GHAZ.webp',
    type: 'standard'
  },
  {
    id: 'healthwealth',
    name: 'THE HEALTH AND WEALTH CLUB',
    url: 'https://healthandwealthclub.com',
    src: '/LOGO/H&W.avif',
    type: 'standard'
  },
  {
    id: 'hide',
    name: 'HIDE CAFE',
    url: null,
    src: '/LOGO/HIDE.jpg',
    type: 'invert-white'
  },
  {
    id: 'ilife',
    name: 'ILIFE PHYSIOTHERAPY CLINIC',
    url: 'https://ilifephysiocare.in',
    src: '/LOGO/ILIFE.webp',
    type: 'standard'
  },

  // ROW 3: LEFT TO RIGHT
  {
    id: 'kaze',
    name: 'KAZE PERFUMES',
    url: 'https://kazeperfumes.com',
    src: '/LOGO/KAZE.avif',
    type: 'standard'
  },
  {
    id: 'loversclub',
    name: 'THE LOVERS CLUB',
    url: 'https://theloversclub.ae',
    src: '/LOGO/LOVERSCLUB.png',
    type: 'white-on-dark'
  },
  {
    id: 'lucedoro',
    name: 'LUCE DORO CLUB',
    url: 'https://lucedoroclub.com',
    src: '/LOGO/LUCEDORO.webp',
    type: 'standard'
  },
  {
    id: 'needleform',
    name: 'NEEDLE FORM',
    url: 'https://theneedleform.com',
    src: '/LOGO/NEEDLEFORM.png',
    type: 'white-pure'
  },

  // ROW 4: LEFT TO RIGHT
  {
    id: 'ofelia',
    name: 'OFELIA BOUTIQUE',
    url: 'https://ofeliaboutique.com',
    src: '/LOGO/OFELIA.avif',
    type: 'standard'
  },
  {
    id: 'twostyles',
    name: 'TWOSTYLES ABAYAS DUBAI',
    url: null,
    src: '/LOGO/TWOSTYLES.jpg',
    type: 'invert-white'
  },
  {
    id: 'voya',
    name: 'VOYA BAKEHOUSE',
    url: 'https://voyabakehouse.ae',
    src: '/LOGO/VOYA.webp',
    type: 'standard'
  },
  {
    id: 'overlay',
    name: 'OVERLAY PERFUMES',
    url: 'https://overlayae.com',
    src: '/LOGO/logo_overlay.webp',
    type: 'standard'
  }
];

export default function Brands({ onThemeChange }) {
  const sectionRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
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
