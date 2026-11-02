import { randomUUID } from 'node:crypto';
import { readingTimeLabel } from '../../shared/richText.js';
import { MAX_METRICS, getResource, isImageUrl, sortEntries, validateValues } from '../../shared/resources.js';
import { HttpError } from './errors.js';
import { storage } from './storage/index.js';

/*
 * Each content type is one JSON document: an array of { id, status, createdAt, updatedAt, values }.
 * status is 'published' (shown on the site) or 'draft'. Fine for the few dozen entries a small site has.
 */

const MAX_BATCH = 100;

const documentKey = (resource) => `content/${resource.key}.json`;
const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);

/** Form value -> stored value, per field type. Add a type here and in shared/resources.js to support it. */
const NORMALIZERS = {
  text: trimmed,
  textarea: trimmed,
  select: trimmed,
  date: trimmed,
  markdown: trimmed,
  number: Number,
  boolean: Boolean,
  image: (value) => (isImageUrl(value?.url) ? { url: value.url } : null),
  metrics: (value) =>
    (Array.isArray(value) ? value : [])
      .map(({ label, value: figure }) => ({ label: trimmed(label), value: trimmed(figure) }))
      .filter((metric) => metric.label && metric.value)
      .slice(0, MAX_METRICS)
};

/** Keeps only the fields the resource defines (anything else in the request is ignored). */
function normalizeValues(resource, values) {
  return Object.fromEntries(resource.fields.map((field) => [field.key, NORMALIZERS[field.type](values[field.key])]));
}

/** SEO fields fall back to the page's own title / description when left empty. */
function applyFallbacks(resource, values) {
  const filled = { ...values };
  for (const field of resource.fields) {
    if (field.fallbackKey && !filled[field.key]) filled[field.key] = filled[field.fallbackKey];
  }
  return filled;
}

function requireResource(key) {
  const resource = getResource(key);
  if (!resource) throw new HttpError(404, `Unknown resource "${key}".`);
  return resource;
}

const readEntries = async (resource) => (await storage().readJson(documentKey(resource))) ?? [];

/** Runs `change(entries)` -> { entries, result } against the stored document. */
const updateEntries = (resource, change) =>
  storage().updateJson(documentKey(resource), (current) => {
    const { entries, result } = change(current ?? []);
    return { next: entries, result };
  });

const findEntry = (entries, id) => {
  const entry = entries.find((candidate) => candidate.id === id);
  if (!entry) throw new HttpError(404, 'That entry no longer exists.');
  return entry;
};

/* ---------- admin ---------- */

export async function listResource(key) {
  const resource = requireResource(key);
  const thumbnailField = resource.fields.find((field) => field.type === 'image');

  return sortEntries(resource, await readEntries(resource)).map((entry) => ({
    id: entry.id,
    status: entry.status,
    title: entry.values[resource.titleKey],
    subtitle: entry.values[resource.subtitleKey],
    thumbnail: thumbnailField ? entry.values[thumbnailField.key]?.url : '',
    updatedAt: entry.updatedAt
  }));
}

export async function getResourceEntry(key, id) {
  const resource = requireResource(key);
  const { status, values } = findEntry(await readEntries(resource), id);
  return { id, status, values };
}

/** Validates form values and returns what gets stored. */
function prepare(resource, { values, publish }) {
  const errors = validateValues(resource, values);
  if (Object.keys(errors).length) throw new HttpError(422, 'Please fix the highlighted fields.', errors);
  return { stored: applyFallbacks(resource, normalizeValues(resource, values)), status: publish ? 'published' : 'draft' };
}

function assertUnique(resource, entries, stored, ownId) {
  const uniqueField = resource.fields.find((field) => field.key === resource.uniqueKey);
  if (uniqueField && entries.some((entry) => entry.id !== ownId && entry.values[uniqueField.key] === stored[uniqueField.key])) {
    throw new HttpError(409, `Another ${resource.singular} already uses this ${uniqueField.label.toLowerCase()}.`, {
      [uniqueField.key]: 'Already in use.'
    });
  }
}

export async function saveResource(key, { id, values, publish }) {
  const resource = requireResource(key);
  const { stored, status } = prepare(resource, { values, publish });
  const now = new Date().toISOString();

  return updateEntries(resource, (entries) => {
    assertUnique(resource, entries, stored, id);

    if (id) {
      const existing = findEntry(entries, id);
      Object.assign(existing, { status, values: stored, updatedAt: now });
      return { entries, result: { id, status } };
    }

    const entry = { id: randomUUID(), status, createdAt: now, updatedAt: now, values: stored };
    return { entries: [...entries, entry], result: { id: entry.id, status } };
  });
}

/** Adds several entries in one write: either all of them are saved or none are. */
export async function addResources(key, items) {
  const resource = requireResource(key);
  if (!Array.isArray(items) || !items.length || items.length > MAX_BATCH) {
    throw new HttpError(400, `Send between 1 and ${MAX_BATCH} items.`);
  }
  const prepared = items.map((item) => prepare(resource, item));
  const now = new Date().toISOString();

  return updateEntries(resource, (entries) => {
    const added = prepared.map(({ stored, status }) => ({ id: randomUUID(), status, createdAt: now, updatedAt: now, values: stored }));
    return { entries: [...entries, ...added], result: { count: added.length } };
  });
}

export async function removeResource(key, id) {
  const resource = requireResource(key);
  await updateEntries(resource, (entries) => {
    findEntry(entries, id);
    return { entries: entries.filter((entry) => entry.id !== id), result: null };
  });
}

/* ---------- public (what visitors and the sitemap see) ---------- */

/**
 * Published entries as flat objects. Long text (markdown) is left out of lists to keep them small;
 * a reading time is added instead. Pass `slug` for one entry with everything.
 */
export async function listPublished(key, { slug } = {}) {
  const resource = requireResource(key);
  const markdownField = resource.fields.find((field) => field.type === 'markdown');
  const published = (await readEntries(resource)).filter((entry) => entry.status === 'published');

  const flatten = (entry, { full }) => {
    const { [markdownField?.key]: body, ...rest } = entry.values;
    return {
      id: entry.id,
      updatedAt: entry.updatedAt,
      ...(markdownField && { readingTime: readingTimeLabel(body) }),
      ...(full ? entry.values : rest)
    };
  };

  if (slug) {
    const entry = published.find((candidate) => candidate.values.slug === slug);
    return entry ? [flatten(entry, { full: true })] : [];
  }
  return sortEntries(resource, published).map((entry) => flatten(entry, { full: false }));
}


