import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db, isPostgres } from "./db";
import { getSettings } from "./settings";
import { PAGE_SIZE } from "./constants";

/** Visible to readers: published, or scheduled with a publish time that has passed. */
export function liveWhere(): Prisma.ArticleWhereInput {
  return { status: { in: ["PUBLISHED", "SCHEDULED"] }, publishedAt: { lte: new Date() } };
}

export const cardInclude = {
  category: { select: { name: true, slug: true } },
  author: { select: { name: true, slug: true } },
  featuredImage: true,
} satisfies Prisma.ArticleInclude;

export type CardArticle = Prisma.ArticleGetPayload<{ include: typeof cardInclude }>;

export const getNavCategories = cache(async () =>
  db.category.findMany({
    where: { parentId: null, showInNav: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true },
  }),
);

export const getBreaking = cache(async () => {
  const now = new Date();
  return db.article.findMany({
    where: {
      ...liveWhere(),
      isBreaking: true,
      OR: [{ breakingExpiresAt: null }, { breakingExpiresAt: { gt: now } }],
    },
    orderBy: { publishedAt: "desc" },
    take: 6,
    select: { id: true, slug: true, headline: true },
  });
});

export async function getLatest(take: number, exclude: string[] = [], skip = 0) {
  return db.article.findMany({
    where: { ...liveWhere(), id: { notIn: exclude } },
    orderBy: { publishedAt: "desc" },
    take,
    skip,
    include: cardInclude,
  });
}

export async function getFeatured(): Promise<CardArticle | null> {
  const s = await getSettings();
  if (s.featuredArticleId) {
    const a = await db.article.findFirst({ where: { ...liveWhere(), id: s.featuredArticleId }, include: cardInclude });
    if (a) return a;
  }
  return db.article.findFirst({ where: liveWhere(), orderBy: { publishedAt: "desc" }, include: cardInclude });
}

export async function getCategoryArticles(categoryId: string, take: number, exclude: string[] = [], skip = 0) {
  return db.article.findMany({
    where: { ...liveWhere(), id: { notIn: exclude }, OR: [{ categoryId }, { subcategoryId: categoryId }] },
    orderBy: { publishedAt: "desc" },
    take,
    skip,
    include: cardInclude,
  });
}

export async function countCategoryArticles(categoryId: string) {
  return db.article.count({ where: { ...liveWhere(), OR: [{ categoryId }, { subcategoryId: categoryId }] } });
}

export async function getEditorsPicks(take: number, exclude: string[] = []) {
  return db.article.findMany({
    where: { ...liveWhere(), isEditorsPick: true, id: { notIn: exclude } },
    orderBy: [{ editorialRank: "desc" }, { publishedAt: "desc" }],
    take,
    include: cardInclude,
  });
}

/**
 * Popular stories. In "views" mode this ranks by anonymous daily view totals over the
 * configured window and tops up with editorial rank; in "editorial" mode editors' rank only.
 * Counts are never shown to readers.
 */
export async function getPopular(take: number): Promise<CardArticle[]> {
  const s = await getSettings();
  const ids: string[] = [];
  if (s.popularMode === "views") {
    const days = Math.min(Math.max(Number(s.popularWindowDays) || 7, 1), 30);
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const rows = await db.articleViewDaily.groupBy({
      by: ["articleId"],
      where: { day: { gte: since }, article: liveWhere() },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take,
    });
    ids.push(...rows.map((r) => r.articleId));
  }
  const ranked = ids.length ? await db.article.findMany({ where: { id: { in: ids } }, include: cardInclude }) : [];
  ranked.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  if (ranked.length < take) {
    const fill = await db.article.findMany({
      where: { ...liveWhere(), id: { notIn: ids }, editorialRank: { gt: 0 } },
      orderBy: [{ editorialRank: "desc" }, { publishedAt: "desc" }],
      take: take - ranked.length,
      include: cardInclude,
    });
    ranked.push(...fill);
  }
  return ranked;
}

export function normaliseQuery(q: string | string[] | undefined): string {
  const v = Array.isArray(q) ? q[0] : q;
  return (v ?? "").normalize("NFC").replace(/\s+/g, " ").trim().slice(0, 100);
}

export async function searchArticles(q: string, page: number) {
  const terms = q.split(" ").filter(Boolean).slice(0, 6);
  const mode = isPostgres ? ({ mode: "insensitive" } as const) : {};
  const where: Prisma.ArticleWhereInput = {
    ...liveWhere(),
    AND: terms.map((t) => ({
      OR: [
        { headline: { contains: t, ...mode } },
        { summary: { contains: t, ...mode } },
        { body: { contains: t, ...mode } },
        { tags: { some: { tag: { name: { contains: t, ...mode } } } } },
      ],
    })),
  };
  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: cardInclude,
    }),
    db.article.count({ where }),
  ]);
  return { items, total };
}

export function pageParam(v: string | string[] | undefined): number {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n > 0 && n < 10000 ? n : 1;
}

export async function getPublishedVideos(take: number, skip = 0) {
  return db.video.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    orderBy: { publishedAt: "desc" },
    take,
    skip,
    include: { thumbnail: true },
  });
}
