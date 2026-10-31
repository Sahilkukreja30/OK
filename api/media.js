import { storage } from './_lib/storage/index.js';

const TYPES = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', avif: 'image/avif' };

/** Serves uploaded images when running on local files. On Vercel, Blob serves them from its own CDN. */
export default async function media(req, res) {
  const driver = storage();
  const file = driver.readFile ? await driver.readFile(String(req.query.key ?? '')) : null;
  if (!file) return res.status(404).json({ error: 'Not found.' });

  res.setHeader('Content-Type', TYPES[String(req.query.key).split('.').pop()] ?? 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(file);
}
