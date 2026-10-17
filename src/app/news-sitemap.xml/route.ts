import { db } from "@/lib/db";
import { liveWhere } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** Google News sitemap: articles from the last 48 hours, at most 1,000 URLs. */
export async function GET() {
  const s = await getSettings();
  const since = new Date(Date.now() - 48 * 3600 * 1000);
  const items = await db.article.findMany({
    where: { AND: [liveWhere(), { publishedAt: { gte: since } }], isSample: false, noindex: false, isSponsored: false },
    orderBy: { publishedAt: "desc" },
    take: 1000,
    select: { slug: true, headline: true, publishedAt: true },
  });
  const base = siteUrl();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items
  .map(
    (a) => `  <url>
    <loc>${esc(`${base}/news/${encodeURIComponent(a.slug)}`)}</loc>
    <news:news>
      <news:publication><news:name>${esc(s.siteNameEn)}</news:name><news:language>bn</news:language></news:publication>
      <news:publication_date>${a.publishedAt!.toISOString()}</news:publication_date>
      <news:title>${esc(a.headline)}</news:title>
    </news:news>
  </url>`,
  )
  .join("\n")}
</urlset>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" } });
}
