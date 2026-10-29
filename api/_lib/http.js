import { requireAdmin } from './auth.js';
import { HttpError } from './errors.js';

/**
 * Wraps `{ METHOD: (req) => data }` into a Vercel handler:
 * method routing, admin auth (unless `{ open: true }`) and uniform JSON errors.
 */
export function handle(methods, { open = false } = {}) {
  return async (req, res) => {
    try {
      const run = methods[req.method];
      if (!run) throw new HttpError(405, `${req.method} is not allowed here.`);
      if (!open) requireAdmin(req);

      const result = await run(req);
      res.status(200).json(result ?? { ok: true });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      if (!(error instanceof HttpError)) console.error(error);
      res.status(status).json({
        error: status === 500 ? 'Something went wrong on the server.' : error.message,
        details: error.details
      });
    }
  };
}
