/**
 * In-memory stand-in for the Contentful Management (CMA) + Delivery (CDA) APIs.
 * Lets tests and local dev exercise the admin end to end without touching a real space.
 *   node tests/mockContentful.js [port]
 */
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const LOCALE = 'en-US';
const ROUTE = /^\/spaces\/([^/]+)(?:\/environments\/([^/]+))?\/(entries|assets|uploads)(?:\/([^/]+))?(?:\/(published|files\/[^/]+\/process))?$/;

const now = () => new Date().toISOString();
const newSys = (type, extra = {}) => ({
  type,
  id: randomUUID().replace(/-/g, '').slice(0, 20),
  version: 1,
  createdAt: now(),
  updatedAt: now(),
  ...extra
});

const valueOf = (item, path) => {
  const [root, field] = path.split('.');
  return root === 'sys' ? item.sys[field] : item.fields?.[field]?.[LOCALE];
};

function sortItems(items, order) {
  const keys = (order ?? '').split(',').filter(Boolean);
  return [...items].sort((a, b) => {
    for (const key of keys) {
      const path = key.replace(/^-/, '');
      const [x, y] = [valueOf(a, path), valueOf(b, path)];
      if (x === y) continue;
      return (x > y ? 1 : -1) * (key.startsWith('-') ? -1 : 1);
    }
    return 0;
  });
}

function matchesFilters(item, params) {
  for (const [key, value] of params) {
    if (key === 'content_type' && item.sys.contentType.sys.id !== value) return false;
    if (key.startsWith('fields.') && String(valueOf(item, key)) !== value) return false;
    if (key === 'sys.id[in]' && !value.split(',').includes(item.sys.id)) return false;
  }
  return true;
}

const publishedSnapshot = (item) => item.published && { ...item, ...item.published };

export function startMockContentful(port = 0) {
  const entries = new Map();
  const assets = new Map();
  const files = new Map();
  let baseUrl = '';

  const findLinks = (value, found = []) => {
    if (value && typeof value === 'object') {
      if (value.sys?.type === 'Link') found.push(value.sys);
      else Object.values(value).forEach((child) => findLinks(child, found));
    }
    return found;
  };

  function deliveryResponse(items, params) {
    const published = items.map(publishedSnapshot).filter(Boolean);
    const includes = { Asset: new Map(), Entry: new Map() };
    const visit = (item, depth) => {
      if (depth > 2) return;
      for (const link of findLinks(item.fields)) {
        const target = (link.linkType === 'Asset' ? assets : entries).get(link.id);
        const snapshot = target && publishedSnapshot(target);
        if (snapshot && !includes[link.linkType].has(link.id)) {
          includes[link.linkType].set(link.id, snapshot);
          visit(snapshot, depth + 1);
        }
      }
    };
    published.forEach((item) => visit(item, 0));

    const flat = (item) => ({
      sys: { ...item.sys, ...(item.sys.type === 'Entry' && { contentType: item.sys.contentType }) },
      fields: Object.fromEntries(Object.entries(item.fields).map(([k, v]) => [k, v[LOCALE]]))
    });
    return {
      total: published.length,
      items: sortItems(published, params.get('order')).map(flat),
      includes: { Asset: [...includes.Asset.values()].map(flat), Entry: [...includes.Entry.values()].map(flat) }
    };
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://mock');
    const send = (status, body, headers = { 'Content-Type': 'application/json' }) => {
      res.writeHead(status, { 'Access-Control-Allow-Origin': '*', ...headers });
      res.end(body === undefined ? undefined : typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
    };

    if (req.method === 'OPTIONS') return send(204);

    const fileMatch = /^\/files\/([^/]+)$/.exec(url.pathname);
    if (fileMatch) {
      const file = files.get(fileMatch[1]);
      return file ? send(200, file.buffer, { 'Content-Type': file.contentType }) : send(404, {});
    }

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);

    const match = ROUTE.exec(url.pathname);
    if (!match) return send(404, { message: 'Not found' });
    const [, , , kind, id, action] = match;
    const isDelivery = url.searchParams.has('access_token');
    const store = kind === 'assets' ? assets : entries;
    const version = Number(req.headers['x-contentful-version']);
    const json = () => (raw.length ? JSON.parse(raw.toString()) : {});

    if (kind === 'uploads') {
      const sys = newSys('Upload');
      files.set(sys.id, { buffer: raw, contentType: 'application/octet-stream' });
      return send(201, { sys });
    }

    if (!id) {
      if (req.method === 'GET') {
        const items = [...store.values()].filter((item) => matchesFilters(item, url.searchParams));
        if (isDelivery) return send(200, deliveryResponse(items, url.searchParams));
        const limit = Number(url.searchParams.get('limit') ?? 100);
        return send(200, { total: items.length, items: sortItems(items, url.searchParams.get('order')).slice(0, limit) });
      }
      if (req.method === 'POST') {
        const { fields } = json();
        const sys = newSys(kind === 'assets' ? 'Asset' : 'Entry');
        if (kind === 'entries') sys.contentType = { sys: { type: 'Link', linkType: 'ContentType', id: req.headers['x-contentful-content-type'] } };
        const item = { sys, fields };
        store.set(sys.id, item);
        return send(201, item);
      }
    }

    const item = store.get(id);
    if (!item) return send(404, { sys: { id: 'NotFound' }, message: 'The resource could not be found.' });
    const bump = (updates = {}) => Object.assign(item.sys, { version: item.sys.version + 1, updatedAt: now() }, updates);
    const stale = () => send(409, { sys: { id: 'VersionMismatch' }, message: 'Version mismatch' });

    if (action?.endsWith('/process')) {
      if (version !== item.sys.version) return stale();
      const upload = files.get(Object.values(item.fields.file)[0].uploadFrom.sys.id);
      const { contentType, fileName } = item.fields.file[LOCALE];
      files.set(item.sys.id, { buffer: upload.buffer, contentType });
      item.fields.file[LOCALE] = { contentType, fileName, url: `${baseUrl}/files/${item.sys.id}` };
      bump();
      return send(204);
    }

    if (action === 'published') {
      if (version !== item.sys.version) return stale();
      if (req.method === 'PUT') {
        item.published = { sys: { ...item.sys, publishedVersion: item.sys.version }, fields: structuredClone(item.fields) };
        bump({ publishedVersion: item.sys.version });
      } else {
        delete item.published;
        bump();
        delete item.sys.publishedVersion;
      }
      return send(200, item);
    }

    if (req.method === 'GET') return send(200, item);
    if (req.method === 'PUT') {
      if (version !== item.sys.version) return stale();
      item.fields = json().fields;
      bump();
      return send(200, item);
    }
    if (req.method === 'DELETE') {
      if (item.sys.publishedVersion) return send(409, { message: 'Entry is published' });
      store.delete(id);
      return send(204);
    }
    return send(405, {});
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve({ url: baseUrl, entries, assets, close: () => new Promise((done) => (server.close(done), server.closeAllConnections())) });
    });
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { url } = await startMockContentful(Number(process.argv[2] ?? 4010));
  console.log(`Mock Contentful listening on ${url}`);
}
