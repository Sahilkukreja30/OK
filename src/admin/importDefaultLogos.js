import { DEFAULT_CLIENT_LOGOS, missingDefaultLogos } from '../data/defaultClientLogos';
import { saveEntries } from './adminApi';
import { uploadImageFile } from './imageUpload';

const LOGO_MAX_WIDTH = 800;
async function fetchAsFile(src, name) {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Could not load the current logo for ${name}.`);
  const blob = await response.blob();
  return new File([blob], src.split('/').pop(), { type: blob.type });
}

/**
 * Copies the built-in logos into the CMS, keeping their order, link and display style, so they can be edited
 * like any other logo. All images are uploaded first and the logos are then saved in one write, so a failure
 * part-way leaves the site's logo wall exactly as it was.
 * `onProgress(done, total)` is called after each image.
 */
export async function importDefaultLogos(existingNames, onProgress) {
  const pending = missingDefaultLogos(existingNames);
  const items = [];

  for (const logo of pending) {
    const image = await uploadImageFile(await fetchAsFile(logo.src, logo.name), { maxWidth: LOGO_MAX_WIDTH, title: logo.name });
    items.push({
      publish: true,
      values: { name: logo.name, websiteUrl: logo.url ?? '', logo: image, displayStyle: logo.type, sortOrder: DEFAULT_CLIENT_LOGOS.indexOf(logo) + 1 }
    });
    onProgress?.(items.length, pending.length);
  }

  await saveEntries('logo', items);
  return items.length;
}
