/**
 * One-time setup: creates the `clientLogo` and `caseStudy` content types in Contentful
 * (the blog types already exist). Safe to re-run – types that already exist are skipped.
 *
 *   node scripts/setup-contentful.js           # dry run: prints what would be created
 *   node scripts/setup-contentful.js --apply   # actually creates + publishes them
 *
 * Reads CONTENTFUL_SPACE_ID, CONTENTFUL_ENVIRONMENT and CONTENTFUL_MANAGEMENT_TOKEN from the environment.
 */
import { RESOURCES, contentfulFieldId, fieldsOf } from '../shared/resources.js';

const FIELD_TYPES = {
  text: { type: 'Symbol' },
  textarea: { type: 'Text' },
  select: { type: 'Symbol' },
  date: { type: 'Date' },
  number: { type: 'Integer' },
  boolean: { type: 'Boolean' },
  image: { type: 'Link', linkType: 'Asset' },
  markdown: { type: 'RichText' },
  metrics: { type: 'Object' }
};

const toContentfulField = (field) => ({
  id: contentfulFieldId(field),
  name: field.label,
  required: Boolean(field.required),
  localized: false,
  ...FIELD_TYPES[field.type],
  ...(field.type === 'select' && { validations: [{ in: field.options.map((option) => option.value) }] })
});

export function buildContentType(resource) {
  const { id, name } = resource.contentType;
  return {
    id,
    body: {
      name,
      displayField: 'internalName',
      fields: [
        { id: 'internalName', name: 'Internal name', type: 'Symbol', required: true, localized: false },
        ...fieldsOf(resource).map(toContentfulField)
      ]
    }
  };
}

async function run() {
  const { CONTENTFUL_SPACE_ID: space, CONTENTFUL_ENVIRONMENT: environment = 'master', CONTENTFUL_MANAGEMENT_TOKEN: token } = process.env;
  const apply = process.argv.includes('--apply');
  const base = process.env.CONTENTFUL_MANAGEMENT_BASE || 'https://api.contentful.com';
  const owned = Object.values(RESOURCES).filter((resource) => resource.contentType.name);

  if (!apply) {
    console.log('Dry run – nothing will be changed. Re-run with --apply to create:\n');
    owned.forEach((resource) => console.log(JSON.stringify(buildContentType(resource), null, 2)));
    return;
  }
  if (!space || !token) throw new Error('Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN first.');

  const call = async (path, { method = 'GET', body, version } = {}) => {
    const response = await fetch(`${base}/spaces/${space}/environments/${environment}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/vnd.contentful.management.v1+json',
        ...(version && { 'X-Contentful-Version': String(version) })
      },
      body: body && JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    return { status: response.status, ok: response.ok, payload };
  };

  for (const resource of owned) {
    const { id, body } = buildContentType(resource);
    if ((await call(`/content_types/${id}`)).ok) {
      console.log(`✓ ${id} already exists – skipped`);
      continue;
    }

    const created = await call(`/content_types/${id}`, { method: 'PUT', body });
    if (!created.ok) throw new Error(`Could not create ${id}: ${created.payload.message}`);
    const published = await call(`/content_types/${id}/published`, { method: 'PUT', version: created.payload.sys.version });
    if (!published.ok) throw new Error(`Could not publish ${id}: ${published.payload.message}`);
    console.log(`+ ${id} created and published`);
  }
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  run().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
