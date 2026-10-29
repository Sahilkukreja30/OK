/** Server-side settings, read lazily so tests and the dev server can set process.env first. */
export function config() {
  const env = process.env;
  return {
    spaceId: env.CONTENTFUL_SPACE_ID || env.VITE_CONTENTFUL_SPACE_ID,
    environment: env.CONTENTFUL_ENVIRONMENT || env.VITE_CONTENTFUL_ENVIRONMENT || 'master',
    locale: env.CONTENTFUL_LOCALE || 'en-US',
    managementToken: env.CONTENTFUL_MANAGEMENT_TOKEN,
    deliveryToken: env.CONTENTFUL_DELIVERY_TOKEN || env.VITE_CONTENTFUL_ACCESS_TOKEN,
    managementBase: env.CONTENTFUL_MANAGEMENT_BASE || 'https://api.contentful.com',
    uploadBase: env.CONTENTFUL_UPLOAD_BASE || 'https://upload.contentful.com',
    deliveryBase: env.CONTENTFUL_DELIVERY_BASE || 'https://cdn.contentful.com',
    adminPassword: env.ADMIN_PASSWORD,
    sessionSecret: env.ADMIN_SESSION_SECRET || env.ADMIN_PASSWORD,
    siteUrl: env.SITE_URL?.replace(/\/+$/, '')
  };
}
