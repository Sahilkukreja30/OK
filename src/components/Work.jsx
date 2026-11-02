import React, { useState } from 'react';
import './Work.css';

const projects = [
  {
    id: '01',
    title: "L'Étoile Atelier",
    discipline: 'Website Development',
    categoryKey: 'web',
    year: '2026',
    headline: 'Haute Couture Flagship & Interactive Archive',
    summary: 'Architectural web platform designed for a Paris luxury fashion maison, featuring instant page transitions, fluid micro-interactions, and private runway client access.',
    resultPrimary: '+240% Mobile Conversions',
    resultSecondary: '0.28s Page Latency',
    image: '/images/work-1.jpg',
    scope: 'Bespoke React Architecture, Headless Commerce, Kinetic Typography, VIP Private Room Encryption',
    challenge: 'The maison needed to translate its physical Parisian atelier experience into the digital realm without losing the tactile gravity and exclusivity of haute couture.',
    solution: 'We engineered an unembellished, editorial digital flagship that eliminates boilerplate navigation, replacing it with an architectural scroll and sub-second asset delivery.',
    metrics: [
      { label: 'CONVERSION INCREASE', value: '+240%' },
      { label: 'AVERAGE SESSION', value: '4m 18s' },
      { label: 'GLOBAL TTFB', value: '0.28s' }
    ]
  },
  {
    id: '02',
    title: 'Kronos Horology',
    discipline: 'Website Development & Social Ads',
    categoryKey: 'both',
    year: '2026',
    headline: 'Precision Timepiece Platform & Collector Acquisition',
    summary: 'Engineered a custom mechanical timepiece configurator with real-time rendering, followed by an international paid social rollout targeting high-net-worth collectors.',
    resultPrimary: '500 Pieces Sold in 48 Hours',
    resultSecondary: '3.9x Verified ROAS',
    image: '/images/work-2.jpg',
    scope: 'Custom Timepiece Configurator, Meta Ads Strategy, High-Production Macro Video Creative, Server-Side CAPI',
    challenge: 'Launching an ultra-limited run of luxury mechanical chronographs to international collectors who rarely interact with traditional digital advertising.',
    solution: 'We built a tactile 60fps timepiece configurator paired with hyper-segmented Meta video campaigns focused strictly on horological mechanics and provenance.',
    metrics: [
      { label: 'INVENTORY ALLOCATION', value: '100% Sold Out' },
      { label: 'BLENDED ROAS', value: '3.9x' },
      { label: 'REVENUE VELOCITY', value: '48 Hours' }
    ]
  },
  {
    id: '03',
    title: 'Museum of Contemporary Art',
    discipline: 'Website Development',
    categoryKey: 'web',
    year: '2025',
    headline: 'Monolithic Museum Portal & VIP Collector Viewing Rooms',
    summary: 'Minimalist brutalist digital architecture featuring high-resolution artwork archives, private collector authentication, and zero latency.',
    resultPrimary: '0.32s Average TTFB',
    resultSecondary: 'Zero Collector Drop-Off',
    image: '/images/work-3.jpg',
    scope: 'Bespoke Digital Architecture, Spatial Grid Layout, Encrypted Private Vault, High-Resolution Image Engine',
    challenge: 'Handling gigapixel artwork archives while preserving instant search, smooth interactions, and total privacy for high-value contemporary acquisitions.',
    solution: 'A razor-sharp monochrome web architecture optimized to stream high-density imagery with zero layout shift and uncompromised aesthetic dignity.',
    metrics: [
      { label: 'GLOBAL SPEED SCORE', value: '100 / 100' },
      { label: 'BOUNCE REDUCTION', value: '-62%' },
      { label: 'PRIVATE TRANSACTIONS', value: '$12M+' }
    ]
  },
  {
    id: '04',
    title: 'Aura Maison Parfums',
    discipline: 'Social Media Advertising',
    categoryKey: 'social',
    year: '2026',
    headline: 'High-Ticket Paid Social Acquisition Blitz',
    summary: 'Directed and deployed high-contrast cinematic video campaigns on Instagram and TikTok, integrated with server-side attribution to scale high-ticket fragrance acquisitions.',
    resultPrimary: '$2.4M Revenue in 90 Days',
    resultSecondary: '4.6x Blended ROAS',
    image: '/images/work-4.jpg',
    scope: 'Haute Creative Direction, Paid Meta & TikTok Acquisition, Multivariate Hook Testing, First-Party Attribution',
    challenge: 'Standing out in a hyper-congested beauty marketplace while maintaining a non-commercial, luxury editorial aura that commands high price points.',
    solution: 'We produced stark, artistic monochrome video assets highlighting scent notes and raw bottle architecture, paired with algorithmic budget reallocation.',
    metrics: [
      { label: 'NEW CUSTOMER REVENUE', value: '$2.4M' },
      { label: 'VERIFIED BLENDED ROAS', value: '4.6x' },
      { label: 'COST PER ACQUISITION', value: '-38%' }
    ]
  }
];

