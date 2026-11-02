import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { HttpError } from './errors.js';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const digest = (value) => createHash('sha256').update(String(value)).digest();
const sign = (body, secret) => createHmac('sha256', secret).update(body).digest('base64url');

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function passwordMatches(candidate) {
  const { adminPassword } = config();
  if (!adminPassword) throw new HttpError(500, 'Admin is not configured: set ADMIN_PASSWORD.');
  return timingSafeEqual(digest(candidate ?? ''), digest(adminPassword));
}

export function createSessionToken(now = Date.now()) {
  const { sessionSecret } = config();
  const body = Buffer.from(JSON.stringify({ exp: now + SESSION_TTL_MS })).toString('base64url');
  return { token: `${body}.${sign(body, sessionSecret)}`, expiresAt: now + SESSION_TTL_MS };
}

export function verifySessionToken(token, now = Date.now()) {
  const { sessionSecret } = config();
  const [body, signature] = String(token ?? '').split('.');
  if (!body || !signature || !sessionSecret || !safeEqual(signature, sign(body, sessionSecret))) return false;

  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString()).exp > now;
  } catch {
    return false;
  }
}

export function requireAdmin(req) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  if (!verifySessionToken(token)) throw new HttpError(401, 'Please sign in again.');
}
