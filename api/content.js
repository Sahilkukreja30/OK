import { listPublished } from './_lib/contentStore.js';
import { HttpError } from './_lib/errors.js';
import { handle } from './_lib/http.js';

export default handle(
  {
    /** Public: published blogs, client logos or case studies for the website. ?resource=blog[&slug=…] */
    GET: async ({ query }, res) => {
      if (!query.resource) throw new HttpError(400, 'Missing "resource".');
      const entries = await listPublished(query.resource, { slug: query.slug });
      if (query.slug && !entries.length) throw new HttpError(404, 'Not found.');

      // max-age=0: browsers always ask again, so an edit shows after a normal reload; only Vercel's CDN caches (1 minute).
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=60');
      return query.slug ? entries[0] : entries;
    }
  },
  { open: true }
);
