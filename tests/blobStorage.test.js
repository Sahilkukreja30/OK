import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBlobStorage } from '../api/_lib/storage/blob.js';

/** In-memory Blob service: refuses to overwrite, like the real one with allowOverwrite: false. */
function fakeBlob() {
  const files = new Map();
  const urlOf = (pathname) => `https://store.test/${pathname}`;
  const calls = { del: 0 };
  return {
    files,
    calls,
    sdk: {
      list: async ({ prefix }) => ({
        hasMore: false,
        blobs: [...files.keys()].filter((p) => p.startsWith(prefix)).map((pathname) => ({ pathname, url: urlOf(pathname) }))
      }),
      put: async (pathname, body, options) => {
        // yield first so overlapping saves really do race for the same version
        await new Promise((resolve) => setImmediate(resolve));
        if (files.has(pathname) && !options.allowOverwrite) throw new Error('Vercel Blob: This blob already exists');
        files.set(pathname, body);
        return { url: urlOf(pathname) };
      },
      del: async (urls) => {
        calls.del += 1;
        urls.forEach((url) => files.delete(url.replace('https://store.test/', '')));
      }
    },
    fetchFile: async (url) => {
      const body = files.get(url.replace('https://store.test/', ''));
      return { ok: body !== undefined, status: body === undefined ? 404 : 200, json: async () => JSON.parse(body) };
    }
  };
}

const noWait = () => Promise.resolve();

const append = (value) => (current) => ({ next: [...(current ?? []), value], result: value });

test('reads nothing from an empty store, then the newest version after each save', async () => {
  const blob = fakeBlob();
  const store = createBlobStorage(blob.sdk, blob.fetchFile, noWait);
  assert.equal(await store.readJson('content/logo.json'), null);

  for (let n = 1; n <= 16; n += 1) await store.updateJson('content/logo.json', append(n));
  assert.deepEqual(await store.readJson('content/logo.json'), Array.from({ length: 16 }, (_, i) => i + 1));
});

test('never overwrites a file, and keeps only the last few versions', async () => {
  const blob = fakeBlob();
  const store = createBlobStorage(blob.sdk, blob.fetchFile, noWait);
  for (let n = 1; n <= 9; n += 1) await store.updateJson('content/logo.json', append(n));

  const names = [...blob.files.keys()].sort();
  assert.equal(names.length, 5);
  assert.equal(names.at(-1), 'content/logo/000000000009.json');
});

test('overlapping saves all survive', async () => {
  const blob = fakeBlob();
  const store = createBlobStorage(blob.sdk, blob.fetchFile, noWait);
  await Promise.all([1, 2, 3, 4].map((n) => store.updateJson('content/logo.json', append(n))));
  assert.deepEqual([...(await store.readJson('content/logo.json'))].sort(), [1, 2, 3, 4]);
});

test('gives a clear error when it keeps losing the race', async () => {
  const blob = fakeBlob();
  blob.sdk.put = async () => {
    throw new Error('This blob already exists');
  };
  const store = createBlobStorage(blob.sdk, blob.fetchFile, noWait);
  await assert.rejects(store.updateJson('content/logo.json', append(1)), (error) => error.status === 409);
});

test('storage failures reach the admin with their reason', async () => {
  const blob = fakeBlob();
  blob.sdk.put = async () => {
    throw new Error('Vercel Blob: store suspended');
  };
  const store = createBlobStorage(blob.sdk, blob.fetchFile, noWait);
  await assert.rejects(store.updateJson('content/logo.json', append(1)), (error) => error.status === 502 && /store suspended/.test(error.message));
});

test('a failed clean-up does not fail the save', async () => {
  const blob = fakeBlob();
  blob.sdk.del = async () => {
    throw new Error('nope');
  };
  const store = createBlobStorage(blob.sdk, blob.fetchFile, noWait);
  for (let n = 1; n <= 7; n += 1) await store.updateJson('content/logo.json', append(n));
  assert.equal((await store.readJson('content/logo.json')).length, 7);
});

test('waits for a just-written version instead of failing or reading an older one', async () => {
  const blob = fakeBlob();
  const store = createBlobStorage(blob.sdk, blob.fetchFile, noWait);
  await store.updateJson('content/logo.json', append(1));
  await store.updateJson('content/logo.json', append(2));

  let misses = 3;
  const slowFetch = (url) => {
    if (misses > 0) {
      misses -= 1;
      return Promise.resolve({ ok: false, status: 404 });
    }
    return blob.fetchFile(url);
  };
  const slow = createBlobStorage(blob.sdk, slowFetch, noWait);
  assert.deepEqual(await slow.readJson('content/logo.json'), [1, 2]);
  assert.equal(misses, 0);

  misses = 3;
  await slow.updateJson('content/logo.json', append(3));
  assert.deepEqual(await store.readJson('content/logo.json'), [1, 2, 3], 'a save never builds on an older version');
});

test('gives up with the reason if a version never becomes readable', async () => {
  const blob = fakeBlob();
  const store = createBlobStorage(blob.sdk, blob.fetchFile, noWait);
  await store.updateJson('content/logo.json', append(1));
  let fetches = 0;
  const never = createBlobStorage(blob.sdk, () => {
    fetches += 1;
    return Promise.resolve({ ok: false, status: 404 });
  }, noWait);
  await assert.rejects(never.readJson('content/logo.json'), (error) => error.status === 502 && /could not read/.test(error.message));
  assert.equal(fetches, 9);

  const forbidden = createBlobStorage(blob.sdk, () => Promise.resolve({ ok: false, status: 403 }), noWait);
  await assert.rejects(forbidden.readJson('content/logo.json'), (error) => error.status === 502, 'other errors fail straight away');
});

test('ignores the old single-file document left in the store', async () => {
  const blob = fakeBlob();
  blob.files.set('content/logo.json', JSON.stringify(['old']));
  const store = createBlobStorage(blob.sdk, blob.fetchFile, noWait);
  assert.equal(await store.readJson('content/logo.json'), null);
});
