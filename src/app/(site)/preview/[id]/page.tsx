import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditArticle } from "@/lib/permissions";
import { renderArticleBody, splitAfterParagraph } from "@/lib/markdown";
import { formatDateTime } from "@/lib/format";
import { youtubeEmbedUrl, youtubeId } from "@/lib/youtube";
import { absoluteUrl } from "@/lib/env";
import { STATUS_LABELS, type ArticleStatus } from "@/lib/constants";
import { ArticleView } from "@/components/news/ArticleView";

export const metadata: Metadata = { title: "প্রিভিউ", robots: { index: false, follow: false } };

/** Signed-in staff can preview any article they may edit, in any status, with the live page template. */
export default async function PreviewPage({ params }: PageProps<"/preview/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const a = await db.article.findUnique({
    where: { id },
    include: {
      category: true,
      subcategory: true,
      author: { include: { avatar: true } },
      featuredImage: true,
      tags: { include: { tag: true } },
    },
  });
  if (!a) notFound();
  if (!canEditArticle(user, a) && a.authorId !== user.id) notFound();
  const html = renderArticleBody(a.body);
  const vid = youtubeId(a.videoUrl);
  return (
    <>
      <div role="status" className="sticky top-0 z-50 bg-amber-400 px-4 py-2 text-center font-semibold text-ink">
        প্রিভিউ · অবস্থা: {STATUS_LABELS[a.status as ArticleStatus] ?? a.status} · পাঠকেরা এই পাতা দেখতে পাচ্ছেন না, যদি না এটি প্রকাশিত
        হয়।{" "}
        <a href={`/admin/articles/${a.id}`} className="underline">
          সম্পাদনায় ফিরুন
        </a>
      </div>
      <ArticleView
        article={a}
        crumbs={[
          { name: "প্রচ্ছদ", path: "/" },
          { name: a.category.name, path: `/category/${a.category.slug}` },
          { name: "প্রিভিউ", path: `/preview/${a.id}` },
        ]}
        byline={a.bylineOverride || a.author.name}
        bodyHtml={html}
        bodySplit={splitAfterParagraph(html, 4)}
        videoEmbed={vid ? youtubeEmbedUrl(vid) : null}
        shareUrl={absoluteUrl(`/news/${a.slug}`)}
        related={[]}
        more={[]}
        latest={[]}
        jsonLd={null}
        publishedLabel={a.publishedAt ? formatDateTime(a.publishedAt) : "এখনও প্রকাশিত হয়নি"}
        updatedLabel={a.contentUpdatedAt ? formatDateTime(a.contentUpdatedAt) : null}
        preview
      />
    </>
  );
}
