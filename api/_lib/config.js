/** Server-side settings, read lazily so tests and the dev server can set process.env first. */
export function config() {
  const env = process.env;
  return {
    adminPassword: env.ADMIN_PASSWORD,
    sessionSecret: env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD,
    siteUrl: env.SITE_URL?.replace(/\/+$/, ''),
    // Vercel adds BLOB_STORE_ID (+ a short-lived token) when a Blob store is connected, and BLOB_READ_WRITE_TOKEN as a fallback.
    hasBlobStore: Boolean(env.BLOB_READ_WRITE_TOKEN || env.BLOB_STORE_ID),
    isOnVercel: Boolean(env.VERCEL),
    localDataDir: env.LOCAL_DATA_DIR
  };
}
