/**
 * CITYREACH Contentful Service
 * Reads published content from the Contentful Content Delivery API (CDA):
 * blog posts (`pageBlogPost`), client logos (`clientLogo`) and case studies (`caseStudy`).
 * Content is edited from the /admin dashboard. Linked Assets and Entries are resolved here.
 */

import { normalizeCountryCode } from './geoService.js';

const SPACE_ID = import.meta.env.VITE_CONTENTFUL_SPACE_ID || 'ogzk8tbw9009';
const ACCESS_TOKEN = import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN || '_ZBwhDg4gmT9wPa15J_LtvkWubxPO8vTF_QBe_I8gvA';
const ENVIRONMENT = import.meta.env.VITE_CONTENTFUL_ENVIRONMENT || 'master';
const DELIVERY_BASE = import.meta.env.VITE_CONTENTFUL_DELIVERY_BASE || 'https://cdn.contentful.com';

const withProtocol = (url = '') => (url.startsWith('//') ? `https:${url}` : url);

/** An Asset with a protocol-complete file url. */
function normalizeAsset(asset) {
  if (!asset) return null;
  return { ...asset, fields: { ...asset.fields, file: { ...asset.fields?.file, url: withProtocol(asset.fields?.file?.url) } } };
}

const byId = (items = []) => new Map(items.map((item) => [item.sys.id, item]));

/** GET entries of one content type. Returns the raw payload, or null when the request fails. */
async function fetchEntries(contentType, params = {}) {
  if (!SPACE_ID || !ACCESS_TOKEN) {
    console.warn('Contentful Space ID or Access Token is missing.');
    return null;
  }

  const query = new URLSearchParams({ content_type: contentType, include: 2, ...params, access_token: ACCESS_TOKEN });
  try {
    const res = await fetch(`${DELIVERY_BASE}/spaces/${SPACE_ID}/environments/${ENVIRONMENT}/entries?${query}`);
    if (res.ok) return await res.json();
    console.warn(`Contentful API error: ${res.status} ${res.statusText}`);
  } catch (err) {
    console.error('Failed to fetch from Contentful Delivery API:', err);
  }
  return null;
}

/** Swaps asset links inside a rich-text document for the full Asset (so images can render). */
function resolveEmbeddedAssets(node, assetMap) {
  if (!node?.content) return node;
  const content = node.content.map((child) => {
    const target = child.data?.target;
    if (child.nodeType === 'embedded-asset-block' && target?.sys) {
      return { ...child, data: { ...child.data, target: normalizeAsset(assetMap.get(target.sys.id)) } };
    }
    return resolveEmbeddedAssets(child, assetMap);
  });
  return { ...node, content };
}

/** Resolves an author link into the shape the blog UI expects. */
function resolveAuthor(link, entryMap, assetMap) {
  const authorEntry = link?.sys && entryMap.get(link.sys.id);
  if (!authorEntry) return link;

  const avatar = authorEntry.fields?.avatar?.sys && assetMap.get(authorEntry.fields.avatar.sys.id);
  return {
    fields: {
      name: authorEntry.fields.name || authorEntry.fields.internalName || 'CITYREACH Editorial',
      role: 'Author',
      avatarUrl: withProtocol(avatar?.fields?.file?.url)
    }
  };
}

function resolveBlogPost(item, { assetMap, entryMap }) {
  const fields = { ...item.fields };

  if (fields.featuredImage?.sys) {
    fields.featuredImage = normalizeAsset(assetMap.get(fields.featuredImage.sys.id)) ?? fields.featuredImage;
  }
  if (fields.content) fields.content = resolveEmbeddedAssets(fields.content, assetMap);
  if (fields.author) fields.author = resolveAuthor(fields.author, entryMap, assetMap);

  if (fields.seoFields?.sys) {
    const seoEntry = entryMap.get(fields.seoFields.sys.id);
    if (seoEntry) {
      const shareImage = seoEntry.fields.shareImages?.[0];
      fields.seoFields = {
        fields: { ...seoEntry.fields, shareImage: normalizeAsset(shareImage && assetMap.get(shareImage.sys.id)) }
      };
    }
  }

  if (Array.isArray(fields.relatedBlogPosts)) {
    fields.relatedBlogPosts = fields.relatedBlogPosts
      .map((rel) => {
        const relEntry = rel?.sys && entryMap.get(rel.sys.id);
        if (!relEntry) return null;
        const image = relEntry.fields.featuredImage?.sys && assetMap.get(relEntry.fields.featuredImage.sys.id);
        return {
          sys: relEntry.sys,
          fields: { ...relEntry.fields, featuredImage: normalizeAsset(image) ?? relEntry.fields.featuredImage }
        };
      })
      .filter(Boolean);
  }

  return { sys: item.sys, fields };
}

function resolveBlogResponse(data) {
  if (!data?.items) return [];
  const context = { assetMap: byId(data.includes?.Asset), entryMap: byId(data.includes?.Entry) };
  return data.items.map((item) => resolveBlogPost(item, context));
}

/**
 * Fetches all live blog posts from Contentful API
 */
export async function fetchAllBlogPosts() {
  const data = await fetchEntries('pageBlogPost', { order: '-fields.publishedDate' });
  return resolveBlogResponse(data);
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
  const [post] = resolveBlogResponse(await fetchEntries('pageBlogPost', { 'fields.slug': cleanSlug }));
  return post ?? null;
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

const LIST_ORDER = 'fields.sortOrder,sys.createdAt';

/** Flat objects with every linked asset replaced by its url. */
async function fetchFlatEntries(contentType, assetKeys) {
  const data = await fetchEntries(contentType, { order: LIST_ORDER });
  const assetMap = byId(data?.includes?.Asset);

  return (data?.items ?? []).map(({ sys, fields }) => {
    const flat = { id: sys.id, ...fields };
    for (const key of assetKeys) {
      const asset = fields[key]?.sys && assetMap.get(fields[key].sys.id);
      flat[key] = withProtocol(asset?.fields?.file?.url);
    }
    return flat;
  });
}

export async function fetchClientLogos() {
  const logos = await fetchFlatEntries('clientLogo', ['logo']);
  return logos
    .filter((logo) => logo.logo)
    .map((logo) => ({ id: logo.id, name: logo.name, url: logo.websiteUrl || null, src: logo.logo, type: logo.displayStyle || 'standard' }));
}

export async function fetchCaseStudies() {
  const studies = await fetchFlatEntries('caseStudy', ['image']);
  return studies.filter((study) => study.image).map((study, index) => ({
    ...study,
    number: String(index + 1).padStart(2, '0'),
    metrics: Array.isArray(study.metrics) ? study.metrics : []
  }));
}
