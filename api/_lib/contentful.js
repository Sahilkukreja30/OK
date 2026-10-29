import { config } from './config.js';
import { HttpError } from './errors.js';

const CONTENT_TYPE = 'application/vnd.contentful.management.v1+json';
const ASSET_POLL_ATTEMPTS = 10;
const ASSET_POLL_DELAY_MS = 700;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url, { method = 'GET', body, headers = {} }) {
  const { managementToken } = config();
  if (!managementToken) throw new HttpError(500, 'Contentful is not configured: set CONTENTFUL_MANAGEMENT_TOKEN.');

  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${managementToken}`, ...headers },
    body
  });
  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = payload.message || payload.sys?.id || response.statusText;
    throw new HttpError(response.status === 404 ? 404 : 502, `Contentful: ${reason}`, payload.details);
  }
  return payload;
}

/** Call the Management API inside the configured space + environment. */
function cma(path, { json, headers = {}, ...options } = {}) {
  const { managementBase, spaceId, environment } = config();
  return request(`${managementBase}/spaces/${spaceId}/environments/${environment}${path}`, {
    ...options,
    headers: { 'Content-Type': CONTENT_TYPE, ...headers },
    body: json === undefined ? undefined : JSON.stringify(json)
  });
}

const versionHeader = (entity) => ({ 'X-Contentful-Version': String(entity.sys.version) });

/* ---------- entries ---------- */

export async function listEntries(contentType, { order, limit = 200, query = {} } = {}) {
  const params = new URLSearchParams({ content_type: contentType, limit, ...query });
  if (order) params.set('order', order);
  return (await cma(`/entries?${params}`)).items;
}

export const getEntry = (id) => cma(`/entries/${encodeURIComponent(id)}`);

export function createEntry(contentType, fields) {
  return cma('/entries', { method: 'POST', headers: { 'X-Contentful-Content-Type': contentType }, json: { fields } });
}

export function updateEntry(entry, fields) {
  return cma(`/entries/${entry.sys.id}`, { method: 'PUT', headers: versionHeader(entry), json: { fields } });
}

export const publishEntry = (entry) =>
  cma(`/entries/${entry.sys.id}/published`, { method: 'PUT', headers: versionHeader(entry) });

export const unpublishEntry = (entry) =>
  cma(`/entries/${entry.sys.id}/published`, { method: 'DELETE', headers: versionHeader(entry) });

export const deleteEntry = (entry) =>
  cma(`/entries/${entry.sys.id}`, { method: 'DELETE', headers: versionHeader(entry) });

/* ---------- assets ---------- */

export async function getAssets(ids) {
  if (!ids.length) return [];
  return (await cma(`/assets?${new URLSearchParams({ 'sys.id[in]': ids.join(','), limit: 200 })}`)).items;
}

/** Uploads the binary, creates the asset, waits for processing, publishes it. */
export async function createPublishedAsset({ buffer, contentType, fileName, title, description }) {
  const { uploadBase, spaceId, locale } = config();

  const upload = await request(`${uploadBase}/spaces/${spaceId}/uploads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: buffer
  });

  const localized = (value) => ({ [locale]: value });
  let asset = await cma('/assets', {
    method: 'POST',
    json: {
      fields: {
        title: localized(title),
        ...(description && { description: localized(description) }),
        file: localized({
          contentType,
          fileName,
          uploadFrom: { sys: { type: 'Link', linkType: 'Upload', id: upload.sys.id } }
        })
      }
    }
  });

  await cma(`/assets/${asset.sys.id}/files/${locale}/process`, { method: 'PUT', headers: versionHeader(asset) });

  for (let attempt = 0; attempt < ASSET_POLL_ATTEMPTS; attempt += 1) {
    asset = await cma(`/assets/${asset.sys.id}`);
    if (asset.fields.file?.[locale]?.url) {
      return cma(`/assets/${asset.sys.id}/published`, { method: 'PUT', headers: versionHeader(asset) });
    }
    await sleep(ASSET_POLL_DELAY_MS);
  }
  throw new HttpError(504, 'Contentful took too long to process the image. Please try again.');
}

/** Contentful returns protocol-relative file urls ("//images.ctfassets.net/..."). */
export const assetUrl = (asset) => {
  const url = asset?.fields?.file?.[config().locale]?.url ?? '';
  return url.startsWith('//') ? `https:${url}` : url;
};
