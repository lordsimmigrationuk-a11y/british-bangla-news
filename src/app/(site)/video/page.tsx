import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getPublishedVideos, pageParam } from "@/lib/queries";
import { VideoCard } from "@/components/news/VideoCard";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Pagination } from "@/components/site/Pagination";

const PER = 12;

export async function generateMetadata({ searchParams }: PageProps<"/video">): Promise<Metadata> {
  const page = pageParam((await searchParams).page);
  return { title: "ভিডিও সংবাদ", alternates: { canonical: page > 1 ? `/video?page=${page}` : "/video" } };
}

export default async function VideoIndex({ searchParams }: PageProps<"/video">) {
  const page = pageParam((await searchParams).page);
  const [items, total] = await Promise.all([
    getPublishedVideos(PER, (page - 1) * PER),
    db.video.count({ where: { status: "PUBLISHED", publishedAt: { lte: new Date() } } }),
  ]);
  return (
    <main className="mx-auto max-w-7xl px-4 pt-5">
      <Breadcrumbs
        items={[
          { name: "প্রচ্ছদ", path: "/" },
          { name: "ভিডিও", path: "/video" },
        ]}
      />
      <h1 className="mt-4 border-b-2 border-ink pb-3 text-3xl font-bold sm:text-4xl">ভিডিও সংবাদ</h1>
      {items.length === 0 ? (
        <p className="py-16 text-center text-lg text-muted">এখনও কোনো ভিডিও প্রকাশিত হয়নি।</p>
      ) : (
        <>
          <h2 className="sr-only">ভিডিওর তালিকা</h2>
          <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((v) => (
              <VideoCard key={v.id} v={v} />
            ))}
          </div>
        </>
      )}
      <Pagination basePath="/video" page={page} totalPages={Math.max(1, Math.ceil(total / PER))} />
    </main>
  );
}
