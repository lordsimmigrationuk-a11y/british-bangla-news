import { db } from "@/lib/db";
import { liveWhere } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const s = await getSettings();
  const items = await db.article.findMany({
    where: { ...liveWhere(), isSample: false },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: { category: true },
  });
  const base = siteUrl();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(s.siteNameBn)}</title>
  <link>${base}/</link>
  <description>${esc(s.tagline)}</description>
  <language>bn</language>
  <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
${items
  .map(
    (a) => `  <item>
    <title>${esc(a.headline)}</title>
    <link>${base}/news/${encodeURIComponent(a.slug)}</link>
    <guid isPermaLink="true">${base}/news/${encodeURIComponent(a.slug)}</guid>
    <pubDate>${a.publishedAt!.toUTCString()}</pubDate>
    <category>${esc(a.category.name)}</category>
    <description>${esc(a.summary)}</description>
  </item>`,
  )
  .join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=300" } });
}
