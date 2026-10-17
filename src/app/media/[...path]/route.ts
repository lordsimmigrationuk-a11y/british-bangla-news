import { stat, open } from "node:fs/promises";
import path from "node:path";
import { uploadDir } from "@/lib/env";

const TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

/** Serves uploaded media from UPLOAD_DIR. Paths are confined to that folder; only known file types are served. */
export async function GET(req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  if (parts.some((p) => p === ".." || p.includes("\0") || p.startsWith("."))) return new Response("Not found", { status: 404 });
  const root = path.resolve(uploadDir());
  const file = path.resolve(root, ...parts);
  if (!file.startsWith(root + path.sep)) return new Response("Not found", { status: 404 });
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });

  let size: number;
  try {
    const s = await stat(file);
    if (!s.isFile()) throw new Error();
    size = s.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "content-type": type,
    "cache-control": "public, max-age=31536000, immutable",
    "accept-ranges": "bytes",
    "x-content-type-options": "nosniff",
  };

  const range = req.headers.get("range");
  let start = 0;
  let end = size - 1;
  let status = 200;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!m) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    if (m[1] === "") {
      start = Math.max(0, size - Number(m[2]));
    } else {
      start = Number(m[1]);
      if (m[2] !== "") end = Math.min(Number(m[2]), size - 1);
    }
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    status = 206;
    headers["content-range"] = `bytes ${start}-${end}/${size}`;
  }
  headers["content-length"] = String(end - start + 1);

  const fh = await open(file, "r");
  const stream = fh.createReadStream({ start, end });
  const body = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk instanceof Buffer ? new Uint8Array(chunk) : chunk));
      stream.on("end", () => {
        controller.close();
        fh.close().catch(() => {});
      });
      stream.on("error", (e) => {
        controller.error(e);
        fh.close().catch(() => {});
      });
    },
    cancel() {
      stream.destroy();
      fh.close().catch(() => {});
    },
  });
  return new Response(body, { status, headers });
}
