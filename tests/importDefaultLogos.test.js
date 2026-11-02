import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_CLIENT_LOGOS, missingDefaultLogos } from '../src/data/defaultClientLogos.js';
import { LOGO_STYLE_OPTIONS } from '../shared/resources.js';

test('lists every built-in logo until it is in the CMS, ignoring case and spacing', () => {
  assert.equal(missingDefaultLogos([]).length, DEFAULT_CLIENT_LOGOS.length);
  const missing = missingDefaultLogos(['  two blends coffee ', 'NEEDLE FORM']);
  assert.equal(missing.length, DEFAULT_CLIENT_LOGOS.length - 2);
  assert.ok(missing.every((logo) => !['TWO BLENDS COFFEE', 'NEEDLE FORM'].includes(logo.name)));
});

test('every built-in logo maps onto a valid admin display style and has a unique name', () => {
  const styles = LOGO_STYLE_OPTIONS.map((option) => option.value);
  assert.ok(DEFAULT_CLIENT_LOGOS.every((logo) => styles.includes(logo.type)));
  assert.equal(new Set(DEFAULT_CLIENT_LOGOS.map((logo) => logo.name.toLowerCase())).size, DEFAULT_CLIENT_LOGOS.length);
});
