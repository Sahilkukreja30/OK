import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sectionLinks } from '../src/config/navigation.js';

const labels = (options) => sectionLinks(options).map((link) => link.label);

test('the Case Studies link is hidden until a case study is published', () => {
  assert.deepEqual(labels({ hasCaseStudies: false }), ['HOME', 'SERVICES', 'OUR WORK']);
  assert.deepEqual(labels({ hasCaseStudies: true }), ['HOME', 'SERVICES', 'CASE STUDIES', 'OUR WORK']);
});

test('every link points at a home page section', () => {
  assert.deepEqual(sectionLinks({ hasCaseStudies: true }).map((link) => link.id), ['home', 'services', 'case-studies', 'work']);
});
