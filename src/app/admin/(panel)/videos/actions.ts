"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { asciiSlug, SLUG_PATTERN } from "@/lib/slug";
import { youtubeId } from "@/lib/youtube";
import { saveImageUpload, UploadError } from "@/lib/media";
import type { ActionState } from "@/components/admin/ActionForm";

const schema = z.object({
  title: z.string().trim().min(5, "শিরোনাম দিন।").max(200),
  description: z.string().trim().max(3000),
  slug: z.string().trim().toLowerCase().max(100),
  youtube: z.string().trim().max(300),
  fileId: z.string().trim().max(40),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function saveVideo(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser(["ADMIN", "EDITOR"]);
  const id = String(fd.get("id") ?? "") || null;
  const existing = id ? await db.video.findUnique({ where: { id } }) : null;
  const parsed = schema.safeParse(Object.fromEntries(Object.keys(schema.shape).map((k) => [k, fd.get(k) ?? ""])));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const v = parsed.data;
  const yt = v.youtube ? youtubeId(v.youtube) : null;
  if (v.youtube && !yt) return { error: "YouTube লিংকটি বৈধ নয়।" };
  let fileId = v.fileId || existing?.fileId || null;
  if (fileId && !(await db.media.findFirst({ where: { id: fileId, kind: "video" } }))) fileId = null;
  if (!yt && !fileId) return { error: "YouTube লিংক দিন অথবা একটি ভিডিও ফাইল আপলোড করুন।" };

  let slug = v.slug;
  if (slug && !SLUG_PATTERN.test(slug)) return { error: "স্লাগে শুধু ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন।" };
  if (!slug) slug = existing?.slug ?? asciiSlug("", "video");
  if (await db.video.findFirst({ where: { slug, NOT: id ? { id } : undefined } })) return { error: "এই স্লাগ ব্যবহৃত হয়েছে।" };

  let thumbnailId = existing?.thumbnailId ?? null;
  const thumb = fd.get("thumbnail");
  if (thumb instanceof File && thumb.size > 0) {
    try {
      thumbnailId = (await saveImageUpload(thumb, { alt: v.title, uploaderId: user.id })).id;
    } catch (e) {
      return { error: e instanceof UploadError ? e.message : "থাম্বনেইল আপলোড করা যায়নি।" };
    }
  }
  const publishedAt = v.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null);
  const data = {
    title: v.title,
    description: v.description,
    slug,
    youtubeId: yt,
    fileId: yt ? null : fileId,
    thumbnailId,
    status: v.status,
    publishedAt,
  };
  const saved = existing ? await db.video.update({ where: { id: existing.id }, data }) : await db.video.create({ data });
  redirect(`/admin/videos/${saved.id}?done=1`);
}

export async function deleteVideo(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser(["ADMIN", "EDITOR"]);
  await db.video.delete({ where: { id: String(fd.get("id")) } }).catch(() => null);
  redirect("/admin/videos");
}
