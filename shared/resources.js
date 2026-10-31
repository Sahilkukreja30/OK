/**
 * Single source of truth for everything the admin can manage.
 * Consumed by the admin forms (what to render) and the API (what to validate and store).
 *
 * Field `type`s: text | textarea | select | date | number | boolean | image | markdown | metrics
 * Field `group`: optional form section the field is shown in (see the resource's `groups`); default is the main form.
 * `sort`: how entries are ordered on the site and in the admin list.
 */

export const COUNTRY_OPTIONS = [
  { value: 'ALL', label: 'Global (shows everywhere)' },
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'UAE' }
];

export const LOGO_STYLE_OPTIONS = [
  { value: 'standard', label: 'Standard – colour logo, grey until hover' },
  { value: 'invert-white', label: 'Dark logo on white background – invert to white' },
  { value: 'white-on-dark', label: 'White logo – keep white' },
  { value: 'white-pure', label: 'Pure white logo – extra bright' },
  { value: 'color-badge', label: 'Coloured badge – grey until hover' }
];

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_METRICS = 3;

/** Uploaded images live in our storage (a web address, or /api/media when running on local files). */
export const isImageUrl = (url) => /^(https?:\/\/|\/api\/media\?)/.test(url ?? '');
export const MAX_SHORT_TEXT = 256; // longest allowed single-line text

const sortOrderField = {
  key: 'sortOrder',
  type: 'number',
  label: 'Display order',
  hint: 'Lowest number shows first.',
  defaultValue: 100,
  required: true
};

const definitions = {
  blog: {
    label: 'Blogs',
    singular: 'blog post',
    titleKey: 'title',
    subtitleKey: 'publishedDate',
    groups: { seo: { title: 'SEO – how this appears on Google & social media' } },
    sort: { key: 'publishedDate', direction: 'desc' },
    uniqueKey: 'slug',
    fields: [
      { key: 'title', type: 'text', label: 'Title (H1)', required: true, maxLength: 100 },
      {
        key: 'slug',
        type: 'text',
        label: 'URL slug',
        required: true,
        pattern: SLUG_PATTERN,
        slugFrom: 'title',
        hint: 'Lowercase words joined by dashes – this becomes the page URL, e.g. /blog/your-slug.'
      },
      { key: 'country', type: 'select', label: 'Audience', options: COUNTRY_OPTIONS, defaultValue: 'ALL', required: true },
      { key: 'publishedDate', type: 'date', label: 'Publish date', required: true },
      {
        key: 'shortDescription',
        type: 'textarea',
        label: 'Short description',
        maxLength: 200,
        hint: 'Shown under the title and on the blog list card.'
      },
      { key: 'featuredImage', type: 'image', label: 'Banner image', required: true, maxWidth: 1920 },
      {
        key: 'content',
        type: 'markdown',
        label: 'Article body',
        required: true,
        hint: 'Use ## for sub-headings (H2) and ### for H3. Add pictures with the IMAGE button.'
      },
      {
        key: 'seoTitle',
        group: 'seo',
        type: 'text',
        label: 'SEO title',
        maxLength: 60,
        fallbackKey: 'title',
        hint: 'Shown in Google results and the browser tab. Leave empty to use the title.'
      },
      {
        key: 'seoDescription',
        group: 'seo',
        type: 'textarea',
        label: 'SEO meta description',
        maxLength: 160,
        fallbackKey: 'shortDescription',
        hint: 'Google snippet text. Leave empty to use the short description.'
      },
      {
        key: 'canonicalUrl',
        group: 'seo',
        type: 'text',
        label: 'Canonical URL (optional)',
        hint: 'Only set if the same article is published elsewhere first.'
      },
      { key: 'noindex', group: 'seo', type: 'boolean', label: 'Hide from search engines (noindex)', defaultValue: false },
      { key: 'nofollow', group: 'seo', type: 'boolean', label: 'Do not follow links (nofollow)', defaultValue: false }
    ]
  },

  logo: {
    label: 'Client logos',
    singular: 'client logo',
    titleKey: 'name',
    subtitleKey: 'websiteUrl',
    sort: { key: 'sortOrder', direction: 'asc' },
    fields: [
      { key: 'name', type: 'text', label: 'Client name', required: true, maxLength: 60 },
      { key: 'websiteUrl', type: 'text', label: 'Website (optional)', hint: 'Full address, e.g. https://client.com – makes the logo clickable.' },
      { key: 'logo', type: 'image', label: 'Logo', required: true, maxWidth: 800 },
      { key: 'displayStyle', type: 'select', label: 'Display style', options: LOGO_STYLE_OPTIONS, defaultValue: 'standard', required: true },
      sortOrderField
    ]
  },

  caseStudy: {
    label: 'Case studies',
    singular: 'case study',
    titleKey: 'title',
    subtitleKey: 'discipline',
    sort: { key: 'sortOrder', direction: 'asc' },
    fields: [
      { key: 'title', type: 'text', label: 'Project / client name', required: true, maxLength: 80 },
      { key: 'discipline', type: 'text', label: 'Services delivered', required: true, maxLength: 80, hint: 'e.g. Website Development & Meta Ads' },
      { key: 'year', type: 'text', label: 'Year', maxLength: 4 },
      { key: 'headline', type: 'text', label: 'Headline', required: true, maxLength: 120 },
      { key: 'summary', type: 'textarea', label: 'Summary', required: true, maxLength: 320 },
      { key: 'image', type: 'image', label: 'Cover image', required: true, maxWidth: 1600 },
      { key: 'resultPrimary', type: 'text', label: 'Main result', required: true, maxLength: 60, hint: 'e.g. +240% mobile conversions' },
      { key: 'resultSecondary', type: 'text', label: 'Second result', maxLength: 60 },
      { key: 'challenge', type: 'textarea', label: 'The challenge' },
      { key: 'solution', type: 'textarea', label: 'Our solution' },
      { key: 'scope', type: 'textarea', label: 'Scope of work' },
      { key: 'metrics', type: 'metrics', label: 'Key metrics', hint: `Up to ${MAX_METRICS} figures shown in the case study popup.` },
      { key: 'projectUrl', type: 'text', label: 'Live project link (optional)' },
      sortOrderField
    ]
  }
};

