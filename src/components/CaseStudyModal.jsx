import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { whatsappLink } from '../config/contact';
import './CaseStudies.css';

const STORY_BLOCKS = [
  { key: 'challenge', label: 'THE CHALLENGE' },
  { key: 'solution', label: 'OUR SOLUTION' },
  { key: 'scope', label: 'SCOPE OF WORK' }
];

export default function CaseStudyModal({ study, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && onClose();
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const storyBlocks = STORY_BLOCKS.filter(({ key }) => study[key]);
  const startProjectUrl = whatsappLink(`HELLO, I SAW THE ${study.title.toUpperCase()} CASE STUDY AND WOULD LIKE A SIMILAR PROJECT!`);

  // Portal: the page's curtain layer is its own stacking context, which would keep the popup under the navbar.
  return createPortal(
    <div className="case-modal-backdrop" onClick={onClose}>
      <div
        className="case-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${study.title} case study`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="case-modal-header">
          <div>
            <span className="case-modal-kicker">{[study.discipline, study.year].filter(Boolean).join('  ·  ')}</span>
            <h3 className="case-modal-title">{study.title}</h3>
            <p className="case-modal-headline">{study.headline}</p>
          </div>
          <button ref={closeRef} type="button" className="case-modal-close" onClick={onClose} aria-label="Close case study">
            ✕
          </button>
        </header>

        <img src={study.image} alt={study.title} className="case-modal-image" />

        <div className="case-modal-body">
          <p className="case-modal-summary">{study.summary}</p>

          {study.metrics.length > 0 && (
            <dl className="case-modal-metrics">
              {study.metrics.map(({ label, value }) => (
                <div key={label} className="case-modal-metric">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {storyBlocks.map(({ key, label }) => (
            <section key={key} className="case-modal-block">
              <h4>{label}</h4>
              <p>{study[key]}</p>
            </section>
          ))}
        </div>

        <footer className="case-modal-footer">
          <a href={startProjectUrl} target="_blank" rel="noopener noreferrer" className="case-modal-cta">
            START A SIMILAR PROJECT
          </a>
          {study.projectUrl && (
            <a href={study.projectUrl} target="_blank" rel="noopener noreferrer" className="case-modal-secondary">
              VISIT LIVE PROJECT ↗
            </a>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}
