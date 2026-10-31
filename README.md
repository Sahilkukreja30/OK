# CITYREACH website

React 19 + Vite site, deployed on Vercel. Blogs, client logos and case studies are edited from the built-in **/admin** dashboard – no code changes needed. Content is stored in **Vercel Blob** (no third-party CMS).

## Develop

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD
npm run dev                  # site + /api handlers (default http://localhost:5173)
npm test                     # converters, auth and the admin API (runs against a temp folder)
npm run lint
npm run build
```

`vite dev` serves the `/api` handlers itself (`scripts/devApiPlugin.js`), so the Vercel CLI is not needed. Locally, content is kept as plain files in `./.data` (git-ignored) – no account or token required. Delete that folder to start fresh.

## Admin dashboard (`/admin`)

Sign in with `ADMIN_PASSWORD`.

| Tab | What it controls | Where it shows |
| --- | --- | --- |
| Blogs | Title, URL slug, audience (India / UAE / Global), banner image, article body with in-text pictures, full SEO fields | `/blog`, `/in/blog`, `/ae/blog` |
| Client logos | Name, website, logo, display style, order | "Brands we've worked with" wall (the built-in logos are used until the first one is added) |
| Case studies | Project, results, cover image, challenge / solution / scope, up to 3 metrics, order | "Case studies" section (hidden until the first one is added) |

Entries can be **published** (live) or saved as **draft**. Images are compressed to WebP in the browser before upload. On the Client logos tab, **Import current website logos** copies the built-in logos into the admin (with their links and styles) so they can be edited like any other; it can be re-run safely.

### Deploying (Vercel)

1. **Storage:** Vercel → project → *Storage* → *Create* → **Blob** (choose **Public**) → connect it to this project. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.
2. **Environment variables** (Production): `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (a separate random string, e.g. `openssl rand -base64 32`) and optionally `SITE_URL`. See `.env.example`.
3. **Redeploy** (variables only apply to new deployments), then open `/admin`.

Without a connected Blob store the admin refuses to save and says so, rather than writing to a disk that is thrown away. Everything runs on the server (`/api`); the password never reaches the browser.

Good to know: draft entries live in the same stored document as published ones, so their data is not secret – only keep content there that you'd be fine with being found if someone guessed the storage address.

### SEO

Every blog post gets its own `<title>`, meta description, canonical URL, robots (noindex / nofollow), Open Graph / Twitter tags and Article JSON-LD, from the SEO fields in the admin (falling back to title / short description). `/sitemap.xml` lists all published posts. `robots.txt` keeps `/admin` out of search. Changes reach visitors within about a minute (short cache).

## How it is organised

- `shared/` – the single registry of managed content (`resources.js`) and the markdown → rich-text converter. The admin forms and the API validation both read from it: **adding a field means editing one entry there.**
- `api/` – Vercel serverless functions: `admin/login`, `admin/resource` (list / get / save / delete), `admin/upload`, `content` (public read), `media` (local-files mode only), `sitemap`. `api/_lib` holds auth, the content store and the storage drivers.
- `api/_lib/storage/` – `blob.js` (Vercel Blob, production) and `local.js` (plain files, dev and tests). `index.js` picks one.
- `src/admin/` – the dashboard (lazy-loaded, so visitors never download it). Field inputs are registered by type in `src/admin/fields/index.jsx`.
- `src/services/contentService.js` – how the public site reads published content.
