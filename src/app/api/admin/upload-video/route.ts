import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { getCurrentUser } from "@/lib/auth";
import { isEditorOrAbove } from "@/lib/permissions";
import { db } from "@/lib/db";
import { uploadDir } from "@/lib/env";

const TYPES: Record<string, string> = { "video/mp4": ".mp4", "video/webm": ".webm" };

/** Streams a raw video body to disk. Auth and size are checked before any bytes are stored. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isEditorOrAbove(user)) return Response.json({ error: "অনুমতি নেই।" }, { status: 403 });
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return Response.json({ error: "অনুমতি নেই।" }, { status: 403 });

  const type = (req.headers.get("content-type") ?? "").split(";")[0];
  const ext = TYPES[type];
  if (!ext) return Response.json({ error: "শুধু MP4 বা WebM ফাইল দেওয়া যাবে।" }, { status: 415 });
  const max = Number(process.env.VIDEO_MAX_MB || 200) * 1024 * 1024;
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > max) return Response.json({ error: "ফাইলটি অনেক বড়।" }, { status: 413 });
  if (!req.body) return Response.json({ error: "ফাইল পাওয়া যায়নি।" }, { status: 400 });

  const rel = `video/${new Date().toISOString().slice(0, 7)}/${randomBytes(9).toString("base64url")}${ext}`;
  const abs = path.join(uploadDir(), rel);
  await mkdir(path.dirname(abs), { recursive: true });

  let bytes = 0;
  const limiter = async function* (source: AsyncIterable<Uint8Array>) {
    for await (const chunk of source) {
      bytes += chunk.length;
      if (bytes > max) throw new Error("too-large");
      yield chunk;
    }
  };
  try {
    await pipeline(Readable.fromWeb(req.body as import("node:stream/web").ReadableStream), limiter, createWriteStream(abs));
  } catch (e) {
    await rm(abs, { force: true });
    const tooBig = e instanceof Error && e.message === "too-large";
    return Response.json({ error: tooBig ? "ফাইলটি অনেক বড়।" : "আপলোড ব্যর্থ হয়েছে।" }, { status: tooBig ? 413 : 500 });
  }
  if (bytes === 0) {
    await rm(abs, { force: true });
    return Response.json({ error: "ফাইল খালি।" }, { status: 400 });
  }
  const media = await db.media.create({ data: { kind: "video", path: rel, mime: type, uploaderId: user.id } });
  return Response.json({ id: media.id });
}
