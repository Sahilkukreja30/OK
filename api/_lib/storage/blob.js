import { BlobPreconditionFailedError, get, put } from '@vercel/blob';

const JSON_CACHE_SECONDS = 60; // the public site may see a change up to a minute late
const WRITE_ATTEMPTS = 3;

/** Reads a JSON blob. `fresh` skips the CDN so the admin always sees its own latest save. */
async function read(key, { fresh }) {
  const result = await get(key, { access: 'public', useCache: !fresh });
  if (!result || result.statusCode !== 200) return null;
  return { data: JSON.parse(await new Response(result.stream).text()), etag: result.blob.etag };
}

/** Vercel Blob: one JSON document per content type, images as separate public files. */
export function createBlobStorage() {
  return {
    name: 'Vercel Blob',

    async readJson(key, { fresh = false } = {}) {
      return (await read(key, { fresh }))?.data ?? null;
    },

    /** Read-modify-write; the etag check makes two overlapping saves retry instead of overwriting each other. */
    async updateJson(key, mutate) {
      for (let attempt = 1; ; attempt += 1) {
        const current = await read(key, { fresh: true });
        const { next, result } = mutate(current?.data ?? null);
        try {
          await put(key, JSON.stringify(next), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false,
            allowOverwrite: true,
            cacheControlMaxAge: JSON_CACHE_SECONDS,
            ...(current && { ifMatch: current.etag })
          });
          return result;
        } catch (error) {
          const isConflict = error instanceof BlobPreconditionFailedError;
          if (!isConflict || attempt >= WRITE_ATTEMPTS) throw error;
        }
      }
    },

    async putFile(key, buffer, contentType) {
      const { url } = await put(key, buffer, { access: 'public', contentType, addRandomSuffix: false });
      return { url };
    }
  };
}
