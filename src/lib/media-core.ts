import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { db } from "./db";
import { uploadDir } from "./env";

export const IMAGE_WIDTHS = [480, 960, 1600];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export class UploadError extends Error {}

export async function saveImageBuffer(
  input: Buffer,
  meta: { alt: string; credit?: string | null; uploaderId?: string | null; isSample?: boolean },
) {
  let info: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    info = await sharp(input, { limitInputPixels: 60_000_000 }).metadata();
  } catch {
    throw new UploadError("এটি বৈধ ছবি নয়। JPEG, PNG, WebP বা AVIF ব্যবহার করুন।");
  }
  if (!info.width || !info.height || !["jpeg", "png", "webp", "avif", "gif"].includes(info.format ?? "")) {
    throw new UploadError("এটি বৈধ ছবি নয়। JPEG, PNG, WebP বা AVIF ব্যবহার করুন।");
  }
  const base = `img/${new Date().toISOString().slice(0, 7)}/${randomBytes(9).toString("base64url")}`;
  const dir = path.join(uploadDir(), path.dirname(base));
  await mkdir(dir, { recursive: true });

  const oriented = sharp(input).rotate(); // apply EXIF orientation, then metadata is dropped on output
  const { width: ow = info.width, height: oh = info.height } = await oriented.clone().metadata();
  const widths = IMAGE_WIDTHS.filter((w) => w < ow);
  widths.push(Math.min(ow, 2000));
  const unique = [...new Set(widths)].sort((a, b) => a - b);
  for (const w of unique) {
    const buf = await oriented.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    await writeFile(path.join(uploadDir(), `${base}-${w}.webp`), buf);
  }
  const finalW = Math.min(ow, 2000);
  const finalH = Math.round((oh / ow) * finalW);
  return db.media.create({
    data: {
      kind: "image",
      path: base,
      widths: unique.join(","),
      width: finalW,
      height: finalH,
      mime: "image/webp",
      alt: meta.alt.slice(0, 300),
      credit: meta.credit?.slice(0, 200) || null,
      uploaderId: meta.uploaderId ?? null,
      isSample: meta.isSample ?? false,
    },
  });
}
