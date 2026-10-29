/**
 * Single source of truth for everything the admin can manage.
 * Consumed by the admin forms (what to render), the API (what to validate / how to map to Contentful)
 * and scripts/setup-contentful.js (which content types to create).
 *
 * Field `type`s: text | textarea | select | date | number | boolean | image | markdown | metrics
 * Field `entry`: which Contentful entry the field lives on (default 'main'; 'seo' = linked componentSeo).
 * `contentType.name` is only set for types this project creates itself (see scripts/setup-contentful.js);
 * pageBlogPost / componentSeo already exist in the space.
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
export const MAX_SHORT_TEXT = 256; // Contentful "Symbol" fields

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
    contentType: { id: 'pageBlogPost', internalName: (v) => v.title },
    linked: {
      seo: {
        title: 'SEO – how this appears on Google & social media',
        contentType: { id: 'componentSeo', internalName: (v) => `SEO - ${v.title}` },
        linkField: 'seoFields',
        idKey: 'seoEntryId'
      }
    },
    orderBy: '-fields.publishedDate',
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
        entry: 'seo',
        field: 'pageTitle',
        type: 'text',
        label: 'SEO title',
        maxLength: 60,
        fallbackKey: 'title',
        hint: 'Shown in Google results and the browser tab. Leave empty to use the title.'
      },
      {
        key: 'seoDescription',
        entry: 'seo',
        field: 'pageDescription',
        type: 'textarea',
        label: 'SEO meta description',
        maxLength: 160,
        fallbackKey: 'shortDescription',
        hint: 'Google snippet text. Leave empty to use the short description.'
      },
      {
        key: 'canonicalUrl',
        entry: 'seo',
        field: 'canonicalUrl',
        type: 'text',
        label: 'Canonical URL (optional)',
        hint: 'Only set if the same article is published elsewhere first.'
      },
      { key: 'noindex', entry: 'seo', field: 'noindex', type: 'boolean', label: 'Hide from search engines (noindex)', defaultValue: false },
      { key: 'nofollow', entry: 'seo', field: 'nofollow', type: 'boolean', label: 'Do not follow links (nofollow)', defaultValue: false }
    ]
  },

  logo: {
    label: 'Client logos',
    singular: 'client logo',
    titleKey: 'name',
    subtitleKey: 'websiteUrl',
    contentType: {
      id: 'clientLogo',
      name: 'Client logo',
      internalName: (v) => v.name
    },
    orderBy: 'fields.sortOrder',
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
    contentType: {
      id: 'caseStudy',
      name: 'Case study',
      internalName: (v) => v.title
    },
    orderBy: 'fields.sortOrder',
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

/** Fields stored on the given entry kind ('main' or a linked key such as 'seo'). */
export const fieldsOf = (resource, entry = 'main') =>
  resource.fields.filter((field) => (field.entry ?? 'main') === entry);

/** The Contentful field id for a form field. */
export const contentfulFieldId = (field) => field.field ?? field.key;

const EMPTY_BY_TYPE = {
  metrics: () => [],
  boolean: () => false,
  date: () => new Date().toISOString().slice(0, 10)
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

    if (field.required && isBlank(effective) && !(field.type === 'number' && value === 0)) {
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
