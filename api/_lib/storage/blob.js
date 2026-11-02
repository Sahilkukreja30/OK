import { del, list, put } from '@vercel/blob';
import { HttpError } from '../errors.js';

/*
 * Nothing is ever overwritten here. Public blobs are served through a CDN that keeps an overwritten file past its
 * max-age and ignores query strings, so a file updated in place can read back stale for a long time (saves then
 * fail or lose data). Instead every save is a new file (content/logo/000000000007.json):
 * - the newest one is found through the list API, which is not cached;
 * - a version's file never changes, so reading it through the CDN is always correct;
 * - allowOverwrite: false means two overlapping saves cannot both claim a version: one retries on the newer data.
 */

const VERSION_DIGITS = 12;
const VERSION_FILE = new RegExp(`/\\d{${VERSION_DIGITS}}\\.json$`);
const WRITE_ATTEMPTS = 6;
const VERSIONS_TO_KEEP = 5; // the latest few stay around as a safety net

const isAlreadyExists = (error) => /already exists/i.test(error?.message ?? '');

/** Runs a storage call, turning SDK failures into a message the admin can act on. */
async function guarded(run) {
  try {
    return await run();
  } catch (error) {
    if (error instanceof HttpError || isAlreadyExists(error)) throw error;
    throw new HttpError(502, `Storage error: ${error.message}`);
  }
}

export function createBlobStorage(sdk = { del, list, put }, fetchFile = fetch) {
  const folderOf = (key) => `${key.replace(/\.json$/, '')}/`;

  async function listVersions(key) {
    const versions = [];
    let cursor;
    do {
      const page = await sdk.list({ prefix: folderOf(key), cursor });
      versions.push(...page.blobs.filter((blob) => VERSION_FILE.test(blob.pathname)));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return versions.sort((a, b) => (a.pathname < b.pathname ? -1 : 1));
  }

  async function readLatest(key) {
    const versions = await listVersions(key);
    const latest = versions.at(-1);
    if (!latest) return { data: null, number: 0, versions };

    const response = await fetchFile(latest.url);
    if (!response.ok) throw new Error(`could not read ${latest.pathname} (${response.status})`);
    return { data: await response.json(), number: Number(latest.pathname.match(/(\d+)\.json$/)[1]), versions };
  }

  return {
    name: 'Vercel Blob',

    readJson: (key) => guarded(async () => (await readLatest(key)).data),

    updateJson: (key, mutate) =>
      guarded(async () => {
        for (let attempt = 1; attempt <= WRITE_ATTEMPTS; attempt += 1) {
          const { data, number, versions } = await readLatest(key);
          const { next, result } = mutate(data);
          const pathname = `${folderOf(key)}${String(number + 1).padStart(VERSION_DIGITS, '0')}.json`;

          try {
            await sdk.put(pathname, JSON.stringify(next), {
              access: 'public',
              contentType: 'application/json',
              addRandomSuffix: false,
              allowOverwrite: false
            });
          } catch (error) {
            if (isAlreadyExists(error)) continue; // someone else saved first: redo the change on their version
            throw error;
          }

          const outdated = versions.slice(0, -(VERSIONS_TO_KEEP - 1)).map((version) => version.url);
          if (outdated.length) await sdk.del(outdated).catch(() => {}); // only tidying up: never fail a save over it
          return result;
        }
        throw new HttpError(409, 'Another save was in progress. Please try again.');
      }),

    putFile: (key, buffer, contentType) =>
      guarded(async () => {
        const { url } = await sdk.put(key, buffer, { access: 'public', contentType, addRandomSuffix: false });
        return { url };
      })
  };
}
