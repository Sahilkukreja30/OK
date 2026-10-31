/** Server-side settings, read lazily so tests and the dev server can set process.env first. */
export function config() {
  const env = process.env;
  return {
    adminPassword: env.ADMIN_PASSWORD,
    sessionSecret: env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD,
    siteUrl: env.SITE_URL?.replace(/\/+$/, ''),
    blobToken: env.BLOB_READ_WRITE_TOKEN,
    isOnVercel: Boolean(env.VERCEL),
    localDataDir: env.LOCAL_DATA_DIR
  };
}
