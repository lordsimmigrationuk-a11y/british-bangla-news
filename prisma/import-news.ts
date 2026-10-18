/**
 * Imports the newsroom's prepared news batches (prisma/news-import/*.ts) as published
 * articles by the administrator (ADMIN_EMAIL, else the first active admin).
 * Runs on every production start, but each article is keyed by slug: one that already
 * exists is left alone, so redeploys never duplicate or overwrite edits made in Admin.
 *
 * Photos are freely licensed Wikimedia Commons files, downloaded into the site's own
 * storage with the author and licence as the credit. An article only gets its photo
 * while it has none (or while the imported file is missing from storage), so a photo
 * chosen in Admin is never replaced.
 *
 * Run with: npx tsx prisma/import-news.ts
 */
import { access } from "node:fs/promises";
import path from "node:path";
import { db } from "../src/lib/db";
import { saveImageBuffer } from "../src/lib/media-core";
import { uploadDir } from "../src/lib/env";
import { BATCH as BATCH_2026_10_17 } from "./news-import/2026-10-17";
import { BATCH as BATCH_2026_10_17B } from "./news-import/2026-10-17b";
import { BATCH as BATCH_2026_10_18 } from "./news-import/2026-10-18";

export type ImportArticle = {
  slug: string;
  cat: string;
  sub?: string;
  publishedAt: string;
  headline: string;
  summary: string;
  body: string;
  tags: string[];
  /** A Wikimedia Commons file name without the "File:" prefix, or "Category:<name>" to use that category's first file. */
  image?: { file: string; alt: string; caption: string };
  isEditorsPick?: boolean;
  isBreaking?: boolean;
  editorialRank?: number;
};

const BATCHES: ImportArticle[][] = [BATCH_2026_10_17, BATCH_2026_10_17B, BATCH_2026_10_18];

const COMMONS_CREDIT = "Wikimedia Commons";
const USER_AGENT = "BritishBanglaNewsImporter/1.0 (newsroom photo import)";

const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/** Downloads a Commons file (1600px rendition) and its author/licence for the credit. */
async function commonsImage(file: string) {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  const source = file.startsWith("Category:")
    ? { generator: "categorymembers", gcmtitle: file, gcmtype: "file", gcmlimit: "1" }
    : { titles: `File:${file}` };
  api.search = new URLSearchParams({
    action: "query",
    format: "json",
    ...source,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1600",
  }).toString();
  const res = await fetch(api, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
  const json = await res.json();
  const page = Object.values(json?.query?.pages ?? {})[0] as
    | { imageinfo?: { thumburl?: string; url: string; extmetadata?: Record<string, { value: string }> }[] }
    | undefined;
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`Commons file not found: ${file}`);
  const img = await fetch(info.thumburl ?? info.url, { headers: { "User-Agent": USER_AGENT } });
  if (!img.ok) throw new Error(`Commons download ${img.status}`);
  const artist = stripHtml(info.extmetadata?.Artist?.value ?? "");
  const licence = stripHtml(info.extmetadata?.LicenseShortName?.value ?? "");
  const credit = [artist, COMMONS_CREDIT].filter(Boolean).join(" / ") + (licence ? ` (${licence})` : "");
  return { buffer: Buffer.from(await img.arrayBuffer()), credit };
}

async function fileMissing(media: { path: string; widths: string }) {
  const w = media.widths.split(",").pop();
  try {
    await access(path.join(uploadDir(), `${media.path}-${w}.webp`));
    return false;
  } catch {
    return true;
  }
}

async function attachImages(authorId: string) {
  let added = 0;
  for (const a of BATCHES.flat()) {
    if (!a.image) continue;
    const art = await db.article.findUnique({ where: { slug: a.slug }, include: { featuredImage: true } });
    if (!art) continue;
    const current = art.featuredImage;
    if (current && !(current.credit?.includes(COMMONS_CREDIT) && (await fileMissing(current)))) continue;
    try {
      const { buffer, credit } = await commonsImage(a.image.file);
      const media = await saveImageBuffer(buffer, { alt: a.image.alt, credit, uploaderId: authorId });
      await db.article.update({
        where: { id: art.id },
        data: { featuredImageId: media.id, imageCaption: art.imageCaption ?? a.image.caption },
      });
      added++;
    } catch (e) {
      console.log(`News import: photo for ${a.slug} skipped (${e instanceof Error ? e.message : e}).`);
    }
  }
  console.log(`News import: ${added} photo(s) added.`);
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const author =
    (adminEmail && (await db.user.findUnique({ where: { email: adminEmail } }))) ||
    (await db.user.findFirst({ where: { role: "ADMIN", active: true }, orderBy: { createdAt: "asc" } }));
  if (!author) {
    console.log("News import: no administrator found; skipping.");
    return;
  }

  let added = 0;
  for (const a of BATCHES.flat()) {
    if (await db.article.findUnique({ where: { slug: a.slug }, select: { id: true } })) continue;
    const category = await db.category.findUnique({ where: { slug: a.cat } });
    if (!category) {
      console.log(`News import: category "${a.cat}" missing; skipped ${a.slug}.`);
      continue;
    }
    const sub = a.sub ? await db.category.findUnique({ where: { slug: a.sub } }) : null;
    const tagIds = [];
    for (const name of a.tags) {
      const t = await db.tag.upsert({ where: { name }, create: { name, slug: name.replace(/\s+/g, "-") }, update: {} });
      tagIds.push(t.id);
    }
    const publishedAt = new Date(a.publishedAt);
    const art = await db.article.create({
      data: {
        slug: a.slug,
        headline: a.headline,
        summary: a.summary,
        body: a.body,
        status: "PUBLISHED",
        categoryId: category.id,
        subcategoryId: sub?.id ?? null,
        authorId: author.id,
        bylineOverride: "ব্রিটিশ বাংলা নিউজ ডেস্ক",
        isEditorsPick: !!a.isEditorsPick,
        isBreaking: !!a.isBreaking,
        breakingExpiresAt: a.isBreaking ? new Date(publishedAt.getTime() + 24 * 3600_000) : null,
        editorialRank: a.editorialRank ?? 0,
        publishedAt,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    });
    await db.articleRevision.create({
      data: {
        articleId: art.id,
        editorId: author.id,
        headline: art.headline,
        summary: art.summary,
        body: art.body,
        status: art.status,
        note: "সংবাদ ইমপোর্ট",
      },
    });
    added++;
  }
  console.log(`News import: ${added} new article(s) added.`);
  await attachImages(author.id);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    // Never block the site from starting because of an import problem.
    console.error("News import failed:", e);
    await db.$disconnect();
  });
