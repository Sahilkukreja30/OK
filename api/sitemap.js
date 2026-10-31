import { normalizeCountryCode } from '../src/services/geoService.js';
import { listPublished } from './_lib/contentStore.js';
import { config } from './_lib/config.js';

const STATIC_PATHS = ['/', '/in', '/ae', '/blog', '/in/blog', '/ae/blog'];
const COUNTRY_PREFIX = { IN: '/in', AE: '/ae' };

const escapeXml = (value) => value.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

export default async function sitemap(req, res) {
  const siteUrl = config().siteUrl ?? `https://${req.headers.host}`;
  const posts = await listPublished('blog').catch(() => []);

  const urls = [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...posts.map((post) => ({
      path: `${COUNTRY_PREFIX[normalizeCountryCode(post.country)] ?? ''}/blog/${post.slug}`,
      lastmod: post.updatedAt.slice(0, 10)
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
