import { loadEnv } from 'vite';

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  return raw && req.headers['content-type']?.includes('json') ? JSON.parse(raw) : raw || undefined;
};

/**
 * Serves the Vercel-style handlers in /api during `vite dev`, so the admin works
 * locally without the Vercel CLI. Production uses Vercel's own runtime.
 */
export default function devApiPlugin() {
  return {
    name: 'dev-api',
    configureServer(server) {
      // Make server-only variables (no VITE_ prefix) from .env files visible to the handlers.
      const env = loadEnv(server.config.mode, server.config.root, '');
      for (const [key, value] of Object.entries(env)) process.env[key] ??= value;

      server.middlewares.use('/api', async (req, res, next) => {
        const url = new URL(req.originalUrl, 'http://localhost');
        try {
          const { default: handler } = await server.ssrLoadModule(`${url.pathname}.js`);
          req.query = Object.fromEntries(url.searchParams);
          req.body = await readBody(req);
          res.status = (code) => ((res.statusCode = code), res);
          res.json = (payload) => (res.setHeader('Content-Type', 'application/json'), res.end(JSON.stringify(payload)));
          res.send = (payload) => res.end(payload);
          await handler(req, res);
        } catch (error) {
          if (error.code === 'ERR_LOAD_URL' || /Failed to load url/.test(error.message)) return next();
          console.error(error);
          res.statusCode = 500;
          res.end('API error');
        }
      });
    }
  };
}