/** Each resource also knows its own key, so callers can pass a single object around. */
export const RESOURCES = Object.fromEntries(Object.entries(definitions).map(([key, resource]) => [key, { ...resource, key }]));

export const RESOURCE_KEYS = Object.keys(RESOURCES);

export const getResource = (key) => RESOURCES[key] ?? null;

/** Fields in the given form section ('main' or a key of resource.groups such as 'seo'). */
export const fieldsOf = (resource, group = 'main') => resource.fields.filter((field) => (field.group ?? 'main') === group);

/** Orders entries { values, createdAt } the way the resource's `sort` says. */
export function sortEntries(resource, entries) {
  const { key, direction } = resource.sort;
  const factor = direction === 'desc' ? -1 : 1;
  const valueOf = (entry) => entry.values[key] ?? '';
  return [...entries].sort((a, b) => {
    const [x, y] = [valueOf(a), valueOf(b)];
    if (x === y) return a.createdAt < b.createdAt ? -1 : 1;
    return (x > y ? 1 : -1) * factor;
  });
}

const EMPTY_BY_TYPE = {
  metrics: () => [],
  boolean: () => false,
  date: () => new Date().toLocaleDateString('en-CA') // today, in the admin's own time zone (YYYY-MM-DD)
};

export function emptyValues(resource) {
  return Object.fromEntries(
    resource.fields.map((field) => [field.key, field.defaultValue ?? EMPTY_BY_TYPE[field.type]?.() ?? ''])
  );
}

const isBlank = (value) => value == null || value === '' || (Array.isArray(value) && value.length === 0);

/** Returns { [fieldKey]: message } – empty object when the values are valid. */
export function validateValues(resource, values) {
  const errors = {};
  for (const field of resource.fields) {
    const value = values[field.key];
    const effective = isBlank(value) && field.fallbackKey ? values[field.fallbackKey] : value;

    const isMissing = field.type === 'image' ? !isImageUrl(effective?.url) : isBlank(effective);

    if (field.required && isMissing && !(field.type === 'number' && value === 0)) {
      errors[field.key] = `${field.label} is required.`;
    } else if (field.pattern && !isBlank(value) && !field.pattern.test(value)) {
      errors[field.key] = `${field.label} may only contain lowercase letters, numbers and dashes.`;
    } else if (field.type === 'select' && !isBlank(value) && !field.options.some((o) => o.value === value)) {
      errors[field.key] = `${field.label} has an unknown option.`;
    } else if (field.type === 'text' && String(value ?? '').length > MAX_SHORT_TEXT) {
      errors[field.key] = `${field.label} must be at most ${MAX_SHORT_TEXT} characters.`;
    } else if (field.type === 'text' && /url/i.test(field.key) && !isBlank(value) && !/^https?:\/\//i.test(value)) {
      errors[field.key] = `${field.label} must start with http:// or https://`;
    }
  }
  return errors;
}
