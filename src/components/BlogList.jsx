import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../router/RouterContext';
import { fetchAllBlogPosts, filterPostsByCountry } from '../services/contentService';
import usePageMeta from '../hooks/usePageMeta';
import './BlogList.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
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
  const { countryCode, goToBlogPost } = useRouter();
  usePageMeta({
    title: 'Blog | CITYREACH',
    description: 'Insights on websites, e-commerce and paid advertising from the CITYREACH team.',
    canonical: `${window.location.origin}${window.location.pathname}`
  });
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Filter posts by active country (IN, AE, or ALL)
  const filteredPosts = useMemo(() => {
    return filterPostsByCountry(posts, countryCode);
  }, [posts, countryCode]);

  return (
    <div className="blog-page-container">
      {/* Single Clean Heading: BLOGS */}
      <header className="blog-header-simple">
        <h1 className="blog-page-title">BLOGS</h1>
      </header>

      {/* Loading State */}
      {isLoading ? (
        <div className="blog-loading-state">
          <div className="loading-spinner" />
          <span>LOADING BLOGS...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="blog-empty-state">
          <p>No blogs published yet.</p>
        </div>
      ) : (
        /* Minimalist Blogs Grid */
        <div className="blogs-grid">
          {filteredPosts.map((post) => {
            const date = formatDate(post.fields?.publishedDate);
            const readTime = calculateReadingTime(post);

            return (
              <article
                key={post.sys?.id || post.fields?.slug}
                className="blog-card"
                onClick={() => goToBlogPost(post.fields?.slug, post.fields?.country)}
              >
                {post.fields?.featuredImage?.fields?.file?.url && (
                  <div className="blog-card-image-wrap">
                    <img
                      src={post.fields.featuredImage.fields.file.url}
                      alt={post.fields?.title || 'Blog Image'}
                      className="blog-card-image"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="blog-card-content">
                  <div className="blog-card-meta">
                    {date && <span>{date}</span>}
                    {date && readTime && <span>•</span>}
                    {readTime && <span>{readTime}</span>}
                  </div>

                  <h2 className="blog-card-title">{post.fields?.title}</h2>

                  {post.fields?.shortDescription && (
                    <p className="blog-card-excerpt">{post.fields.shortDescription}</p>
                  )}

                  <span className="blog-card-read-link">READ ESSAY →</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
