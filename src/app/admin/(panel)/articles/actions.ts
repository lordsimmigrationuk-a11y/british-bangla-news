"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditArticle, canPublish, isEditorOrAbove } from "@/lib/permissions";
import { saveImageUpload, UploadError } from "@/lib/media";
import { asciiSlug, slugify, SLUG_PATTERN } from "@/lib/slug";
import { zonedLocalToUtc } from "@/lib/format";
import { youtubeId } from "@/lib/youtube";
import { setSettings, getSettings } from "@/lib/settings";
import type { ActionState } from "@/components/admin/ActionForm";

const INTENTS = ["save", "submit", "publish", "schedule", "unpublish", "archive"] as const;
type Intent = (typeof INTENTS)[number];

const str = (max: number) => z.string().trim().max(max);
const optStr = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

const schema = z.object({
  headline: str(250).min(5, "শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে।"),
  summary: str(600).min(10, "সারাংশ কমপক্ষে ১০ অক্ষরের হতে হবে।"),
  body: str(200_000).min(20, "মূল লেখা অনেক ছোট।"),
  slug: str(100),
  categoryId: z.string().min(1, "বিভাগ বেছে নিন।"),
  subcategoryId: optStr(40),
  authorId: optStr(40),
  bylineOverride: optStr(120),
  imageAlt: str(300),
  imageCredit: optStr(200),
  imageCaption: optStr(400),
  videoUrl: optStr(300),
  seoTitle: optStr(120),
  seoDescription: optStr(300),
  tags: str(500),
  scheduleAt: str(30),
  breakingHours: str(4),
  sponsorName: optStr(120),
  editorialRank: z.coerce.number().int().min(0).max(100).catch(0),
  revisionNote: optStr(200),
});

const on = (fd: FormData, k: string) => fd.get(k) === "on";

