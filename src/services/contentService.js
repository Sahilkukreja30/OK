/**
 * CITYREACH content service.
 * Reads published blog posts, client logos and case studies from our own /api/content endpoint.
 * Everything is edited from the /admin dashboard.
 */

import { markdownToRichText } from '../../shared/richText.js';
import { normalizeCountryCode } from './geoService.js';

/** GET /api/content. Resolves to the parsed JSON, or null when the request fails. */
async function fetchContent(resource, params = {}) {
  try {
    const res = await fetch(`/api/content?${new URLSearchParams({ resource, ...params })}`);
    if (res.ok) return await res.json();
    if (res.status !== 404) console.warn(`Content API error: ${res.status} ${res.statusText}`);
  } catch (err) {
    console.error('Failed to load content:', err);
  }
  return null;
}

/** Flat API entry -> the post shape the blog components use. */
function toBlogPost(entry) {
  const image = entry.featuredImage?.url;
  return {
    sys: { id: entry.id },
    fields: {
      title: entry.title,
      slug: entry.slug,
      country: entry.country,
      publishedDate: entry.publishedDate,
      shortDescription: entry.shortDescription,
      readingTime: entry.readingTime,
      featuredImage: image ? { fields: { file: { url: image }, title: entry.title } } : null,
      content: entry.content ? markdownToRichText(entry.content) : null,
      seoFields: {
        fields: {
          pageTitle: entry.seoTitle,
          pageDescription: entry.seoDescription,
          canonicalUrl: entry.canonicalUrl,
          noindex: entry.noindex,
          nofollow: entry.nofollow
        }
      }
    }
  };
}

/**
 * Fetches all live blog posts
 */
export async function fetchAllBlogPosts() {
  return ((await fetchContent('blog')) ?? []).map(toBlogPost);
}

/**
 * Filters posts based on active Country Code ('IN' | 'AE' | 'ALL')
 * - When country is 'IN': Shows posts where country is IN/India OR Global/ALL
 * - When country is 'AE': Shows posts where country is AE/UAE OR Global/ALL
 * - When country is 'ALL' or other country: Shows all posts (IN + AE + Global)
 */
export function filterPostsByCountry(posts, countryCode) {
  if (!posts || !Array.isArray(posts)) return [];
  const normalizedTarget = normalizeCountryCode(countryCode);

  if (normalizedTarget === 'ALL') {
    // Return all posts for global or non-IN/AE visitors
    return posts;
  }

  return posts.filter((post) => {
    const postCountry = normalizeCountryCode(post.fields?.country);
    // Include specific country posts OR globally targeted posts
    return postCountry === normalizedTarget || postCountry === 'ALL';
  });
}

/**
 * Retrieves single blog post by its URL slug
 */
export async function getBlogPostBySlug(slug) {
  if (!slug) return null;
  const entry = await fetchContent('blog', { slug: slug.replace(/^\//, '') });
  return entry ? toBlogPost(entry) : null;
}

/**
 * Retrieves related posts for a given post
 */
export async function getRelatedPosts(currentSlug, countryCode = 'ALL', count = 2) {
  const allPosts = await fetchAllBlogPosts();
  const filtered = filterPostsByCountry(allPosts, countryCode).filter(
    (p) => p.fields?.slug !== currentSlug
  );
  return filtered.slice(0, count);
}

/* ---------- Home page content: client logos & case studies ---------- */

export async function fetchClientLogos() {
  const logos = (await fetchContent('logo')) ?? [];
  return logos
    .filter((logo) => logo.logo?.url)
    .map((logo) => ({ id: logo.id, name: logo.name, url: logo.websiteUrl || null, src: logo.logo.url, type: logo.displayStyle || 'standard' }));
}

export async function fetchCaseStudies() {
  const studies = ((await fetchContent('caseStudy')) ?? []).filter((study) => study.image?.url);
  return studies.map((study, index) => ({
    ...study,
    image: study.image.url,
    number: String(index + 1).padStart(2, '0'),
    metrics: Array.isArray(study.metrics) ? study.metrics : []
  }));
}
