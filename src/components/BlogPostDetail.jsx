import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { getBlogPostBySlug, getRelatedPosts } from '../services/contentfulService';
import { normalizeCountryCode, getCountryMeta } from '../services/geoService';
import RichTextRenderer from './RichTextRenderer';
import './BlogPostDetail.css';

function formatDateLong(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function calculateReadingTimeDetail(post) {
  if (post?.fields?.readingTime) return post.fields.readingTime;
  if (!post?.fields?.content) return '3 MIN READ';
  try {
    const raw = JSON.stringify(post.fields.content);
    const words = raw.split(/\s+/).length;
    const mins = Math.max(2, Math.ceil(words / 180));
    return `${mins} MIN READ`;
  } catch {
    return '3 MIN READ';
  }
}

export default function BlogPostDetail() {
  const { slug, countryCode, goToBlogIndex, goToBlogPost, goToHome } = useRouter();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPost() {
      if (!slug) return;
      setIsLoading(true);
      const postData = await getBlogPostBySlug(slug);
      if (isMounted) {
        setPost(postData);
        if (postData) {
          const rel = await getRelatedPosts(slug, postData.fields?.country || countryCode, 2);
          setRelatedPosts(rel);
        }
        setIsLoading(false);
      }
    }
    loadPost();
    return () => {
      isMounted = false;
    };
  }, [slug, countryCode]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTitle = post?.fields?.title || 'CITYREACH Editorial';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const postCountryCode = normalizeCountryCode(post?.fields?.country || countryCode);
  const countryMeta = getCountryMeta(postCountryCode);

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareTitle} - Read on CITYREACH: ${currentUrl}`
  )}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareTitle
  )}&url=${encodeURIComponent(currentUrl)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;

  const whatsappInquiryUrl =
    'https://wa.me/919111110422?text=HELLO%2C%20I%20READ%20YOUR%20ARTICLE%20AND%20WANT%20TO%20DISCUSS%20A%20PROJECT!';

  if (isLoading) {
    return (
      <div className="article-page-container">
        <div className="article-loading-state">
          <div className="loading-spinner" />
          <span>PREPARING EDITORIAL ESSAY...</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="article-page-container">
        <div className="article-not-found">
          <h2>Article Not Found</h2>
          <p>The essay you are searching for does not exist or has been relocated.</p>
          <button className="back-btn-solid" onClick={() => goToBlogIndex()}>
            ← RETURN TO ARCHIVE
          </button>
        </div>
      </div>
    );
  }

  const { title, shortDescription, publishedDate, author, featuredImage, content } = post.fields;

  return (
    <article className="article-page-container">
      {/* Background Ambience */}
      <div className="article-bg-ambient" />

      {/* Top Breadcrumb Header */}
      <nav className="article-nav-header" aria-label="Breadcrumb">
        <div className="nav-left-group">
          <button className="nav-back-link" onClick={() => goToBlogIndex()}>
            <span className="arrow">←</span> BACK TO {countryMeta.name.toUpperCase()} ARCHIVE
          </button>
        </div>

        <div className="breadcrumb-trail">
          <span className="crumb-link" onClick={() => goToHome()}>
            HOME
          </span>
          <span className="crumb-sep">/</span>
          <span className="crumb-link" onClick={() => goToBlogIndex()}>
            BLOG ({countryMeta.slug.toUpperCase()})
          </span>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">{title}</span>
        </div>
      </nav>

      {/* Article Header */}
      <header className="article-main-header">
        <div className="article-country-badge">
          <span className="badge-flag">{countryMeta.flag}</span>
          <span className="badge-text">{countryMeta.label.toUpperCase()}</span>
        </div>

        <h1 className="article-headline">{title}</h1>

        {shortDescription && <p className="article-standfirst">{shortDescription}</p>}

        {/* Metadata & Author Row */}
        <div className="article-meta-bar">
          <div className="author-block">
            {author?.fields?.avatarUrl && (
              <img src={author.fields.avatarUrl} alt="Author" className="author-photo" />
            )}
            <div className="author-info">
              <span className="author-title-name">{author?.fields?.name || 'CITYREACH Lead'}</span>
              <span className="author-role">{author?.fields?.role || 'Digital Atelier Specialist'}</span>
            </div>
          </div>

          <div className="meta-details-group">
            <div className="meta-item">
              <span className="meta-label">PUBLISHED</span>
              <time className="meta-val" dateTime={publishedDate}>
                {formatDateLong(publishedDate)}
              </time>
            </div>

            <div className="meta-item">
              <span className="meta-label">READING TIME</span>
              <span className="meta-val">{calculateReadingTimeDetail(post)}</span>
            </div>
          </div>

          {/* Share Actions */}
          <div className="share-actions-group">
            <button
              className={`share-icon-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyLink}
              title="Copy Article Link"
              aria-label="Copy Link"
            >
              {copied ? '✓ COPIED' : '🔗 SHARE'}
            </button>

            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-icon-btn"
              title="Share on WhatsApp"
              aria-label="Share on WhatsApp"
            >
              WHATSAPP
            </a>

            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-icon-btn"
              title="Share on X (Twitter)"
              aria-label="Share on X"
            >
              X / TWITTER
            </a>

            <a
              href={linkedinShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="share-icon-btn"
              title="Share on LinkedIn"
              aria-label="Share on LinkedIn"
            >
              LINKEDIN
            </a>
          </div>
        </div>
      </header>

      {/* Featured Image Full Width Showcase */}
      {featuredImage?.fields?.file?.url && (
        <figure className="article-hero-figure">
          <div className="hero-img-frame">
            <img
              src={featuredImage.fields.file.url}
              alt={featuredImage.fields.title || title}
              className="hero-full-img"
              loading="eager"
            />
          </div>
          {featuredImage.fields.title && (
            <figcaption className="hero-img-caption">
              <span>●</span> {featuredImage.fields.title}
            </figcaption>
          )}
        </figure>
      )}

      {/* Article Content Core Container */}
      <div className="article-body-wrapper">
        {/* Rich Text Renderer */}
        <RichTextRenderer document={content} />

        {/* Key Takeaways Callout */}
        <div className="article-takeaways-box">
          <div className="takeaways-header">
            <span className="takeaways-icon">⌘</span>
            <span className="takeaways-title">EXECUTIVE SUMMARY</span>
          </div>
          <p className="takeaways-content">
            In competitive global landscapes, digital performance and visual restraint are inseparable. Brands that
            combine sub-second speed with bespoke typography achieve unmatched trust, lower acquisition costs, and
            sustainable authority.
          </p>
        </div>

        {/* Author Bio Card */}
        <div className="article-author-card">
          {author?.fields?.avatarUrl && (
            <img src={author.fields.avatarUrl} alt="Author" className="bio-avatar" />
          )}
          <div className="bio-text-group">
            <span className="bio-label">ABOUT THE AUTHOR</span>
            <h4 className="bio-name">{author?.fields?.name || 'CITYREACH Principal'}</h4>
            <p className="bio-desc">
              Specializing in high-conversion web architectures, pure black-and-white visual identity systems, and
              scalable digital flagships for premier brands across India, the UAE, and global markets.
            </p>
          </div>
        </div>
      </div>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="related-articles-section">
          <div className="related-header-row">
            <span className="related-label">CONTINUE READING</span>
            <h3 className="related-heading">RELATED STRATEGIC PERSPECTIVES</h3>
          </div>

          <div className="related-grid">
            {relatedPosts.map((rel) => (
              <div
                key={rel.sys?.id || rel.fields?.slug}
                className="related-card"
                onClick={() => goToBlogPost(rel.fields?.slug, rel.fields?.country)}
              >
                <div className="related-img-wrap">
                  <img
                    src={
                      rel.fields?.featuredImage?.fields?.file?.url ||
                      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={rel.fields?.title}
                    className="related-img"
                    loading="lazy"
                  />
                </div>
                <div className="related-content">
                  <span className="related-region">
                    {normalizeCountryCode(rel.fields?.country) === 'IN'
                      ? '🇮🇳 INDIA'
                      : normalizeCountryCode(rel.fields?.country) === 'AE'
                      ? '🇦🇪 UAE'
                      : '🌐 GLOBAL'}
                  </span>
                  <h4 className="related-title">{rel.fields?.title}</h4>
                  <span className="related-read-link">READ ESSAY →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom Conversion Banner */}
      <section className="article-footer-cta">
        <div className="footer-cta-box">
          <span className="footer-cta-tag">COLLABORATE WITH US</span>
          <h2 className="footer-cta-headline">Ready to build a website that commands respect?</h2>
          <p className="footer-cta-sub">
            Let's discuss how CITYREACH can craft an uncompromising digital flagship for your organization.
          </p>
          <a
            href={whatsappInquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-cta-button"
          >
            START CONVERSATION ON WHATSAPP →
          </a>
        </div>
      </section>
    </article>
  );
}
