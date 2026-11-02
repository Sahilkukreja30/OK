import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MEDIA_ROUTE = '/api/media?key=';

/** Absolute path of `key` inside `root`, or null when the key tries to escape it. */
export function resolveInside(root, key) {
  const target = path.resolve(root, key);
  return target.startsWith(path.resolve(root) + path.sep) ? target : null;
}

/**
 * Stores everything as plain files in a local folder. Used for `npm run dev` and the tests,
 * so the admin works without any account or token. Never used on Vercel (its disk is read-only).
 */
export function createLocalStorage(root) {
  const queues = new Map(); // one write at a time per key, like the Blob driver's etag check

  const read = async (key) => {
    try {
      return JSON.parse(await readFile(resolveInside(root, `json/${key}`), 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  };

  const write = async (key, data) => {
    const file = resolveInside(root, `json/${key}`);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(`${file}.tmp`, JSON.stringify(data, null, 2));
    await rename(`${file}.tmp`, file);
  };

  return {
    name: 'local files',
    root,
    readJson: read,

    updateJson(key, mutate) {
      const run = (queues.get(key) ?? Promise.resolve()).then(async () => {
        const { next, result } = mutate(await read(key));
        await write(key, next);
        return result;
      });
      queues.set(key, run.catch(() => {}));
      return run;
    },

    async putFile(key, buffer) {
      const file = resolveInside(root, `files/${key}`);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, buffer);
      return { url: `${MEDIA_ROUTE}${encodeURIComponent(key)}` };
    },

    async readFile(key) {
      const file = resolveInside(root, `files/${key}`);
      if (!file) return null;
      return readFile(file).catch(() => null);
    }
  };
}
