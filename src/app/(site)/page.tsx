import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import {
  getFeatured,
  getLatest,
  getCategoryArticles,
  getEditorsPicks,
  getPopular,
  getPublishedVideos,
  type CardArticle,
} from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { youtubeId, youtubeEmbedUrl } from "@/lib/youtube";
import { toBnDigits } from "@/lib/format";
import { LeadCard, StoryCard, RowCard, HeadlineItem } from "@/components/news/ArticleCard";
import { SectionHeader } from "@/components/news/SectionHeader";
import { VideoCard } from "@/components/news/VideoCard";
import { JsonLd } from "@/components/site/JsonLd";
import { AdSlot } from "@/components/site/AdSlot";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: { absolute: `${s.siteNameBn} | ${s.siteNameEn}` }, alternates: { canonical: "/" } };
}

type Cat = { id: string; name: string; slug: string };
type Block =
  | { kind: "CATEGORY"; id: string; title: string; cat: Cat; items: CardArticle[] }
  | { kind: "CATEGORY_PAIR"; id: string; title: string; pair: { cat: Cat; items: CardArticle[] }[] }
  | { kind: "POPULAR"; id: string; title: string; items: CardArticle[] }
  | { kind: "EDITORS_PICK"; id: string; title: string; items: CardArticle[] }
  | { kind: "VIDEO"; id: string; title: string; items: Awaited<ReturnType<typeof getPublishedVideos>> };

