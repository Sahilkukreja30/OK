import React, { useCallback, useState } from 'react';
import useCmsList from '../hooks/useCmsList';
import useInView from '../hooks/useInView';
import { fetchCaseStudies } from '../services/contentService';
import CaseStudyModal from './CaseStudyModal';
import './CaseStudies.css';

function CaseStudyCard({ study, onOpen }) {
  const meta = [study.discipline, study.year].filter(Boolean).join('  ·  ');

  return (
    <article className="case-card">
      <button type="button" className="case-card-button" onClick={() => onOpen(study)}>
        <div className="case-card-image-wrap">
          <img src={study.image} alt={study.title} className="case-card-image" loading="lazy" />
        </div>

        <div className="case-card-body">
          <div className="case-card-meta">
            <span className="case-card-number">{study.number}</span>
            <span>{meta}</span>
          </div>
          <h3 className="case-card-title">{study.title}</h3>
          <p className="case-card-headline">{study.headline}</p>

          <div className="case-card-results">
            {[study.resultPrimary, study.resultSecondary].filter(Boolean).map((result) => (
              <span key={result} className="case-card-result">{result}</span>
            ))}
          </div>

          <span className="case-card-link">VIEW CASE STUDY →</span>
        </div>
      </button>
    </article>
  );
}

function CaseStudiesSection({ studies }) {
  const [activeStudy, setActiveStudy] = useState(null);
  const [sectionRef, isRevealed] = useInView();
  const closeModal = useCallback(() => setActiveStudy(null), []);

  return (
    <section ref={sectionRef} id="case-studies" className="case-studies-section">
      <div className="case-studies-container">
        <div className={`case-studies-heading ${isRevealed ? 'is-revealed' : ''}`}>
          <h2 className="case-studies-headline">CASE STUDIES</h2>
          <p className="case-studies-subline">Our top projects, and the results they delivered.</p>
        </div>

        <div className="case-studies-grid">
          {studies.map((study) => (
            <CaseStudyCard key={study.id} study={study} onOpen={setActiveStudy} />
          ))}
        </div>
      </div>

      {activeStudy && <CaseStudyModal study={activeStudy} onClose={closeModal} />}
    </section>
  );
}

export default function CaseStudies() {
  const { items: studies } = useCmsList(fetchCaseStudies);

  // Nothing to show until the first case study is added from the /admin dashboard.
  return studies.length ? <CaseStudiesSection studies={studies} /> : null;
}
