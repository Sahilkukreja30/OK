import { normalizeCountryCode } from '../src/services/geoService.js';
import { config } from './_lib/config.js';

const STATIC_PATHS = ['/', '/in', '/ae', '/blog', '/in/blog', '/ae/blog'];
const COUNTRY_PREFIX = { IN: '/in', AE: '/ae' };

const escapeXml = (value) => value.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

async function fetchPosts() {
  const { deliveryBase, spaceId, environment, deliveryToken } = config();
  const params = new URLSearchParams({
    content_type: 'pageBlogPost',
    select: 'fields.slug,fields.country,sys.updatedAt',
    limit: 1000,
    access_token: deliveryToken
  });
  const response = await fetch(`${deliveryBase}/spaces/${spaceId}/environments/${environment}/entries?${params}`);
  return response.ok ? (await response.json()).items : [];
}

export default async function sitemap(req, res) {
  const siteUrl = config().siteUrl ?? `https://${req.headers.host}`;
  const posts = await fetchPosts().catch(() => []);

  const urls = [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...posts.map((post) => ({
      path: `${COUNTRY_PREFIX[normalizeCountryCode(post.fields.country)] ?? ''}/blog/${post.fields.slug}`,
      lastmod: post.sys.updatedAt.slice(0, 10)
    }))
  ];

  const body = urls
    .map(({ path, lastmod }) => {
      const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
      return `<url><loc>${escapeXml(siteUrl + path)}</loc>${lastmodTag}</url>`;
    })
    .join('');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
  );
}