export async function saveArticle(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const intent = String(fd.get("intent") ?? "save") as Intent;
  if (!INTENTS.includes(intent)) return { error: "অজানা কাজ।" };
  const id = String(fd.get("id") ?? "") || null;

  const existing = id ? await db.article.findUnique({ where: { id } }) : null;
  if (id && !existing) return { error: "সংবাদটি পাওয়া যায়নি।" };
  if (existing && !canEditArticle(user, existing)) return { error: "এই সংবাদ সম্পাদনার অনুমতি আপনার নেই।" };
  const editor = canPublish(user);
  if (!editor && !["save", "submit"].includes(intent)) return { error: "প্রকাশ বা নির্ধারণের অনুমতি শুধু সম্পাদকদের আছে।" };

  const parsed = schema.safeParse(Object.fromEntries(Object.keys(schema.shape).map((k) => [k, fd.get(k) ?? ""])));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const v = parsed.data;

  // Category checks
  const cat = await db.category.findUnique({ where: { id: v.categoryId } });
  if (!cat) return { error: "বিভাগটি পাওয়া যায়নি।" };
  if (v.subcategoryId) {
    const sub = await db.category.findUnique({ where: { id: v.subcategoryId } });
    if (!sub || sub.parentId !== cat.id) return { error: "উপবিভাগটি নির্বাচিত বিভাগের অধীনে নয়।" };
  }

  // Slug
  let slug = v.slug.toLowerCase();
  if (slug && !SLUG_PATTERN.test(slug)) return { error: "স্লাগে শুধু ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন।" };
  if (!slug) slug = existing?.slug ?? asciiSlug(v.seoTitle || "", "news");
  const clash = await db.article.findFirst({ where: { slug, NOT: id ? { id } : undefined }, select: { id: true } });
  const redirectClash = await db.slugRedirect.findFirst({ where: { slug, NOT: id ? { articleId: id } : undefined } });
  if (clash || redirectClash) return { error: "এই স্লাগ ইতিমধ্যে ব্যবহৃত হয়েছে। অন্য একটি দিন।" };

  if (v.videoUrl && !youtubeId(v.videoUrl)) return { error: "ভিডিও লিংকটি বৈধ YouTube লিংক নয়।" };

  // Author: reporters always write as themselves.
  let authorId = existing?.authorId ?? user.id;
  if (editor && v.authorId) {
    const au = await db.user.findUnique({ where: { id: v.authorId } });
    if (!au) return { error: "লেখক পাওয়া যায়নি।" };
    authorId = au.id;
  }

  // Featured image
  let featuredImageId = existing?.featuredImageId ?? null;
  const file = fd.get("image");
  if (on(fd, "removeImage")) featuredImageId = null;
  if (file instanceof File && file.size > 0) {
    if (!v.imageAlt) return { error: "নতুন ছবির জন্য বিকল্প লেখা (alt text) দিন।" };
    try {
      const m = await saveImageUpload(file, { alt: v.imageAlt, credit: v.imageCredit, uploaderId: user.id });
      featuredImageId = m.id;
    } catch (e) {
      return { error: e instanceof UploadError ? e.message : "ছবি আপলোড করা যায়নি।" };
    }
  } else if (featuredImageId) {
    await db.media.update({ where: { id: featuredImageId }, data: { alt: v.imageAlt, credit: v.imageCredit } });
  }

  // Status and dates
  const now = new Date();
  let status = existing?.status ?? "DRAFT";
  let publishedAt = existing?.publishedAt ?? null;
  switch (intent) {
    case "save":
      if (!editor && status !== "REVIEW") status = "DRAFT";
      break;
    case "submit":
      status = "REVIEW";
      break;
    case "publish":
      status = "PUBLISHED";
      if (!publishedAt || publishedAt > now) publishedAt = now;
      break;
    case "schedule": {
      const at = zonedLocalToUtc(v.scheduleAt);
      if (!at) return { error: "নির্ধারিত প্রকাশের তারিখ ও সময় দিন।" };
      if (at <= now) return { error: "নির্ধারিত সময় ভবিষ্যতের হতে হবে।" };
      status = "SCHEDULED";
      publishedAt = at;
      break;
    }
    case "unpublish":
      status = "DRAFT";
      break;
    case "archive":
      status = "ARCHIVED";
      break;
  }

  const wasLive =
    existing && (existing.status === "PUBLISHED" || existing.status === "SCHEDULED") && existing.publishedAt && existing.publishedAt <= now;
  const editorFields = editor
    ? {
        isBreaking: on(fd, "isBreaking"),
        breakingExpiresAt:
          on(fd, "isBreaking") && Number(v.breakingHours) > 0
            ? new Date(now.getTime() + Number(v.breakingHours) * 3600_000)
            : on(fd, "isBreaking")
              ? (existing?.breakingExpiresAt ?? null)
              : null,
        isEditorsPick: on(fd, "isEditorsPick"),
        isSponsored: on(fd, "isSponsored"),
        sponsorName: on(fd, "isSponsored") ? v.sponsorName : null,
        editorialRank: v.editorialRank,
        noindex: on(fd, "noindex"),
        isSample: on(fd, "isSample"),
        bylineOverride: v.bylineOverride,
        contentUpdatedAt: wasLive && on(fd, "significantUpdate") ? now : (existing?.contentUpdatedAt ?? null),
      }
    : {};

  const data = {
    headline: v.headline,
    summary: v.summary,
    body: v.body,
    slug,
    status,
    publishedAt,
    categoryId: cat.id,
    subcategoryId: v.subcategoryId,
    authorId,
    featuredImageId,
    imageCaption: v.imageCaption,
    videoUrl: v.videoUrl,
    seoTitle: v.seoTitle,
    seoDescription: v.seoDescription,
    ...editorFields,
  };

  const tagNames = [
    ...new Set(
      v.tags
        .split(/[,،]/)
        .map((t) => t.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  ].slice(0, 12);

  const saved = await db.$transaction(async (tx) => {
    const art = existing ? await tx.article.update({ where: { id: existing.id }, data }) : await tx.article.create({ data });
    if (existing && existing.slug !== slug && existing.publishedAt) {
      await tx.slugRedirect.upsert({
        where: { slug: existing.slug },
        create: { slug: existing.slug, articleId: art.id },
        update: { articleId: art.id },
      });
    }
    await tx.slugRedirect.deleteMany({ where: { slug } });
    await tx.articleTag.deleteMany({ where: { articleId: art.id } });
    for (const name of tagNames) {
      let tag = await tx.tag.findUnique({ where: { name } });
      if (!tag) {
        let tslug = slugify(name) || asciiSlug(name, "tag");
        if (await tx.tag.findUnique({ where: { slug: tslug } })) tslug = `${tslug}-${Date.now().toString(36)}`;
        tag = await tx.tag.create({ data: { name, slug: tslug } });
      }
      await tx.articleTag.create({ data: { articleId: art.id, tagId: tag.id } });
    }
    await tx.articleRevision.create({
      data: {
        articleId: art.id,
        editorId: user.id,
        headline: art.headline,
        summary: art.summary,
        body: art.body,
        status: art.status,
        note: v.revisionNote ?? INTENT_NOTE[intent],
      },
    });
    return art;
  });

  if (editor) {
    const s = await getSettings();
    if (on(fd, "makeFeatured")) await setSettings({ featuredArticleId: saved.id });
    else if (s.featuredArticleId === saved.id) await setSettings({ featuredArticleId: "" });
  }

  redirect(`/admin/articles/${saved.id}?done=${intent}`);
}

const INTENT_NOTE: Record<Intent, string> = {
  save: "সংরক্ষণ",
  submit: "পর্যালোচনার জন্য জমা",
  publish: "প্রকাশ",
  schedule: "প্রকাশের সময় নির্ধারণ",
  unpublish: "প্রকাশ প্রত্যাহার",
  archive: "আর্কাইভ",
};

export async function restoreRevision(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const rev = await db.articleRevision.findUnique({ where: { id: String(fd.get("revisionId")) }, include: { article: true } });
  if (!rev) return { error: "সংস্করণটি পাওয়া যায়নি।" };
  if (!canEditArticle(user, rev.article)) return { error: "অনুমতি নেই।" };
  await db.$transaction([
    db.article.update({ where: { id: rev.articleId }, data: { headline: rev.headline, summary: rev.summary, body: rev.body } }),
    db.articleRevision.create({
      data: {
        articleId: rev.articleId,
        editorId: user.id,
        headline: rev.headline,
        summary: rev.summary,
        body: rev.body,
        status: rev.article.status,
        note: "পুরোনো সংস্করণ ফিরিয়ে আনা হয়েছে",
      },
    }),
  ]);
  redirect(`/admin/articles/${rev.articleId}?done=restore`);
}

export async function deleteArticle(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!isEditorOrAbove(user)) return { error: "শুধু সম্পাদকেরা সংবাদ মুছতে পারেন।" };
  const id = String(fd.get("id"));
  await db.article.delete({ where: { id } }).catch(() => null);
  const s = await getSettings();
  if (s.featuredArticleId === id) await setSettings({ featuredArticleId: "" });
  redirect("/admin/articles?done=deleted");
}
