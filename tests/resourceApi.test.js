import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import content from '../api/content.js';
import media from '../api/media.js';
import resource from '../api/admin/resource.js';
import upload from '../api/admin/upload.js';
import sitemap from '../api/sitemap.js';
import { createSessionToken } from '../api/_lib/auth.js';
import { call } from './helpers.js';

let dataDir;
let token;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');

before(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), 'cityreach-test-'));
  Object.assign(process.env, { ADMIN_PASSWORD: 'pw', LOCAL_DATA_DIR: dataDir });
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_STORE_ID;
  delete process.env.VERCEL;
  token = createSessionToken().token;
});

after(() => rm(dataDir, { recursive: true, force: true }));

const api = (handler, options) => call(handler, { token, ...options });
const publicList = (resourceKey, extra = {}) => call(content, { query: { resource: resourceKey, ...extra } });

async function uploadImage(data = PNG, fileName = 'Banner Photo.png') {
  const response = await api(upload, { method: 'POST', body: { fileName, data: data.toString('base64') } });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response.body;
}

const blogValues = (image, overrides = {}) => ({
  title: 'Why speed sells',
  slug: 'why-speed-sells',
  country: 'IN',
  publishedDate: '2026-10-01',
  shortDescription: 'Fast sites convert.',
  featuredImage: image,
  content: '## Heading\n\nSome **bold** body text.',
  seoTitle: '',
  seoDescription: '',
  canonicalUrl: '',
  noindex: false,
  nofollow: false,
  ...overrides
});

test('uploads an image, checks its real type, and serves it back', async () => {
  const { url } = await uploadImage();
  assert.match(url, /^\/api\/media\?key=images%2Fbanner-photo-[0-9a-f]{8}\.png$/);

  const served = await call(media, { query: { key: decodeURIComponent(url.split('key=')[1]) } });
  assert.equal(served.status, 200);
  assert.deepEqual(Buffer.from(served.body), PNG);

  const notAnImage = await api(upload, { method: 'POST', body: { fileName: 'x.png', data: Buffer.from('<svg onload=alert(1)>').toString('base64') } });
  assert.equal(notAnImage.status, 415);
  const lying = await api(upload, { method: 'POST', body: { fileName: 'x.png', contentType: 'image/png', data: Buffer.from('MZ not a png').toString('base64') } });
  assert.equal(lying.status, 415);

  assert.equal((await call(media, { query: { key: '../../etc/passwd' } })).status, 404);
  assert.equal((await call(media, { query: { key: 'images/missing.png' } })).status, 404);
});

