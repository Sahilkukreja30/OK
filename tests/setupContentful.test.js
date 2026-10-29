import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildContentType } from '../scripts/setup-contentful.js';
import { RESOURCES } from '../shared/resources.js';

test('content type definitions cover every managed field plus internalName', () => {
  const { id, body } = buildContentType(RESOURCES.caseStudy);
  const byId = Object.fromEntries(body.fields.map((field) => [field.id, field]));

  assert.equal(id, 'caseStudy');
  assert.equal(body.displayField, 'internalName');
  assert.equal(byId.internalName.required, true);
  assert.equal(byId.image.linkType, 'Asset');
  assert.equal(byId.metrics.type, 'Object');
  assert.equal(byId.sortOrder.type, 'Integer');
  assert.equal(body.fields.length, RESOURCES.caseStudy.fields.length + 1);
});

test('select fields are restricted to their options', () => {
  const { body } = buildContentType(RESOURCES.logo);
  const style = body.fields.find((field) => field.id === 'displayStyle');
  assert.deepEqual(style.validations[0].in, ['standard', 'invert-white', 'white-on-dark', 'white-pure', 'color-badge']);
});

test('only types owned by this project are created (blog types already exist)', () => {
  const owned = Object.values(RESOURCES).filter((resource) => resource.contentType.name).map((r) => r.contentType.id);
  assert.deepEqual(owned.sort(), ['caseStudy', 'clientLogo']);
});
