import assert from 'node:assert/strict';
import { test } from 'node:test';
import login from '../api/admin/login.js';
import resource from '../api/admin/resource.js';
import { createSessionToken, verifySessionToken } from '../api/_lib/auth.js';
import { call } from './helpers.js';

process.env.ADMIN_PASSWORD = 'correct horse';
delete process.env.ADMIN_SESSION_SECRET;

test('login returns a verifiable token for the right password only', async () => {
  const ok = await call(login, { method: 'POST', body: { password: 'correct horse' } });
  assert.equal(ok.status, 200);
  assert.equal(verifySessionToken(ok.body.token), true);

  const bad = await call(login, { method: 'POST', body: { password: 'nope' } });
  assert.equal(bad.status, 401);
  assert.equal(bad.body.token, undefined);
});

test('tokens expire and cannot be tampered with', () => {
  const { token } = createSessionToken(Date.now() - 9 * 60 * 60 * 1000);
  assert.equal(verifySessionToken(token), false);

  const fresh = createSessionToken().token;
  const [body, signature] = fresh.split('.');
  const forgedBody = Buffer.from(JSON.stringify({ exp: Date.now() + 1e12 })).toString('base64url');
  assert.equal(verifySessionToken(`${forgedBody}.${signature}`), false);
  assert.equal(verifySessionToken(`${body}.`), false);
  assert.equal(verifySessionToken(undefined), false);
});

test('admin endpoints reject requests without a valid token', async () => {
  const response = await call(resource, { query: { resource: 'blog' } });
  assert.equal(response.status, 401);
});

test('login is refused when no admin password is configured', async () => {
  const saved = process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_PASSWORD;
  const response = await call(login, { method: 'POST', body: { password: '' } });
  process.env.ADMIN_PASSWORD = saved;
  assert.equal(response.status, 500);
});
