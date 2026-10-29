import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import resource from '../api/admin/resource.js';
import upload from '../api/admin/upload.js';
import sitemap from '../api/sitemap.js';
import { createSessionToken } from '../api/_lib/auth.js';
import { startMockContentful } from './mockContentful.js';
import { call } from './helpers.js';

let mock;
let token;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');

before(async () => {
  mock = await startMockContentful();
  Object.assign(process.env, {
    ADMIN_PASSWORD: 'pw',
    CONTENTFUL_SPACE_ID: 'space',
    CONTENTFUL_MANAGEMENT_TOKEN: 'cma-token',
    CONTENTFUL_DELIVERY_TOKEN: 'cda-token',
    CONTENTFUL_MANAGEMENT_BASE: mock.url,
    CONTENTFUL_UPLOAD_BASE: mock.url,
    CONTENTFUL_DELIVERY_BASE: mock.url
  });
  token = createSessionToken().token;
});

after(() => mock.close());

const api = (handler, options) => call(handler, { token, ...options });

async function uploadImage(title = 'Banner') {
  const { status, body } = await api(upload, {
    method: 'POST',
    body: { fileName: 'banner.png', contentType: 'image/png', data: PNG.toString('base64'), title }
  });
  assert.equal(status, 200, JSON.stringify(body));
  return body;
}

const blogValues = (image, overrides = {}) => ({
  title: 'Why speed sells',
  slug: 'why-speed-sells',
  country: 'IN',
  publishedDate: '2026-10-01',
  shortDescription: 'Fast sites convert.',
  featuredImage: image,
  content: '## Heading\n\nSome **bold** body text.\n\n![shot](asset:SHOT)',
  seoTitle: '',
  seoDescription: '',
  canonicalUrl: '',
  noindex: false,
  nofollow: false,
  ...overrides
});

