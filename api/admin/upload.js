import { HttpError } from '../_lib/errors.js';
import { handle } from '../_lib/http.js';
import { detectImageType, imageKey } from '../_lib/images.js';
import { storage } from '../_lib/storage/index.js';

const MAX_BYTES = 4 * 1024 * 1024;

export default handle({
  POST: async ({ body }) => {
    const buffer = Buffer.from(body?.data ?? '', 'base64');
    if (!buffer.length) throw new HttpError(400, 'The image is empty.');
    if (buffer.length > MAX_BYTES) throw new HttpError(413, 'The image is larger than 4 MB.');

    const contentType = detectImageType(buffer);
    if (!contentType) throw new HttpError(415, 'Upload a JPG, PNG, WebP, AVIF or GIF image.');

    const { url } = await storage().putFile(imageKey(body.fileName, contentType), buffer, contentType);
    return { url };
  }
});
