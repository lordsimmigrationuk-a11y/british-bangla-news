import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { liveWhere } from "@/lib/queries";
import { siteUrl } from "@/lib/env";

// Rendered on request so it always reflects the database.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [articles, categories, videos, pages, authors, tags] = await Promise.all([
    db.article.findMany({
      where: { ...liveWhere(), isSample: false, noindex: false },
      orderBy: { publishedAt: "desc" },
      take: 20000,
      select: { slug: true, publishedAt: true, contentUpdatedAt: true, updatedAt: true },
    }),
    db.category.findMany({ select: { slug: true } }),
    db.video.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() }, isSample: false },
      select: { slug: true, updatedAt: true },
    }),
    db.page.findMany({ select: { slug: true, updatedAt: true } }),
    db.user.findMany({ where: { active: true, isSample: false, articles: { some: liveWhere() } }, select: { slug: true } }),
    db.tag.findMany({ where: { articles: { some: { article: { ...liveWhere(), isSample: false } } } }, select: { slug: true } }),
  ]);
  return [
    { url: `${base}/`, changeFrequency: "always", priority: 1 },
    { url: `${base}/latest`, changeFrequency: "always" },
    { url: `${base}/video` },
    ...categories.map((c) => ({ url: `${base}/category/${c.slug}`, changeFrequency: "hourly" as const })),
    ...pages.map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt })),
    ...authors.map((a) => ({ url: `${base}/author/${a.slug}` })),
    ...tags.map((t) => ({ url: `${base}/tag/${t.slug}` })),
    ...videos.map((v) => ({ url: `${base}/video/${v.slug}`, lastModified: v.updatedAt })),
    ...articles.map((a) => ({
      url: `${base}/news/${a.slug}`,
      lastModified: a.contentUpdatedAt ?? a.publishedAt ?? a.updatedAt,
    })),
  ];
}