export default function Work() {
  const [filter, setFilter] = useState('all');
  const [activeProject, setActiveProject] = useState(null);

  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'web') return p.categoryKey === 'web' || p.categoryKey === 'both';
    if (filter === 'social') return p.categoryKey === 'social' || p.categoryKey === 'both';
    return true;
  });

  return (
    <section id="work" className="work section-padding border-bottom">
      <div className="container">
        <div className="work-header">
          <span className="meta-label">
            <span className="meta-index">[03]</span> SELECTED COMMISSIONS
          </span>
          <h2 className="work-headline">
            Proven Results for Discerning Brands.
          </h2>
          <p className="work-subtext">
            A curated archive of digital flagships and scaled paid advertising deployments. Every commission is judged by both aesthetic authority and commercial velocity.
          </p>
        </div>

        {/* Filter Navigation */}
        <div className="work-filters border-top border-bottom">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            ALL WORKS [4]
          </button>
          <button
            className={`filter-btn border-left ${filter === 'web' ? 'active' : ''}`}
            onClick={() => setFilter('web')}
          >
            WEBSITE DEVELOPMENT [2]
          </button>
          <button
            className={`filter-btn border-left ${filter === 'social' ? 'active' : ''}`}
            onClick={() => setFilter('social')}
          >
            SOCIAL MEDIA ADVERTISING [2]
          </button>
        </div>

        {/* Projects Monograph Grid */}
        <div className="projects-grid">
          {filteredProjects.map((project, index) => (
            <article key={project.id} className="project-card border-bottom">
              <div className="project-visual-box" onClick={() => setActiveProject(project)}>
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="project-image" 
                  loading="lazy"
                />
                <div className="visual-overlay">
                  <span className="inspect-btn">INSPECT CASE DOSSIER</span>
                </div>
              </div>

              <div className="project-details">
                <div className="project-meta-bar">
                  <span className="project-num">{project.id} / COMMISSION</span>
                  <span className="project-discipline">{project.discipline}</span>
                  <span className="project-year">{project.year}</span>
                </div>

                <h3 className="project-title" onClick={() => setActiveProject(project)}>
                  {project.title}
                </h3>
                
                <p className="project-headline-desc">{project.headline}</p>
                <p className="project-summary">{project.summary}</p>

                <div className="project-results-strip border-top">
                  <div className="result-block">
                    <span className="result-label">PRIMARY OUTCOME</span>
                    <span className="result-value">{project.resultPrimary}</span>
                  </div>
                  <div className="result-block border-left">
                    <span className="result-label">TECHNICAL BENCHMARK</span>
                    <span className="result-value">{project.resultSecondary}</span>
                  </div>
                </div>

                <button 
                  className="project-action-btn border-top"
                  onClick={() => setActiveProject(project)}
                >
                  VIEW FULL CASE ANALYSIS
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Case Study Modal / Dossier Overlay */}
      {activeProject && (
        <div className="modal-backdrop" onClick={() => setActiveProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header border-bottom">
              <div>
                <span className="modal-index">COMMISSION {activeProject.id}</span>
                <h3 className="modal-title">{activeProject.title}</h3>
                <span className="modal-sub">{activeProject.discipline} ({activeProject.year})</span>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setActiveProject(null)}
                aria-label="Close Modal"
              >
                CLOSE [ESC]
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-image-wrap border-bottom">
                <img src={activeProject.image} alt={activeProject.title} className="modal-img" />
              </div>

              <div className="modal-metrics-strip border-bottom">
                {activeProject.metrics.map((m, idx) => (
                  <div key={idx} className={`metric-unit ${idx > 0 ? 'border-left' : ''}`}>
                    <span className="metric-unit-val">{m.value}</span>
                    <span className="metric-unit-label">{m.label}</span>
                  </div>
                ))}
              </div>

              <div className="modal-sections-grid">
                <div className="modal-sec">
                  <span className="modal-sec-tag">THE STRATEGIC CHALLENGE</span>
                  <p className="modal-sec-text">{activeProject.challenge}</p>
                </div>

                <div className="modal-sec border-left">
                  <span className="modal-sec-tag">THE ARCHITECTURAL SOLUTION</span>
                  <p className="modal-sec-text">{activeProject.solution}</p>
                </div>
              </div>

              <div className="modal-scope-box border-top">
                <span className="modal-sec-tag">DELIVERED TECHNICAL &amp; CREATIVE SCOPE</span>
                <p className="modal-scope-text">{activeProject.scope}</p>
              </div>
            </div>

            <div className="modal-footer border-top">
              <a 
                href="#initiation" 
                className="modal-initiate-btn"
                onClick={() => setActiveProject(null)}
              >
                COMMISSION A SIMILAR PROJECT
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
