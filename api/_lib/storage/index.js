import path from 'node:path';
import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { createBlobStorage } from './blob.js';
import { createLocalStorage } from './local.js';

let cached = { key: null, driver: null };

/**
 * Vercel Blob when BLOB_READ_WRITE_TOKEN is set (Vercel adds it when a Blob store is connected to the project),
 * plain local files otherwise (dev + tests). On Vercel without a store we fail loudly instead of
 * silently writing to a disk that is thrown away.
 */
export function storage() {
  const { blobToken, isOnVercel, localDataDir } = config();
  if (!blobToken && isOnVercel) {
    throw new HttpError(500, 'Storage is not set up: create a Blob store in Vercel and connect it to this project.');
  }

  const key = blobToken ? 'blob' : `local:${localDataDir ?? ''}`;
  if (cached.key !== key) {
    const driver = blobToken ? createBlobStorage() : createLocalStorage(localDataDir ?? path.join(process.cwd(), '.data'));
    cached = { key, driver };
  }
  return cached.driver;
}
