import { embeddedAssetIds, isEditableAsMarkdown, markdownToRichText, richTextToMarkdown } from '../../shared/richText.js';
import { MAX_METRICS, contentfulFieldId, fieldsOf, getResource, validateValues } from '../../shared/resources.js';
import { config } from './config.js';
import {
  assetUrl,
  createEntry,
  deleteEntry,
  getAssets,
  getEntry,
  listEntries,
  publishEntry,
  unpublishEntry,
  updateEntry
} from './contentful.js';
import { HttpError } from './errors.js';

const assetLink = (id) => ({ sys: { type: 'Link', linkType: 'Asset', id } });
const entryLink = (id) => ({ sys: { type: 'Link', linkType: 'Entry', id } });

const isBlank = (value) => value == null || value === '' || (Array.isArray(value) && !value.length);
const trimmed = (value) => (typeof value === 'string' ? value.trim() : value);

/* Form value -> Contentful value, per field type. Open for extension: add a type, add a codec. */
const ENCODERS = {
  text: trimmed,
  textarea: trimmed,
  select: trimmed,
  date: trimmed,
  number: Number,
  boolean: Boolean,
  image: (value) => assetLink(value.id),
  markdown: (value) => markdownToRichText(value),
  metrics: (value) =>
    value
      .map(({ label, value: figure }) => ({ label: trimmed(label), value: trimmed(figure) }))
      .filter((metric) => metric.label && metric.value)
      .slice(0, MAX_METRICS)
};

/* Contentful value -> form value. `assets` maps asset id -> asset for image urls. */
const DECODERS = {
  image: (value, assets) => (value ? { id: value.sys.id, url: assetUrl(assets.get(value.sys.id)) } : null),
  markdown: (value) => richTextToMarkdown(value),
  metrics: (value) => (Array.isArray(value) ? value : []),
  boolean: (value) => Boolean(value),
  number: (value) => (value ?? '')
};

const decodeField = (field, value, assets) => (DECODERS[field.type] ?? ((v) => v ?? ''))(value, assets);

function localize(fields) {
  const { locale } = config();
  return Object.fromEntries(Object.entries(fields).map(([id, value]) => [id, { [locale]: value }]));
}

const flatten = (fields = {}) => {
  const { locale } = config();
  return Object.fromEntries(Object.entries(fields).map(([id, byLocale]) => [id, byLocale?.[locale]]));
};

/** Merges form values over the entry's existing fields so fields the admin doesn't manage survive. */
function buildFields(fieldSpecs, values, existingFields, extras) {
  const merged = flatten(existingFields);

  for (const field of fieldSpecs) {
    const id = contentfulFieldId(field);
    const raw = isBlank(values[field.key]) && field.fallbackKey ? values[field.fallbackKey] : values[field.key];

    if (isBlank(raw) && field.type !== 'boolean') delete merged[id];
    else merged[id] = ENCODERS[field.type](raw);
  }
  return localize({ ...merged, ...extras });
}

const statusOf = ({ sys }) => {
  if (!sys.publishedVersion) return 'draft';
  return sys.version > sys.publishedVersion + 1 ? 'changed' : 'published';
};

const linkedId = (entry, linkField) => flatten(entry?.fields)[linkField]?.sys?.id;

async function assetsFor(resource, entries) {
  const imageKeys = resource.fields.filter((f) => f.type === 'image').map(contentfulFieldId);
  const ids = entries.flatMap((entry) => imageKeys.map((key) => flatten(entry.fields)[key]?.sys?.id)).filter(Boolean);
  return new Map((await getAssets([...new Set(ids)])).map((asset) => [asset.sys.id, asset]));
}

function decodeEntry(fieldSpecs, entry, assets) {
  const raw = flatten(entry.fields);
  return Object.fromEntries(
    fieldSpecs.map((field) => [field.key, decodeField(field, raw[contentfulFieldId(field)], assets)])
  );
}

function requireResource(key) {
  const resource = getResource(key);
  if (!resource) throw new HttpError(404, `Unknown resource "${key}".`);
  return resource;
}

/* ---------- reads ---------- */

export async function listResource(key) {
  const resource = requireResource(key);
  const entries = await listEntries(resource.contentType.id, { order: resource.orderBy });
  const assets = await assetsFor(resource, entries);
  const mainFields = fieldsOf(resource);
  const thumbnailField = mainFields.find((f) => f.type === 'image');

  return entries.map((entry) => {
    const values = decodeEntry(mainFields, entry, assets);
    return {
      id: entry.sys.id,
      status: statusOf(entry),
      title: values[resource.titleKey],
      subtitle: values[resource.subtitleKey],
      thumbnail: thumbnailField ? values[thumbnailField.key]?.url : '',
      updatedAt: entry.sys.updatedAt
    };
  });
}

