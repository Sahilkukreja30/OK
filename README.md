# CITYREACH website

React 19 + Vite site, deployed on Vercel. Content (blogs, client logos, case studies) lives in Contentful and is edited from the built-in **/admin** dashboard – no code changes needed.

## Develop

```bash
npm install
npm run dev      # site + /api handlers on http://localhost:5173
npm test         # converters, auth and the admin API (against an in-memory fake of Contentful)
npm run lint
npm run build
```

`vite dev` serves the `/api` handlers itself (`scripts/devApiPlugin.js`), so the Vercel CLI is not needed.

## Admin dashboard (`/admin`)

| Tab | What it controls | Where it shows |
| --- | --- | --- |
| Blogs | Title, URL slug, audience (India / UAE / Global), banner image, article body with in-text pictures, full SEO fields | `/blog`, `/in/blog`, `/ae/blog` |
| Client logos | Name, website, logo, display style, order | "Brands we've worked with" wall (the built-in logos are used until the first one is added) |
| Case studies | Project, results, cover image, challenge / solution / scope, up to 3 metrics, order | "Case studies" section (hidden until the first one is added) |

Entries can be **published** (live) or saved as **draft**. Images are compressed to WebP in the browser before upload.

### One-time setup

1. In Contentful create a *Content management token* (Settings → API keys).
2. Copy `.env.example` to `.env.local` (local) or add the same variables in Vercel → Settings → Environment Variables:
   `ADMIN_PASSWORD`, `CONTENTFUL_MANAGEMENT_TOKEN`, `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN` (and optionally `SITE_URL`).
3. Create the two new content types once (blog types already exist):

   ```bash
   node scripts/setup-contentful.js          # dry run, shows what will be created
   node scripts/setup-contentful.js --apply  # creates `clientLogo` and `caseStudy`
   ```

The management token and password only ever exist on the server (`/api`), never in the browser bundle.

### SEO

Every blog post gets its own `<title>`, meta description, canonical URL, robots (noindex / nofollow), Open Graph / Twitter tags and Article JSON-LD, from the SEO fields in the admin (falling back to title / short description). `/sitemap.xml` lists all published posts. `robots.txt` keeps `/admin` out of search.

## How it is organised

- `shared/` – the single registry of managed content (`resources.js`) and the markdown ↔ Contentful rich-text converter. The admin forms, the API validation and the setup script all read from it: **adding a field means editing one entry there.**
- `api/` – Vercel serverless functions: `admin/login`, `admin/resource` (list / get / save / delete), `admin/upload`, `sitemap`. `api/_lib` holds auth, the Contentful Management client and the save logic.
- `src/admin/` – the dashboard (lazy-loaded, so visitors never download it). Field inputs are registered by type in `src/admin/fields/index.jsx`.
- `src/services/contentfulService.js` – public read access (Content Delivery API).
- `tests/mockContentful.js` – fake Contentful. Run `node tests/mockContentful.js 4010` and point `CONTENTFUL_MANAGEMENT_BASE`, `CONTENTFUL_UPLOAD_BASE`, `CONTENTFUL_DELIVERY_BASE` and `VITE_CONTENTFUL_DELIVERY_BASE` at it to try the admin without touching the real space.
