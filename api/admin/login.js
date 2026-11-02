import { createSessionToken, passwordMatches } from '../_lib/auth.js';
import { HttpError } from '../_lib/errors.js';
import { handle } from '../_lib/http.js';

const FAILED_LOGIN_DELAY_MS = 600;

export default handle(
  {
    POST: async (req) => {
      if (!passwordMatches(req.body?.password)) {
        await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS));
        throw new HttpError(401, 'Incorrect password.');
      }
      return createSessionToken();
    }
  },
  { open: true }
);