export async function getResourceEntry(key, id) {
  const resource = requireResource(key);
  const entry = await getEntry(id);
  const linkedEntries = await Promise.all(
    Object.entries(resource.linked ?? {}).map(async ([name, link]) => {
      const linkedEntryId = linkedId(entry, link.linkField);
      return [name, linkedEntryId ? await getEntry(linkedEntryId) : null];
    })
  );

  const allEntries = [entry, ...linkedEntries.map(([, linked]) => linked).filter(Boolean)];
  const assets = await assetsFor(resource, allEntries);
  const values = { ...decodeEntry(fieldsOf(resource), entry, assets) };
  for (const [name, linked] of linkedEntries) {
    if (linked) Object.assign(values, decodeEntry(fieldsOf(resource, name), linked, assets));
  }

  const richTextField = resource.fields.find((f) => f.type === 'markdown');
  const richText = richTextField && flatten(entry.fields)[contentfulFieldId(richTextField)];
  const embedded = await getAssets(embeddedAssetIds(richText));
  return {
    id: entry.sys.id,
    status: statusOf(entry),
    values,
    editable: !richText || isEditableAsMarkdown(richText),
    assetUrls: Object.fromEntries(embedded.map((asset) => [asset.sys.id, assetUrl(asset)]))
  };
}

/* ---------- writes ---------- */

async function assertUnique(resource, values, ownId) {
  if (!resource.uniqueKey) return;
  const field = resource.fields.find((f) => f.key === resource.uniqueKey);
  const matches = await listEntries(resource.contentType.id, {
    limit: 2,
    query: { [`fields.${contentfulFieldId(field)}`]: values[field.key] }
  });
  if (matches.some((entry) => entry.sys.id !== ownId)) {
    throw new HttpError(409, `Another ${resource.singular} already uses this ${field.label.toLowerCase()}.`, {
      [field.key]: 'Already in use.'
    });
  }
}

const saveDraft = (contentTypeId, existing, fields) =>
  existing ? updateEntry(existing, fields) : createEntry(contentTypeId, fields);

/** Publish links before the entry that references them; unpublish in the opposite order. */
async function applyPublication(linkedEntries, mainEntry, publish) {
  if (publish) {
    for (const entry of linkedEntries) await publishEntry(entry);
    return publishEntry(mainEntry);
  }
  const unpublishIfLive = async (entry) => (entry.sys.publishedVersion ? unpublishEntry(entry) : entry);
  const main = await unpublishIfLive(mainEntry);
  for (const entry of linkedEntries) await unpublishIfLive(entry);
  return main;
}

export async function saveResource(key, { id, values, publish }) {
  const resource = requireResource(key);
  const errors = validateValues(resource, values);
  if (Object.keys(errors).length) throw new HttpError(422, 'Please fix the highlighted fields.', errors);
  await assertUnique(resource, values, id);

  const existing = id ? await getEntry(id) : null;

  const linkedEntries = [];
  const links = {};
  for (const [name, link] of Object.entries(resource.linked ?? {})) {
    const existingLinkedId = linkedId(existing, link.linkField);
    const current = existingLinkedId ? await getEntry(existingLinkedId) : null;
    const fields = buildFields(fieldsOf(resource, name), values, current?.fields, {
      internalName: link.contentType.internalName(values)
    });
    const saved = await saveDraft(link.contentType.id, current, fields);
    linkedEntries.push(saved);
    links[link.linkField] = entryLink(saved.sys.id);
  }

  const mainFields = buildFields(fieldsOf(resource), values, existing?.fields, {
    internalName: resource.contentType.internalName(values),
    ...links
  });
  const draft = await saveDraft(resource.contentType.id, existing, mainFields);
  const final = await applyPublication(linkedEntries, draft, publish);
  return { id: final.sys.id, status: statusOf(final) };
}

export async function removeResource(key, id) {
  const resource = requireResource(key);
  const entry = await getEntry(id);
  const linkedEntries = await Promise.all(
    Object.values(resource.linked ?? {}).map(async (link) => {
      const linkedEntryId = linkedId(entry, link.linkField);
      return linkedEntryId ? getEntry(linkedEntryId) : null;
    })
  );

  const removeOne = async (target) => {
    const current = target.sys.publishedVersion ? await unpublishEntry(target) : target;
    await deleteEntry(current);
  };
  await removeOne(entry);
  await Promise.all(linkedEntries.filter(Boolean).map(removeOne));
}