test('blog: create (published) -> read -> edit -> draft -> delete', async () => {
  const image = await uploadImage();
  const created = await api(resource, { method: 'POST', body: { resource: 'blog', values: blogValues(image), publish: true } });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  assert.equal(created.body.status, 'published');
  const { id } = created.body;

  // Visible to visitors: list is lightweight (no body) with a reading time, single post has everything.
  const list = await publicList('blog');
  assert.equal(list.body.length, 1);
  assert.equal(list.body[0].title, 'Why speed sells');
  assert.equal(list.body[0].content, undefined);
  assert.equal(list.body[0].readingTime, '1 MIN READ');
  assert.equal(list.body[0].seoTitle, 'Why speed sells', 'SEO title falls back to the post title');
  assert.equal(list.body[0].seoDescription, 'Fast sites convert.');
  const single = await publicList('blog', { slug: 'why-speed-sells' });
  assert.match(single.body.content, /^## Heading/);
  assert.equal(single.body.featuredImage.url, image.url);
  assert.equal((await publicList('blog', { slug: 'nope' })).status, 404);

  // The editor can load it back, exactly as stored.
  const loaded = await api(resource, { query: { resource: 'blog', id } });
  assert.equal(loaded.body.values.title, 'Why speed sells');
  assert.equal(loaded.body.values.seoTitle, 'Why speed sells');

  const edited = await api(resource, {
    method: 'PUT',
    body: { resource: 'blog', id, publish: true, values: { ...loaded.body.values, title: 'Speed sells more', seoTitle: 'Custom SEO title' } }
  });
  assert.equal(edited.status, 200, JSON.stringify(edited.body));
  const afterEdit = await publicList('blog', { slug: 'why-speed-sells' });
  assert.equal(afterEdit.body.title, 'Speed sells more');
  assert.equal(afterEdit.body.seoTitle, 'Custom SEO title');

  const rows = await api(resource, { query: { resource: 'blog' } });
  assert.deepEqual(rows.body.map((row) => [row.title, row.status]), [['Speed sells more', 'published']]);
  assert.equal(rows.body[0].thumbnail, image.url);

  const draft = await api(resource, { method: 'PUT', body: { resource: 'blog', id, publish: false, values: loaded.body.values } });
  assert.equal(draft.body.status, 'draft');
  assert.deepEqual((await publicList('blog')).body, [], 'drafts are not public');
  assert.equal((await api(resource, { query: { resource: 'blog' } })).body[0].status, 'draft', 'but the admin still lists them');

  assert.equal((await api(resource, { method: 'DELETE', query: { resource: 'blog', id } })).status, 200);
  assert.deepEqual((await api(resource, { query: { resource: 'blog' } })).body, []);
  assert.equal((await api(resource, { method: 'DELETE', query: { resource: 'blog', id } })).status, 404);
});

test('blog: validation, duplicate slugs and unknown fields', async () => {
  const image = await uploadImage();
  const invalid = await api(resource, { method: 'POST', body: { resource: 'blog', publish: true, values: blogValues(image, { title: '', slug: 'Bad Slug' }) } });
  assert.equal(invalid.status, 422);
  assert.ok(invalid.body.details.title && invalid.body.details.slug);

  const noImage = await api(resource, { method: 'POST', body: { resource: 'blog', publish: true, values: blogValues(null) } });
  assert.equal(noImage.status, 422);
  assert.ok(noImage.body.details.featuredImage);

  const first = await api(resource, { method: 'POST', body: { resource: 'blog', publish: false, values: { ...blogValues(image), evil: '<script>' } } });
  assert.equal(first.status, 200);
  assert.equal((await api(resource, { query: { resource: 'blog', id: first.body.id } })).body.values.evil, undefined, 'unknown fields are dropped');

  const dup = await api(resource, { method: 'POST', body: { resource: 'blog', publish: false, values: blogValues(image) } });
  assert.equal(dup.status, 409);
  assert.ok(dup.body.details.slug);
  await api(resource, { method: 'DELETE', query: { resource: 'blog', id: first.body.id } });
});

test('image urls must point at our storage or the web', async () => {
  const response = await api(resource, {
    method: 'POST',
    body: { resource: 'blog', publish: false, values: blogValues({ url: 'javascript:alert(1)' }, { slug: 'bad-image' }) }
  });
  assert.equal(response.status, 422, 'a non-http image counts as missing');
});

test('logos and case studies: order, metrics and url checks', async () => {
  const image = await uploadImage();
  const logo = (name, sortOrder, extra = {}) => ({ name, websiteUrl: 'https://acme.co', logo: image, displayStyle: 'standard', sortOrder, ...extra });
  for (const [name, order] of [['Second', 2], ['First', 1]]) {
    const saved = await api(resource, { method: 'POST', body: { resource: 'logo', publish: true, values: logo(name, order) } });
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
  }
  const hidden = await api(resource, { method: 'POST', body: { resource: 'logo', publish: false, values: logo('Draft', 0) } });
  assert.equal(hidden.status, 200);

  const logos = await publicList('logo');
  assert.deepEqual(logos.body.map((l) => l.name), ['First', 'Second']);
  assert.equal(logos.body[0].logo.url, image.url);

  const badUrl = await api(resource, { method: 'POST', body: { resource: 'logo', publish: true, values: logo('Bad', 3, { websiteUrl: 'acme.co' }) } });
  assert.equal(badUrl.status, 422);
  const noScript = await api(resource, { method: 'POST', body: { resource: 'logo', publish: true, values: logo('Bad', 3, { websiteUrl: 'javascript:alert(1)' }) } });
  assert.equal(noScript.status, 422);

  const study = await api(resource, {
    method: 'POST',
    body: {
      resource: 'caseStudy',
      publish: true,
      values: {
        title: 'Kronos', discipline: 'Web + Ads', year: '2026', headline: 'Sold out', summary: 'Summary', image,
        resultPrimary: '3.9x ROAS', resultSecondary: '', challenge: '', solution: '', scope: '', projectUrl: '', sortOrder: 1,
        metrics: [{ label: 'ROAS', value: '3.9x' }, { label: '', value: 'ignored' }]
      }
    }
  });
  assert.equal(study.status, 200, JSON.stringify(study.body));
  assert.deepEqual((await publicList('caseStudy')).body[0].metrics, [{ label: 'ROAS', value: '3.9x' }]);

  assert.equal((await api(resource, { query: { resource: 'nope' } })).status, 404);
  assert.equal((await publicList('nope')).status, 404);
  assert.equal((await call(content, { query: {} })).status, 400);
});

test('batch add saves all of the logos or none of them', async () => {
  const image = await uploadImage();
  const item = (name) => ({ publish: true, values: { name, websiteUrl: '', logo: image, displayStyle: 'standard', sortOrder: 70 } });

  const invalid = await api(resource, { method: 'POST', body: { resource: 'logo', items: [item('Batch ok'), { publish: true, values: { name: '' } }] } });
  assert.equal(invalid.status, 422);
  assert.ok(!(await publicList('logo')).body.some((l) => l.name === 'Batch ok'), 'one bad item means nothing is saved');

  const saved = await api(resource, { method: 'POST', body: { resource: 'logo', items: [item('Batch A'), item('Batch B')] } });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.body.count, 2);
  const names = (await publicList('logo')).body.map((l) => l.name);
  assert.ok(names.includes('Batch A') && names.includes('Batch B'));

  assert.equal((await api(resource, { method: 'POST', body: { resource: 'logo', items: [] } })).status, 400);
});

