import { randomBytes } from 'node:crypto';

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };

/** The real image type from the file's first bytes (never the type the browser claims), or null. */
export function detectImageType(buffer) {
  const startsWith = (bytes, offset = 0) => bytes.every((byte, i) => buffer[offset + i] === byte);
  const ascii = (from, to) => buffer.subarray(from, to).toString('latin1');

  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith([0x89, 0x50, 0x4e, 0x47])) return 'image/png';
  if (ascii(0, 4) === 'GIF8') return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) return 'image/avif';
  return null;
}

/** A tidy, unique storage key such as images/summer-launch-3fa91c0b.webp */
export function imageKey(fileName, contentType) {
  const base = String(fileName ?? 'image')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `images/${base || 'image'}-${randomBytes(4).toString('hex')}.${EXTENSIONS[contentType]}`;
}
