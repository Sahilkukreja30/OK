/**
 * CITYREACH Contentful Service
 * Connects directly to Contentful Content Delivery API (CDA) using the 'pageBlogPost' content model.
 * Resolves linked Assets (featuredImage, author avatar) and Entries (author, seoFields, relatedBlogPosts).
 * Strictly live Contentful data only (no dummy blogs).
 */

import { normalizeCountryCode } from './geoService';

const SPACE_ID = import.meta.env.VITE_CONTENTFUL_SPACE_ID || 'ogzk8tbw9009';
const ACCESS_TOKEN =
  import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN ||
  '_ZBwhDg4gmT9wPa15J_LtvkWubxPO8vTF_QBe_I8gvA';
const ENVIRONMENT = import.meta.env.VITE_CONTENTFUL_ENVIRONMENT || 'master';

/**
 * Resolves raw Contentful Delivery API items with their included Assets & Entries
 */
function resolveContentfulResponse(data) {
  if (!data || !data.items) return [];

  const assetMap = new Map();
  if (data.includes && data.includes.Asset) {
    data.includes.Asset.forEach((asset) => {
      assetMap.set(asset.sys.id, asset);
    });
  }

  const entryMap = new Map();
  if (data.includes && data.includes.Entry) {
    data.includes.Entry.forEach((entry) => {
      entryMap.set(entry.sys.id, entry);
    });
  }

  return data.items.map((item) => {
    const fields = { ...item.fields };

    // Resolve featuredImage Asset Link
    if (fields.featuredImage && fields.featuredImage.sys) {
      const asset = assetMap.get(fields.featuredImage.sys.id);
      if (asset) {
        let url = asset.fields?.file?.url || '';
        if (url.startsWith('//')) {
          url = 'https:' + url;
        }
        fields.featuredImage = {
          fields: {
            ...asset.fields,
            file: {
              ...asset.fields?.file,
              url
            }
          }
        };
      }
    }

    // Resolve author Entry Link
    if (fields.author && fields.author.sys) {
      const authorEntry = entryMap.get(fields.author.sys.id);
      if (authorEntry) {
        let avatarUrl = '';
        if (authorEntry.fields?.avatar && authorEntry.fields.avatar.sys) {
          const avatarAsset = assetMap.get(authorEntry.fields.avatar.sys.id);
          if (avatarAsset && avatarAsset.fields?.file?.url) {
            avatarUrl = avatarAsset.fields.file.url.startsWith('//')
              ? 'https:' + avatarAsset.fields.file.url
              : avatarAsset.fields.file.url;
          }
        }
        fields.author = {
          fields: {
            name:
              authorEntry.fields.name ||
              authorEntry.fields.internalName ||
              'CITYREACH Editorial',
            role: 'Author',
            avatarUrl: avatarUrl || ''
          }
        };
      }
    }

    // Resolve SEO fields
    if (fields.seoFields && fields.seoFields.sys) {
      const seoEntry = entryMap.get(fields.seoFields.sys.id);
      if (seoEntry) {
        fields.seoFields = { fields: seoEntry.fields };
      }
    }

    // Resolve relatedBlogPosts
    if (Array.isArray(fields.relatedBlogPosts)) {
      fields.relatedBlogPosts = fields.relatedBlogPosts
        .map((rel) => {
          if (rel && rel.sys) {
            const relEntry = entryMap.get(rel.sys.id);
            if (relEntry) {
              const relFields = { ...relEntry.fields };
              if (relFields.featuredImage && relFields.featuredImage.sys) {
                const relAsset = assetMap.get(relFields.featuredImage.sys.id);
                if (relAsset && relAsset.fields?.file?.url) {
                  let relUrl = relAsset.fields.file.url;
                  if (relUrl.startsWith('//')) relUrl = 'https:' + relUrl;
                  relFields.featuredImage = {
                    fields: { ...relAsset.fields, file: { url: relUrl } }
                  };
                }
              }
              return { sys: relEntry.sys, fields: relFields };
            }
            return null;
          }
          return rel;
        })
        .filter(Boolean);
    }

    return {
      sys: item.sys,
      fields
    };
  });
}

/**
 * Fetches all live blog posts from Contentful API
 */
export async function fetchAllBlogPosts() {
  if (!SPACE_ID || !ACCESS_TOKEN) {
    console.warn('Contentful Space ID or Access Token is missing.');
    return [];
  }

  try {
    const url = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT}/entries?content_type=pageBlogPost&include=2&order=-fields.publishedDate&access_token=${ACCESS_TOKEN}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      return resolveContentfulResponse(json);
    } else {
      console.warn(`Contentful API error: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error('Failed to fetch from Contentful Delivery API:', err);
  }

  return [];
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
  const cleanSlug = slug.replace(/^\//, '');

  // 1. Fetch direct by slug from Contentful API
  if (SPACE_ID && ACCESS_TOKEN) {
    try {
      const url = `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/${ENVIRONMENT}/entries?content_type=pageBlogPost&fields.slug=${encodeURIComponent(
        cleanSlug
      )}&include=2&access_token=${ACCESS_TOKEN}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const resolved = resolveContentfulResponse(json);
        if (resolved.length > 0) {
          return resolved[0];
        }
      }
    } catch (e) {
      console.warn('Direct slug query failed, falling back to all posts scan:', e);
    }
  }

  // 2. Fallback scan all posts
  const allPosts = await fetchAllBlogPosts();
  return (
    allPosts.find(
      (p) => p.fields?.slug === cleanSlug || p.fields?.slug === slug
    ) || null
  );
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
