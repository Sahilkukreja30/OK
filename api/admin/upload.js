import { createPublishedAsset, assetUrl } from '../_lib/contentful.js';
import { HttpError } from '../_lib/errors.js';
import { handle } from '../_lib/http.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MAX_BYTES = 4 * 1024 * 1024;

export default handle({
  POST: async ({ body }) => {
    const { fileName, contentType, data, title, description } = body ?? {};
    if (!ALLOWED_TYPES.includes(contentType)) {
      throw new HttpError(415, 'Upload a JPG, PNG, WebP, AVIF or GIF image.');
    }

    const buffer = Buffer.from(data ?? '', 'base64');
    if (!buffer.length) throw new HttpError(400, 'The image is empty.');
    if (buffer.length > MAX_BYTES) throw new HttpError(413, 'The image is larger than 4 MB.');

    const asset = await createPublishedAsset({
      buffer,
      contentType,
      fileName: String(fileName || 'image').replace(/[^\w.-]+/g, '-'),
      title: title || fileName,
      description
    });
    return { id: asset.sys.id, url: assetUrl(asset) };
  }
});
