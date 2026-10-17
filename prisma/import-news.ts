/**
 * Imports the newsroom's prepared news batches (prisma/news-import/*.ts) as published
 * articles by the administrator (ADMIN_EMAIL, else the first active admin).
 * Runs on every production start, but each article is keyed by slug: one that already
 * exists is left alone, so redeploys never duplicate or overwrite edits made in Admin.
 *
 * Run with: npx tsx prisma/import-news.ts
 */
import { db } from "../src/lib/db";
import { BATCH as BATCH_2026_10_17 } from "./news-import/2026-10-17";

export type ImportArticle = {
  slug: string;
  cat: string;
  sub?: string;
  publishedAt: string;
  headline: string;
  summary: string;
  body: string;
  tags: string[];
  isEditorsPick?: boolean;
  isBreaking?: boolean;
  editorialRank?: number;
};

const BATCHES: ImportArticle[][] = [BATCH_2026_10_17];

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
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    // Never block the site from starting because of an import problem.
    console.error("News import failed:", e);
    await db.$disconnect();
  });