test('two saves at once both survive', async () => {
  const image = await uploadImage();
  const values = (n) => ({ name: `Parallel ${n}`, websiteUrl: '', logo: image, displayStyle: 'standard', sortOrder: 50 + n });
  const results = await Promise.all([1, 2, 3, 4, 5].map((n) => api(resource, { method: 'POST', body: { resource: 'logo', publish: true, values: values(n) } })));
  assert.ok(results.every((r) => r.status === 200));
  const names = (await publicList('logo')).body.map((l) => l.name);
  for (let n = 1; n <= 5; n += 1) assert.ok(names.includes(`Parallel ${n}`), `Parallel ${n} was lost`);
});

test('sitemap lists published posts with their country prefix, never drafts', async () => {
  const image = await uploadImage();
  const live = await api(resource, { method: 'POST', body: { resource: 'blog', publish: true, values: blogValues(image, { slug: 'map-me', country: 'AE' }) } });
  await api(resource, { method: 'POST', body: { resource: 'blog', publish: false, values: blogValues(image, { slug: 'secret-draft', title: 'Draft' }) } });
  assert.equal(live.status, 200);

  const response = await call(sitemap, { method: 'GET' });
  assert.equal(response.status, 200);
  assert.match(response.body, /\/ae\/blog\/map-me<\/loc>/);
  assert.match(response.body, /<loc>https:\/\/[^<]*\/blog<\/loc>/);
  assert.doesNotMatch(response.body, /secret-draft/);
});
