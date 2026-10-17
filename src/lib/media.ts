import "server-only";
import { saveImageBuffer, UploadError, MAX_IMAGE_BYTES } from "./media-core";

export { saveImageBuffer, UploadError, IMAGE_WIDTHS, MAX_IMAGE_BYTES } from "./media-core";

/**
 * Validates an uploaded image by decoding it, strips metadata (EXIF/GPS), and stores
 * WebP renditions at several widths for responsive delivery.
 */
export async function saveImageUpload(
  file: File,
  meta: { alt: string; credit?: string | null; uploaderId?: string | null; isSample?: boolean },
) {
  if (file.size === 0) throw new UploadError("ফাইল খালি।");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("ছবির আকার ৮ MB-এর বেশি হতে পারবে না।");
  const input = Buffer.from(await file.arrayBuffer());
  return saveImageBuffer(input, meta);
}
