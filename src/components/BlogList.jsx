import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../router/RouterContext';
import { fetchAllBlogPosts, filterPostsByCountry } from '../services/contentfulService';
import { getCountryMeta, normalizeCountryCode } from '../services/geoService';
import './BlogList.css';

function formatDate(dateStr) {
  if (!dateStr) return 'Recent';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function calculateReadingTime(post) {
  if (post.fields?.readingTime) return post.fields.readingTime;
  if (!post.fields?.content) return '3 MIN READ';
  try {
    const raw = JSON.stringify(post.fields.content);
    const words = raw.split(/\s+/).length;
    const mins = Math.max(2, Math.ceil(words / 180));
    return `${mins} MIN READ`;
  } catch {
    return '3 MIN READ';
  }
}

export default function BlogList() {
  const { countryCode, goToBlogPost, goToHome } = useRouter();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const currentCountryMeta = getCountryMeta(countryCode);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const all = await fetchAllBlogPosts();
      if (isMounted) {
        setPosts(all);
        setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute dynamic categories from loaded posts
  const availableCategories = useMemo(() => {
    const set = new Set(['All']);
    posts.forEach((p) => {
      if (p.fields?.category) set.add(p.fields.category);
    });
    return Array.from(set);
  }, [posts]);

  // Filter by country and search/category
  const filteredPosts = useMemo(() => {
    const countryFiltered = filterPostsByCountry(posts, countryCode);

    return countryFiltered.filter((post) => {
      const title = post.fields?.title?.toLowerCase() || '';
      const desc = post.fields?.shortDescription?.toLowerCase() || '';
      const cat = post.fields?.category || 'General';
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || title.includes(q) || desc.includes(q);
      const matchesCategory =
        activeCategory === 'All' || cat.toLowerCase() === activeCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [posts, countryCode, searchQuery, activeCategory]);

  const featuredPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);

  const whatsappUrl =
    'https://wa.me/919111110422?text=HELLO%2C%20I%20WOULD%20LIKE%20TO%20KNOW%20MORE%20ABOUT%20YOUR%20SERVICES!';

  return (
    <div className="blog-page-container">
      {/* Background Ambience */}
      <div className="blog-bg-ambient" />

      {/* Top Breadcrumb & Back to Home */}
      <div className="blog-top-bar">
        <button className="back-home-btn" onClick={() => goToHome()}>
          <span className="back-arrow">←</span> BACK TO MAIN ATELIER
        </button>
        <div className="blog-brand-pill">CITYREACH EDITORIAL ARCHIVE</div>
      </div>

      {/* Main Blog Header */}
      <header className="blog-hero-header">
        <div className="blog-title-group">
          <div className="hero-eyebrow">
            <span className="pulsing-dot" />
            <span>PERSPECTIVES & INTELLIGENCE</span>
          </div>
          <h1 className="blog-main-heading">
            THOUGHT LEADERSHIP FOR BRANDS THAT DEMAND CONVERSION.
          </h1>
          <p className="blog-subheading">
            Strategic essays on high-conversion digital architecture, razor-sharp visual restraint, and scaling
            enterprises across India, the UAE, and global markets.
          </p>
        </div>
      </header>

      {/* Filter and Search Controls (shown when posts exist or searching) */}
      {(posts.length > 0 || searchQuery) && (
        <div className="blog-controls-section">
          {availableCategories.length > 1 && (
            <div className="category-chips-list">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Search Input */}
          <div className="search-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search articles, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')} aria-label="Clear Search">
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="blog-loading-state">
          <div className="loading-spinner" />
          <span>CONNECTING TO CONTENTFUL ARCHIVE...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        /* Empty State */
        <div className="blog-empty-state">
          <span className="empty-icon">⌘</span>
          <h3>{searchQuery ? 'No matching articles' : 'Editorial Archive Initializing'}</h3>
          <p>
            {searchQuery
              ? `No articles found matching "${searchQuery}".`
              : `Articles published in Contentful for ${currentCountryMeta.name} will appear here.`}
          </p>
          {searchQuery && (
            <button
              className="reset-filters-btn"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
            >
              CLEAR SEARCH
            </button>
          )}
        </div>
      ) : (
        /* Blog Articles Layout */
        <div className="blog-content-layout">
          {/* Featured Article Spotlight */}
          {featuredPost && (
            <article
              className="featured-post-card"
              onClick={() => goToBlogPost(featuredPost.fields?.slug, featuredPost.fields?.country)}
            >
              <div className="featured-image-container">
                {featuredPost.fields?.featuredImage?.fields?.file?.url ? (
                  <img
                    src={featuredPost.fields.featuredImage.fields.file.url}
                    alt={featuredPost.fields?.title || 'Featured Article'}
                    className="featured-image"
                    loading="eager"
                  />
                ) : (
                  <div className="featured-image-placeholder" />
                )}
                <div className="image-overlay-vignette" />
                <div className="featured-badge-pill">FEATURED ESSAY</div>
              </div>

              <div className="featured-details-block">
                <div className="card-meta-row">
                  <span className="region-tag">
                    {normalizeCountryCode(featuredPost.fields?.country) === 'IN'
                      ? '🇮🇳 INDIA'
                      : normalizeCountryCode(featuredPost.fields?.country) === 'AE'
                      ? '🇦🇪 UAE'
                      : '🌐 GLOBAL'}
                  </span>
                  <span className="meta-sep">/</span>
                  <span className="date-tag">
                    {formatDate(featuredPost.fields?.publishedDate)}
                  </span>
                  <span className="meta-sep">/</span>
                  <span className="reading-time">{calculateReadingTime(featuredPost)}</span>
                </div>

                <h2 className="featured-post-title">{featuredPost.fields?.title}</h2>
                {featuredPost.fields?.shortDescription && (
                  <p className="featured-post-excerpt">{featuredPost.fields.shortDescription}</p>
                )}

                <div className="card-footer-row">
                  <div className="author-chip">
                    {featuredPost.fields?.author?.fields?.avatarUrl && (
                      <img
                        src={featuredPost.fields.author.fields.avatarUrl}
                        alt="Author"
                        className="author-avatar"
                      />
                    )}
                    <span className="author-name">
                      {featuredPost.fields?.author?.fields?.name || 'CITYREACH Principal'}
                    </span>
                  </div>

                  <div className="read-action-btn">
                    <span>READ ESSAY</span>
                    <span className="action-arrow">→</span>
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* Secondary Grid of Articles */}
          {gridPosts.length > 0 && (
            <div className="secondary-posts-grid">
              {gridPosts.map((post) => {
                const postCountry = normalizeCountryCode(post.fields?.country);
                const countryTag =
                  postCountry === 'IN' ? '🇮🇳 INDIA' : postCountry === 'AE' ? '🇦🇪 UAE' : '🌐 GLOBAL';

                return (
                  <article
                    key={post.sys?.id || post.fields?.slug}
                    className="grid-post-card"
                    onClick={() => goToBlogPost(post.fields?.slug, post.fields?.country)}
                  >
                    <div className="grid-image-wrapper">
                      {post.fields?.featuredImage?.fields?.file?.url ? (
                        <img
                          src={post.fields.featuredImage.fields.file.url}
                          alt={post.fields?.title}
                          className="grid-image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid-image-placeholder" />
                      )}
                      <div className="grid-card-region">{countryTag}</div>
                    </div>

                    <div className="grid-card-content">
                      <div className="grid-meta-row">
                        <span>{formatDate(post.fields?.publishedDate)}</span>
                        <span>•</span>
                        <span>{calculateReadingTime(post)}</span>
                      </div>

                      <h3 className="grid-post-title">{post.fields?.title}</h3>
                      {post.fields?.shortDescription && (
                        <p className="grid-post-desc">{post.fields.shortDescription}</p>
                      )}

                      <div className="grid-footer-row">
                        <span className="grid-author">
                          By {post.fields?.author?.fields?.name || 'CITYREACH Lead'}
                        </span>
                        <span className="grid-read-arrow">READ →</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom Consultation CTA */}
      <section className="blog-cta-banner">
        <div className="cta-inner-block">
          <span className="cta-label">ENGINEERED FOR SUPREMACY</span>
          <h2 className="cta-heading">Ready to transform your digital presence?</h2>
          <p className="cta-description">
            We architect websites that speak, command prestige, and convert visitors into high-value clients across
            India, the UAE, and worldwide.
          </p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="cta-action-btn">
            <span>INITIATE ON WHATSAPP</span>
            <span className="cta-arrow">→</span>
          </a>
        </div>
      </section>
    </div>
  );
}
