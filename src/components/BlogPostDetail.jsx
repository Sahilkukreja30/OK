import React, { useState, useEffect } from 'react';
import { useRouter } from '../router/RouterContext';
import { getBlogPostBySlug } from '../services/contentService';
import usePageMeta from '../hooks/usePageMeta';
import RichTextRenderer from './RichTextRenderer';
import './BlogPostDetail.css';

function formatDateLong(dateStr) {
  if (!dateStr) return '';
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

/** SEO tags for a post: the editor's SEO fields win, with sensible fallbacks. */
function buildPostMeta(post) {
  if (!post) return { title: null };

  const { title, shortDescription, publishedDate, featuredImage, seoFields } = post.fields;
  const seo = seoFields?.fields ?? {};
  const image = seo.shareImage?.fields?.file?.url || featuredImage?.fields?.file?.url;
  const description = seo.pageDescription || shortDescription;
  const canonical = seo.canonicalUrl || `${window.location.origin}${window.location.pathname}`;

  return {
    title: seo.pageTitle || title,
    description,
    image,
    canonical,
    noindex: seo.noindex,
    nofollow: seo.nofollow,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      image,
      datePublished: publishedDate,
      mainEntityOfPage: canonical,
      publisher: { '@type': 'Organization', name: 'CITYREACH' }
    }
  };
}

export default function BlogPostDetail() {
  const { slug, countryCode, goToBlogIndex } = useRouter();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadPost() {
      if (!slug) return;
      setIsLoading(true);
      const postData = await getBlogPostBySlug(slug);
      if (isMounted) {
        setPost(postData);
        setIsLoading(false);
      }
    }
    loadPost();
    return () => {
      isMounted = false;
    };
  }, [slug, countryCode]);

  usePageMeta(buildPostMeta(post));

  if (isLoading) {
    return (
      <div className="article-page-container">
        <div className="article-loading-state">
          <div className="loading-spinner" />
          <span>LOADING ESSAY...</span>
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
            ← RETURN TO BLOGS
          </button>
        </div>
      </div>
    );
  }

  const { title, shortDescription, publishedDate, featuredImage, content } = post.fields;
  const dateFormatted = formatDateLong(publishedDate);
  const readingTime = calculateReadingTimeDetail(post);

  return (
    <article className="article-page-container">
      {/* Top Back Link */}
      <nav className="article-top-nav" aria-label="Breadcrumb">
        <button className="nav-back-link" onClick={() => goToBlogIndex()}>
          <span className="arrow">←</span> BLOGS
        </button>
      </nav>

      {/* Article Header */}
      <header className="article-main-header">
        <div className="article-meta-row">
          {dateFormatted && <span>{dateFormatted}</span>}
          {dateFormatted && readingTime && <span>•</span>}
          {readingTime && <span>{readingTime}</span>}
        </div>

        <h1 className="article-headline">{title}</h1>

        {shortDescription && <p className="article-standfirst">{shortDescription}</p>}
      </header>

      {/* Featured Image */}
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
        </figure>
      )}

      {/* Article Content Core Container */}
      <div className="article-body-wrapper">
        <RichTextRenderer document={content} />
      </div>
    </article>
  );
}
