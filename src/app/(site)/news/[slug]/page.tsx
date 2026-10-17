import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { db } from "@/lib/db";
import { liveWhere, cardInclude, getLatest } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { renderArticleBody, splitAfterParagraph } from "@/lib/markdown";
import { formatDateTime } from "@/lib/format";
import { absoluteUrl } from "@/lib/env";
import { imageUrl } from "@/lib/image";
import { newsArticleJsonLd } from "@/lib/seo";
import { youtubeEmbedUrl, youtubeId } from "@/lib/youtube";
import { ArticleView } from "@/components/news/ArticleView";

const getArticle = cache(async (slug: string) =>
  db.article.findFirst({
    where: { slug: decodeURIComponent(slug), ...liveWhere() },
    include: {
      category: true,
      subcategory: true,
      author: { include: { avatar: true } },
      featuredImage: true,
      tags: { include: { tag: true } },
    },
  }),
);

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return { title: "সংবাদ পাওয়া যায়নি", robots: { index: false } };
  const title = a.seoTitle || a.headline;
  const description = a.seoDescription || a.summary;
  const image = a.featuredImage ? imageUrl(a.featuredImage, 1600) : "/brand/og-default.png";
  return {
    title,
    description,
    alternates: { canonical: `/news/${a.slug}` },
    // Sample content is never offered to search engines as news.
    robots: a.noindex || a.isSample ? { index: false, follow: true } : { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/news/${a.slug}`,
      images: [{ url: image, alt: a.featuredImage?.alt || a.headline }],
      publishedTime: a.publishedAt?.toISOString(),
      modifiedTime: (a.contentUpdatedAt ?? a.publishedAt)?.toISOString(),
      section: a.category.name,
      tags: a.tags.map((t) => t.tag.name),
      authors: [a.bylineOverride || a.author.name],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ArticlePage({ params }: PageProps<"/news/[slug]">) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) {
    const moved = await db.slugRedirect.findUnique({
      where: { slug: decodeURIComponent(slug) },
      include: { article: { select: { slug: true } } },
    });
    if (moved) permanentRedirect(`/news/${moved.article.slug}`);
    notFound();
  }
  if (decodeURIComponent(slug) !== a.slug) permanentRedirect(`/news/${a.slug}`);

  const settings = await getSettings();
  const tagIds = a.tags.map((t) => t.tagId);
  const [related, moreFromCategory, latest] = await Promise.all([
    tagIds.length
      ? db.article.findMany({
          where: { ...liveWhere(), id: { not: a.id }, tags: { some: { tagId: { in: tagIds } } } },
          orderBy: { publishedAt: "desc" },
          take: 4,
          include: cardInclude,
        })
      : Promise.resolve([]),
    db.article.findMany({
      where: { ...liveWhere(), id: { not: a.id }, categoryId: a.categoryId },
      orderBy: { publishedAt: "desc" },
      take: 7,
      include: cardInclude,
    }),
    getLatest(6, [a.id]),
  ]);
  const relatedIds = new Set(related.map((r) => r.id));
  const more = moreFromCategory.filter((m) => !relatedIds.has(m.id)).slice(0, 6);
  const relatedFinal = related.length ? related : more.slice(0, 3);

  const html = renderArticleBody(a.body);
  const split = splitAfterParagraph(html, 4);
  const vid = youtubeId(a.videoUrl);
  const byline = a.bylineOverride || a.author.name;
  const url = `/news/${a.slug}`;

  const crumbs = [
    { name: "প্রচ্ছদ", path: "/" },
    { name: a.category.name, path: `/category/${a.category.slug}` },
    ...(a.subcategory ? [{ name: a.subcategory.name, path: `/category/${a.subcategory.slug}` }] : []),
    { name: a.headline.length > 60 ? a.headline.slice(0, 57) + "…" : a.headline, path: url },
  ];

  const jsonLd = a.isSample
    ? null
    : newsArticleJsonLd({
        url,
        headline: a.headline,
        description: a.summary,
        image: a.featuredImage,
        publishedAt: a.publishedAt!,
        modifiedAt: a.contentUpdatedAt ?? a.publishedAt!,
        authorName: byline,
        authorUrl: a.bylineOverride ? null : `/author/${a.author.slug}`,
        section: a.category.name,
        isSponsored: a.isSponsored,
        publisherName: settings.siteNameEn,
      });

  return (
    <ArticleView
      article={a}
      crumbs={crumbs}
      byline={byline}
      bodyHtml={split ? null : html}
      bodySplit={split}
      videoEmbed={vid ? youtubeEmbedUrl(vid) : null}
      shareUrl={absoluteUrl(url)}
      related={relatedFinal}
      more={related.length ? more : more.slice(3)}
      latest={latest}
      jsonLd={jsonLd}
      publishedLabel={formatDateTime(a.publishedAt!)}
      updatedLabel={a.contentUpdatedAt ? formatDateTime(a.contentUpdatedAt) : null}
      preview={false}
    />
  );
}
