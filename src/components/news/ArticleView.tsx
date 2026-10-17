import Link from "next/link";
import type { Article, Category, Media, Tag, ArticleTag, User } from "@prisma/client";
import type { CardArticle } from "@/lib/queries";
import { Breadcrumbs } from "../site/Breadcrumbs";
import { JsonLd } from "../site/JsonLd";
import { AdSlot } from "../site/AdSlot";
import { ResponsiveImage } from "./ResponsiveImage";
import { ShareButtons } from "./ShareButtons";
import { ViewBeacon } from "./ViewBeacon";
import { SectionHeader } from "./SectionHeader";
import { StoryCard, RowCard } from "./ArticleCard";
import { CategoryLabel, SponsoredLabel } from "./Labels";

type FullArticle = Article & {
  category: Category;
  subcategory: Category | null;
  author: User & { avatar: Media | null };
  featuredImage: Media | null;
  tags: (ArticleTag & { tag: Tag })[];
};

export function ArticleView(props: {
  article: FullArticle;
  crumbs: { name: string; path: string }[];
  byline: string;
  bodyHtml: string | null;
  bodySplit: [string, string] | null;
  videoEmbed: string | null;
  shareUrl: string;
  related: CardArticle[];
  more: CardArticle[];
  latest: CardArticle[];
  jsonLd: unknown | null;
  publishedLabel: string;
  updatedLabel: string | null;
  preview: boolean;
}) {
  const { article: a } = props;
  const img = a.featuredImage;
  const credit = img?.credit;

  return (
    <main className="mx-auto max-w-7xl px-4 pt-5">
      {props.jsonLd ? <JsonLd data={props.jsonLd} /> : null}
      {!props.preview && <ViewBeacon articleId={a.id} />}
      <Breadcrumbs items={props.crumbs} />

      <div className="mt-5 grid gap-10 lg:grid-cols-12">
        <article className="min-w-0 lg:col-span-8">
          {a.isSample && (
            <div role="note" className="mb-5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-base text-amber-950">
              <strong>নমুনা কনটেন্ট:</strong> এই লেখাটি ওয়েবসাইটের নকশা দেখানোর জন্য তৈরি একটি কাল্পনিক নমুনা। এটি কোনো প্রকৃত ঘটনা বা
              যাচাই করা সংবাদ নয়।
            </div>
          )}
          {a.isSponsored && (
            <div role="note" className="mb-5 border-l-4 border-ink bg-surface px-4 py-3 text-base">
              <SponsoredLabel sponsor={a.sponsorName} /> এটি অর্থের বিনিময়ে প্রকাশিত কনটেন্ট। এটি আমাদের সংবাদকক্ষের স্বাধীন প্রতিবেদন নয়।
            </div>
          )}

          <header>
            <div className="flex flex-wrap items-center gap-2">
              <CategoryLabel name={a.category.name} slug={a.category.slug} className="text-base" />
              {a.subcategory && (
                <>
                  <span className="text-muted" aria-hidden="true">
                    ›
                  </span>
                  <CategoryLabel name={a.subcategory.name} slug={a.subcategory.slug} className="text-base" />
                </>
              )}
            </div>
            <h1 className="mt-2 text-[1.9rem] font-bold leading-[1.3] text-ink sm:text-[2.5rem] sm:leading-[1.25]">{a.headline}</h1>
            <p className="mt-3 text-xl leading-relaxed text-[#333]">{a.summary}</p>

            <div className="mt-5 flex flex-col gap-4 border-y border-line py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-base">
                <p className="font-semibold text-ink">
                  {a.bylineOverride ? (
                    a.bylineOverride
                  ) : (
                    <Link prefetch={false} href={`/author/${a.author.slug}`} className="hover:text-brand hover:underline" rel="author">
                      {a.author.name}
                    </Link>
                  )}
                  {!a.bylineOverride && a.author.designation && <span className="font-normal text-muted">, {a.author.designation}</span>}
                </p>
                <p className="text-sm text-muted">
                  প্রকাশ: <time dateTime={a.publishedAt?.toISOString()}>{props.publishedLabel}</time>
                  {props.updatedLabel && (
                    <>
                      {" "}
                      · হালনাগাদ: <time dateTime={a.contentUpdatedAt?.toISOString()}>{props.updatedLabel}</time>
                    </>
                  )}
                </p>
              </div>
              <ShareButtons url={props.shareUrl} title={a.headline} />
            </div>
          </header>

          {img && (
            <figure className="mt-6">
              <ResponsiveImage image={img} sizes="(min-width: 1024px) 800px, 100vw" priority />
              {(a.imageCaption || credit) && (
                <figcaption className="mt-2 text-sm leading-relaxed text-muted">
                  {a.imageCaption}
                  {credit && <span className="ml-1 text-[#444]">ছবি: {credit}</span>}
                </figcaption>
              )}
            </figure>
          )}

          {props.videoEmbed && (
            <div className="video-embed mt-6">
              <iframe
                src={props.videoEmbed}
                title={`ভিডিও: ${a.headline}`}
                loading="lazy"
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="mx-auto mt-8 max-w-[44rem]">
            {props.bodySplit ? (
              <>
                <div className="article-body" dangerouslySetInnerHTML={{ __html: props.bodySplit[0] }} />
                <AdSlot placement="inArticle" />
                <div className="article-body mt-[1.15em]" dangerouslySetInnerHTML={{ __html: props.bodySplit[1] }} />
              </>
            ) : (
              <div className="article-body" dangerouslySetInnerHTML={{ __html: props.bodyHtml ?? "" }} />
            )}

            {a.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-muted">ট্যাগ:</span>
                {a.tags.map(({ tag }) => (
                  <Link
                    prefetch={false}
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    className="rounded-full border border-line px-3 py-0.5 text-sm hover:border-brand hover:text-brand"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 border-t border-line pt-5">
              <ShareButtons url={props.shareUrl} title={a.headline} />
            </div>

            {!a.bylineOverride && (
              <section aria-label="লেখক পরিচিতি" className="mt-8 flex gap-4 bg-surface p-5">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-line">
                  {a.author.avatar && <ResponsiveImage image={a.author.avatar} sizes="64px" ratio="1/1" alt="" />}
                </div>
                <div>
                  <p className="text-lg font-bold">
                    <Link prefetch={false} href={`/author/${a.author.slug}`} className="hover:text-brand hover:underline">
                      {a.author.name}
                    </Link>
                  </p>
                  {a.author.designation && <p className="text-sm text-muted">{a.author.designation}</p>}
                  {a.author.bio && <p className="mt-2 text-base leading-relaxed text-[#333]">{a.author.bio}</p>}
                </div>
              </section>
            )}

            <aside className="mt-6 border border-line p-5 text-base">
              <h2 className="font-bold">ভুল চোখে পড়েছে?</h2>
              <p className="mt-1 text-[#333]">
                আমরা নির্ভুল তথ্য প্রকাশে প্রতিশ্রুতিবদ্ধ। এই প্রতিবেদনে কোনো ভুল থাকলে{" "}
                <Link
                  prefetch={false}
                  href={`/corrections?article=${encodeURIComponent(props.shareUrl)}#report`}
                  className="font-semibold text-brand-dark underline"
                >
                  সংশোধনের অনুরোধ পাঠান
                </Link>
                । আমাদের{" "}
                <Link prefetch={false} href="/corrections" className="underline">
                  সংশোধন নীতিমালা
                </Link>{" "}
                দেখুন।
              </p>
            </aside>
          </div>

          {props.related.length > 0 && (
            <section aria-labelledby="related-h" className="mt-12">
              <SectionHeader title="সম্পর্কিত সংবাদ" id="related-h" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {props.related.slice(0, 3).map((r) => (
                  <StoryCard key={r.id} a={r} />
                ))}
              </div>
            </section>
          )}
          {props.more.length > 0 && (
            <section aria-labelledby="more-h" className="mt-12">
              <SectionHeader title={`${a.category.name} থেকে আরও`} href={`/category/${a.category.slug}`} id="more-h" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {props.more.map((r) => (
                  <StoryCard key={r.id} a={r} showCategory={false} />
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="hidden lg:col-span-4 lg:block" aria-label="সাইডবার">
          <div className="sticky top-16 space-y-8">
            <section aria-labelledby="side-latest">
              <SectionHeader title="সর্বশেষ" href="/latest" id="side-latest" />
              <ul className="divide-y divide-line">
                {props.latest.map((r) => (
                  <li key={r.id} className="py-3 first:pt-0">
                    <RowCard a={r} as="h3" />
                  </li>
                ))}
              </ul>
            </section>
            <AdSlot placement="articleSidebar" />
          </div>
        </aside>
      </div>
    </main>
  );
}