test('uploads an image as a published asset', async () => {
  const image = await uploadImage();
  assert.match(image.url, /\/files\//);
  assert.ok(mock.assets.get(image.id).sys.publishedVersion, 'asset is published');

  const rejected = await api(upload, { method: 'POST', body: { fileName: 'x.svg', contentType: 'image/svg+xml', data: 'PHN2Zz4=' } });
  assert.equal(rejected.status, 415);
});

test('blog: create (published) -> read -> edit -> unpublish -> delete', async () => {
  const image = await uploadImage();
  const bodyImage = await uploadImage('Inline');
  const values = blogValues(image, { content: `## Heading\n\nSome **bold** body text.\n\n![shot](asset:${bodyImage.id})` });

  const created = await api(resource, { method: 'POST', body: { resource: 'blog', values, publish: true } });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  assert.equal(created.body.status, 'published');

  // Stored the way the public site expects it.
  const post = mock.entries.get(created.body.id);
  assert.equal(post.fields.slug['en-US'], 'why-speed-sells');
  assert.equal(post.fields.internalName['en-US'], 'Why speed sells');
  assert.equal(post.fields.content['en-US'].content[0].nodeType, 'heading-2');
  assert.equal(post.fields.featuredImage['en-US'].sys.id, image.id);
  const seo = mock.entries.get(post.fields.seoFields['en-US'].sys.id);
  assert.equal(seo.fields.pageTitle['en-US'], 'Why speed sells', 'SEO title falls back to the post title');
  assert.equal(seo.fields.pageDescription['en-US'], 'Fast sites convert.');
  assert.equal(seo.fields.noindex['en-US'], false);
  assert.ok(seo.sys.publishedVersion, 'linked SEO entry is published with the post');

  // Visible on the public delivery API with links resolved.
  const cda = await fetch(`${mock.url}/spaces/space/environments/master/entries?content_type=pageBlogPost&include=2&access_token=x`);
  const delivered = await cda.json();
  assert.equal(delivered.items.length, 1);
  assert.equal(delivered.includes.Asset.length, 2);
  assert.equal(delivered.includes.Entry[0].fields.pageTitle, 'Why speed sells');

  // The editor can load it back.
  const loaded = await api(resource, { query: { resource: 'blog', id: created.body.id } });
  assert.equal(loaded.body.values.title, 'Why speed sells');
  assert.equal(loaded.body.values.featuredImage.id, image.id);
  assert.equal(loaded.body.values.seoTitle, 'Why speed sells');
  assert.match(loaded.body.values.content, /^## Heading/);
  assert.equal(loaded.body.editable, true);

  // Edit keeps unmanaged fields and clears emptied ones.
  mock.entries.get(created.body.id).fields.relatedBlogPosts = { 'en-US': [] };
  const edited = await api(resource, {
    method: 'PUT',
    body: { resource: 'blog', id: created.body.id, publish: true, values: { ...loaded.body.values, title: 'Speed sells more', seoTitle: 'Custom SEO title', shortDescription: '' } }
  });
  assert.equal(edited.status, 200, JSON.stringify(edited.body));
  const after = mock.entries.get(created.body.id);
  assert.equal(after.fields.title['en-US'], 'Speed sells more');
  assert.deepEqual(after.fields.relatedBlogPosts['en-US'], []);
  assert.equal(after.fields.shortDescription, undefined);
  assert.equal(mock.entries.get(after.fields.seoFields['en-US'].sys.id).fields.pageTitle['en-US'], 'Custom SEO title');

  // List shows it, draft toggle takes it off the public API.
  const list = await api(resource, { query: { resource: 'blog' } });
  assert.deepEqual(list.body.map((row) => [row.title, row.status]), [['Speed sells more', 'published']]);
  assert.match(list.body[0].thumbnail, /\/files\//);

  const draft = await api(resource, { method: 'PUT', body: { resource: 'blog', id: created.body.id, publish: false, values: loaded.body.values } });
  assert.equal(draft.body.status, 'draft');
  const afterDraft = await (await fetch(`${mock.url}/spaces/space/environments/master/entries?content_type=pageBlogPost&access_token=x`)).json();
  assert.equal(afterDraft.items.length, 0);

  const removed = await api(resource, { method: 'DELETE', query: { resource: 'blog', id: created.body.id } });
  assert.equal(removed.status, 200);
  assert.equal(mock.entries.size, 0, 'post and its SEO entry are both deleted');
});

test('blog: validation and duplicate slugs are rejected', async () => {
  const image = await uploadImage();
  const invalid = await api(resource, { method: 'POST', body: { resource: 'blog', publish: true, values: blogValues(image, { title: '', slug: 'Bad Slug' }) } });
  assert.equal(invalid.status, 422);
  assert.ok(invalid.body.details.title && invalid.body.details.slug);

  const first = await api(resource, { method: 'POST', body: { resource: 'blog', publish: false, values: blogValues(image) } });
  assert.equal(first.status, 200);
  const dup = await api(resource, { method: 'POST', body: { resource: 'blog', publish: false, values: blogValues(image) } });
  assert.equal(dup.status, 409);
  assert.ok(dup.body.details.slug);
  await api(resource, { method: 'DELETE', query: { resource: 'blog', id: first.body.id } });
});

test('logos and case studies are stored with display order and metrics', async () => {
  const image = await uploadImage('Logo');
  const logo = await api(resource, {
    method: 'POST',
    body: { resource: 'logo', publish: true, values: { name: 'Acme', websiteUrl: 'https://acme.co', logo: image, displayStyle: 'standard', sortOrder: 5 } }
  });
  assert.equal(logo.status, 200, JSON.stringify(logo.body));
  assert.equal(mock.entries.get(logo.body.id).fields.sortOrder['en-US'], 5);

  const badUrl = await api(resource, {
    method: 'POST',
    body: { resource: 'logo', publish: true, values: { name: 'Acme', websiteUrl: 'acme.co', logo: image, displayStyle: 'standard', sortOrder: 5 } }
  });
  assert.equal(badUrl.status, 422);

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
  const stored = mock.entries.get(study.body.id).fields;
  assert.deepEqual(stored.metrics['en-US'], [{ label: 'ROAS', value: '3.9x' }]);
  assert.equal(stored.resultSecondary, undefined);

  const list = await api(resource, { query: { resource: 'caseStudy' } });
  assert.equal(list.body[0].title, 'Kronos');
  assert.equal((await api(resource, { query: { resource: 'nope' } })).status, 404);
});

test('sitemap lists published posts with their country prefix', async () => {
  const image = await uploadImage();
  const created = await api(resource, { method: 'POST', body: { resource: 'blog', publish: true, values: blogValues(image, { slug: 'map-me', country: 'AE' }) } });
  assert.equal(created.status, 200);

  const response = await call(sitemap, { method: 'GET' });
  assert.equal(response.status, 200);
  assert.match(response.body, /\/ae\/blog\/map-me<\/loc>/);
  assert.match(response.body, /<loc>https:\/\/[^<]*\/blog<\/loc>/);
});

test('loading a post returns the urls of images embedded in its body', async () => {
  const image = await uploadImage();
  const inline = await uploadImage('Inline');
  const created = await api(resource, {
    method: 'POST',
    body: { resource: 'blog', publish: false, values: blogValues(image, { slug: 'with-inline', content: `Hello\n\n![x](asset:${inline.id})` }) }
  });
  const loaded = await api(resource, { query: { resource: 'blog', id: created.body.id } });
  assert.equal(loaded.body.assetUrls[inline.id], inline.url);
});