export default async function HomePage() {
  const settings = await getSettings();
  // Sections are loaded in order so a story already shown higher up is not repeated below.
  const used = new Set<string>();
  const take = (list: CardArticle[]) => {
    list.forEach((a) => used.add(a.id));
    return list;
  };

  const featured = await getFeatured();
  if (featured) used.add(featured.id);
  // Secondary column: recent stories from different sections, for breadth at a glance.
  const recent = await getLatest(20, [...used]);
  const seenCats = new Set<string>();
  const secondary = take(recent.filter((a) => !seenCats.has(a.categoryId) && (seenCats.add(a.categoryId), true)).slice(0, 5));
  // Chronological feed of everything else, so the top of the page never shows a story twice.
  const latestFeed = await getLatest(10, [...used]);

  const sections = await db.homeSection.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
    include: { category: true, category2: true },
  });

  const blocks: Block[] = [];
  for (const s of sections) {
    if (s.kind === "CATEGORY" && s.category) {
      const items = take(await getCategoryArticles(s.category.id, 5, [...used]));
      if (items.length) blocks.push({ kind: "CATEGORY", id: s.id, title: s.title, cat: s.category, items });
    } else if (s.kind === "CATEGORY_PAIR" && s.category) {
      const pair = [];
      for (const c of [s.category, s.category2].filter(Boolean) as Cat[]) {
        const items = take(await getCategoryArticles(c.id, 4, [...used]));
        if (items.length) pair.push({ cat: c, items });
      }
      if (pair.length) blocks.push({ kind: "CATEGORY_PAIR", id: s.id, title: s.title, pair });
    } else if (s.kind === "POPULAR") {
      const items = await getPopular(5);
      if (items.length) blocks.push({ kind: "POPULAR", id: s.id, title: s.title, items });
    } else if (s.kind === "EDITORS_PICK") {
      const items = take(await getEditorsPicks(4, [...used]));
      if (items.length) blocks.push({ kind: "EDITORS_PICK", id: s.id, title: s.title, items });
    } else if (s.kind === "VIDEO") {
      const items = await getPublishedVideos(4);
      if (items.length) blocks.push({ kind: "VIDEO", id: s.id, title: s.title, items });
    }
  }

  const liveId = youtubeId(settings.liveStreamUrl);

  return (
    <main>
      <h1 className="sr-only">
        {settings.siteNameBn} — {settings.tagline}
      </h1>
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd(settings)]} />

      {!featured ? (
        <section className="mx-auto max-w-7xl px-4 py-16 text-center">
          <p className="text-lg text-muted">এখনও কোনো সংবাদ প্রকাশিত হয়নি।</p>
        </section>
      ) : (
        <section aria-labelledby="top-stories" className="mx-auto max-w-7xl px-4 pt-6">
          <h2 id="top-stories" className="sr-only">
            প্রধান সংবাদ
          </h2>
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <LeadCard a={featured} as="h3" />
            </div>
            <div className="lg:col-span-3 lg:border-l lg:border-line lg:pl-6">
              <ul className="divide-y divide-line">
                {secondary.map((a) => (
                  <li key={a.id} className="py-3 first:pt-0">
                    <RowCard a={a} />
                  </li>
                ))}
              </ul>
            </div>
            <aside aria-labelledby="latest-heading" className="lg:col-span-3 lg:border-l lg:border-line lg:pl-6">
              <SectionHeader title="সর্বশেষ সংবাদ" href="/latest" id="latest-heading" as="h2" />
              <ol className="max-h-[34rem] divide-y divide-line overflow-y-auto pr-1">
                {latestFeed.map((a) => (
                  <li key={a.id}>
                    <HeadlineItem a={a} />
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>
      )}

      <div className="mx-auto mt-8 max-w-7xl px-4">
        <AdSlot placement="homeBanner" />
      </div>

      {liveId && (
        <section aria-labelledby="live-heading" className="mx-auto mt-10 max-w-7xl px-4">
          <SectionHeader title="সরাসরি সম্প্রচার" href="/live" id="live-heading" />
          <div className="video-embed mx-auto max-w-4xl">
            <iframe
              src={youtubeEmbedUrl(liveId)}
              title="সরাসরি সম্প্রচার"
              loading="lazy"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {blocks.map((b, i) => (
        <HomeBlock key={b.id} b={b} index={i} />
      ))}
    </main>
  );
}

function HomeBlock({ b, index }: { b: Block; index: number }) {
  const hid = `sec-${b.id}`;
  switch (b.kind) {
    case "CATEGORY": {
      const [first, ...rest] = b.items;
      const flip = index % 2 === 1;
      return (
        <section aria-labelledby={hid} className="mx-auto mt-12 max-w-7xl px-4">
          <SectionHeader title={b.title} href={`/category/${b.cat.slug}`} id={hid} />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className={`lg:col-span-5 ${flip ? "lg:order-2" : ""}`}>
              <StoryCard a={first} summary showCategory={false} large />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
              {rest.map((a) => (
                <StoryCard key={a.id} a={a} showCategory={false} />
              ))}
            </div>
          </div>
        </section>
      );
    }
    case "CATEGORY_PAIR":
      return (
        <section aria-label={b.title} className="mx-auto mt-12 max-w-7xl px-4">
          <div className="grid gap-10 md:grid-cols-2">
            {b.pair.map(({ cat, items }) => {
              const [first, ...rest] = items;
              return (
                <div key={cat.id}>
                  <SectionHeader title={cat.name} href={`/category/${cat.slug}`} id={`${hid}-${cat.slug}`} />
                  <StoryCard a={first} summary showCategory={false} />
                  <ul className="mt-2 divide-y divide-line border-t border-line">
                    {rest.map((a) => (
                      <li key={a.id}>
                        <HeadlineItem a={a} showCategory={false} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      );
    case "POPULAR":
      return (
        <section aria-labelledby={hid} className="mx-auto mt-12 max-w-7xl px-4">
          <SectionHeader title={b.title} href="/popular" id={hid} />
          <ol className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-5">
            {b.items.map((a, i) => (
              <li key={a.id} className="flex gap-3">
                <span className="text-4xl font-bold leading-none text-brand/80" aria-hidden="true">
                  {toBnDigits(i + 1)}
                </span>
                <div>
                  <h3 className="text-base font-semibold leading-snug">
                    <Link prefetch={false} href={`/news/${a.slug}`} className="headline-link">
                      {a.headline}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-brand">{a.category.name}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      );
    case "EDITORS_PICK":
      return (
        <section aria-labelledby={hid} className="mt-12 bg-surface py-10">
          <div className="mx-auto max-w-7xl px-4">
            <SectionHeader title={b.title} href="/editors-picks" id={hid} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {b.items.map((a) => (
                <StoryCard key={a.id} a={a} summary />
              ))}
            </div>
          </div>
        </section>
      );
    case "VIDEO":
      return (
        <section aria-labelledby={hid} className="on-dark mt-12 bg-[#111] py-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-4 flex items-end justify-between border-b-2 border-white/80 pb-1.5">
              <h2
                id={hid}
                className="text-xl font-bold text-white before:mr-2 before:inline-block before:h-4 before:w-1.5 before:bg-brand before:content-['']"
              >
                {b.title}
              </h2>
              <Link prefetch={false} href="/video" className="text-sm font-semibold text-white hover:underline">
                সব ভিডিও দেখুন
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {b.items.map((v) => (
                <VideoCard key={v.id} v={v} dark />
              ))}
            </div>
          </div>
        </section>
      );
  }
}
