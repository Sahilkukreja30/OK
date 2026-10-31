import { DEFAULT_CLIENT_LOGOS, missingDefaultLogos } from '../data/defaultClientLogos';
import { saveEntry } from './adminApi';
import { uploadImageFile } from './imageUpload';

const LOGO_MAX_WIDTH = 800;
async function fetchAsFile(src, name) {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Could not load the current logo for ${name}.`);
  const blob = await response.blob();
  return new File([blob], src.split('/').pop(), { type: blob.type });
}

/**
 * Copies the built-in logos into the CMS, keeping their order, link and display style, so they can be
 * edited like any other logo. Safe to re-run: logos already imported are skipped.
 * `onProgress(done, total)` is called after each logo.
 */
export async function importDefaultLogos(existingNames, onProgress) {
  const pending = missingDefaultLogos(existingNames);
  const order = (logo) => DEFAULT_CLIENT_LOGOS.indexOf(logo) + 1;

  for (const [index, logo] of pending.entries()) {
    const file = await fetchAsFile(logo.src, logo.name);
    const image = await uploadImageFile(file, { maxWidth: LOGO_MAX_WIDTH, title: logo.name });
    await saveEntry('logo', {
      publish: true,
      values: { name: logo.name, websiteUrl: logo.url ?? '', logo: image, displayStyle: logo.type, sortOrder: order(logo) }
    });
    onProgress?.(index + 1, pending.length);
  }
  return pending.length;
}
