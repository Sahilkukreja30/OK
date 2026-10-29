import { uploadImage } from './adminApi';

const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024; // keeps the base64 body under the 4.5 MB serverless limit
const OUTPUT_TYPE = 'image/webp';
const OUTPUT_QUALITY = 0.85;

const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.readAsDataURL(blob);
  });

const canvasToBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, OUTPUT_TYPE, OUTPUT_QUALITY));

/** Shrinks big photos and converts them to WebP: faster pages, better SEO, under the upload limit. */
async function compress(file, maxWidth) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await canvasToBlob(canvas);
  return { blob, extension: blob.type === OUTPUT_TYPE ? 'webp' : blob.type.split('/')[1] };
}

/** Compresses (GIFs are sent untouched to keep animation) and uploads; resolves to { id, url }. */
export async function uploadImageFile(file, { maxWidth, title, description }) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');

  const isGif = file.type === 'image/gif';
  const { blob, extension } = isGif ? { blob: file, extension: 'gif' } : await compress(file, maxWidth);
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error('This image is too large. Please choose a smaller one.');

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return uploadImage({
    fileName: `${baseName}.${extension}`,
    contentType: blob.type,
    data: await toBase64(blob),
    title: title || baseName,
    description
  });
}
