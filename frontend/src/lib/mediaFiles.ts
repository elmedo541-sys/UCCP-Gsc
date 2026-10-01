const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi', 'video/mov'];
export function validateMediaFile(file: File, allowVideo = false): string | null {
  const video = VIDEO_TYPES.includes(file.type);
  if (!IMAGE_TYPES.includes(file.type) && !(allowVideo && video)) return 'Choose a JPEG, PNG, WebP or GIF image' + (allowVideo ? ', or an MP4, WebM or MOV video.' : '.');
  if (file.size === 0) return 'The selected file is empty.';
  if (file.size > (video ? 100 : 10) * 1024 * 1024) return video ? 'Videos must be 100 MB or smaller.' : 'Images must be 10 MB or smaller.';
  return null;
}
// Preserve animated GIFs and transparency; resize ordinary photos to reduce transfer size.
export async function compressPhoto(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size < 500 * 1024) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('Could not read the selected image.')); img.src = url; });
    const ratio = Math.min(1, 1920 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.width * ratio)); canvas.height = Math.max(1, Math.round(img.height * ratio));
    const context = canvas.getContext('2d'); if (!context) return file;
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    const mime = file.type === 'image/png' ? 'image/png' : 'image/webp';
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, .85));
    if (!blob || blob.size >= file.size) return file;
    const actualMime = blob.type || mime;
    const name = file.name.replace(/\.[^.]+$/, '') + (actualMime === 'image/png' ? '.png' : '.webp');
    return new File([blob], name, { type: actualMime, lastModified: file.lastModified });
  } finally { URL.revokeObjectURL(url); }
}
