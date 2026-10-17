import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { getPublishedVideos } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { youtubeEmbedUrl, youtubeThumb } from "@/lib/youtube";
import { imageUrl } from "@/lib/image";
import { absoluteUrl } from "@/lib/env";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { VideoCard } from "@/components/news/VideoCard";
import { SampleBadge } from "@/components/news/Labels";
import { ShareButtons } from "@/components/news/ShareButtons";
import { SectionHeader } from "@/components/news/SectionHeader";

const getVideo = cache((slug: string) =>
  db.video.findFirst({
    where: { slug: decodeURIComponent(slug), status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: { thumbnail: true, file: true },
  }),
);

export async function generateMetadata({ params }: PageProps<"/video/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVideo(slug);
  if (!v) return { title: "ভিডিও পাওয়া যায়নি" };
  const image = v.thumbnail ? imageUrl(v.thumbnail, 1600) : v.youtubeId ? youtubeThumb(v.youtubeId) : "/brand/og-default.png";
  return {
    title: v.title,
    description: v.description.slice(0, 200) || v.title,
    alternates: { canonical: `/video/${v.slug}` },
    openGraph: { type: "video.other", title: v.title, images: [image] },
    robots: v.isSample ? { index: false } : undefined,
  };
}

export default async function VideoPage({ params }: PageProps<"/video/[slug]">) {
  const { slug } = await params;
  const v = await getVideo(slug);
  if (!v) notFound();
  const more = (await getPublishedVideos(5)).filter((x) => x.id !== v.id).slice(0, 4);
  const thumb = v.thumbnail ? absoluteUrl(imageUrl(v.thumbnail, 1600)) : v.youtubeId ? youtubeThumb(v.youtubeId) : null;

  return (
    <main className="mx-auto max-w-7xl px-4 pt-5">
      <Breadcrumbs
        items={[
          { name: "প্রচ্ছদ", path: "/" },
          { name: "ভিডিও", path: "/video" },
          { name: v.title, path: `/video/${v.slug}` },
        ]}
      />
      {!v.isSample && thumb && v.publishedAt && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: v.title,
            description: v.description || v.title,
            thumbnailUrl: [thumb],
            uploadDate: v.publishedAt.toISOString(),
            ...(v.youtubeId ? { embedUrl: youtubeEmbedUrl(v.youtubeId) } : {}),
            ...(v.file ? { contentUrl: absoluteUrl(`/media/${v.file.path}`) } : {}),
          }}
        />
      )}
      <article className="mx-auto mt-5 max-w-4xl">
        <div className="video-embed">
          {v.youtubeId ? (
            <iframe src={youtubeEmbedUrl(v.youtubeId)} title={v.title} allow="encrypted-media; picture-in-picture" allowFullScreen />
          ) : v.file ? (
            <video controls preload="metadata" poster={v.thumbnail ? imageUrl(v.thumbnail, 1600) : undefined}>
              <source src={`/media/${v.file.path}`} type={v.file.mime} />
              আপনার ব্রাউজার এই ভিডিও চালাতে পারছে না।
            </video>
          ) : null}
        </div>
        <h1 className="mt-5 text-3xl font-bold leading-snug">{v.title}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          {v.publishedAt && <time dateTime={v.publishedAt.toISOString()}>{formatDateTime(v.publishedAt)}</time>}
          {v.isSample && <SampleBadge />}
        </p>
        {v.description && <p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{v.description}</p>}
        <div className="mt-5">
          <ShareButtons url={absoluteUrl(`/video/${v.slug}`)} title={v.title} />
        </div>
      </article>
      {more.length > 0 && (
        <section aria-labelledby="more-videos" className="mt-12">
          <SectionHeader title="আরও ভিডিও" href="/video" id="more-videos" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((x) => (
              <VideoCard key={x.id} v={x} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
