import Link from "next/link";
import type { CardArticle } from "@/lib/queries";
import { formatDateTime, timeAgo } from "@/lib/format";
import { ResponsiveImage } from "./ResponsiveImage";
import { CategoryLabel, SampleBadge, SponsoredLabel } from "./Labels";

type H = "h2" | "h3" | "h4";

const href = (a: CardArticle) => `/news/${a.slug}`;
const byline = (a: CardArticle) => a.bylineOverride || a.author.name;

function Flags({ a }: { a: CardArticle }) {
  if (!a.isSample && !a.isSponsored) return null;
  return (
    <span className="flex flex-wrap gap-1.5">
      {a.isSponsored && <SponsoredLabel sponsor={a.sponsorName} />}
      {a.isSample && <SampleBadge />}
    </span>
  );
}

function When({ a, relative = true }: { a: CardArticle; relative?: boolean }) {
  if (!a.publishedAt) return null;
  return (
    <time dateTime={a.publishedAt.toISOString()} title={formatDateTime(a.publishedAt)} className="text-sm text-muted">
      {relative ? timeAgo(a.publishedAt) : formatDateTime(a.publishedAt)}
    </time>
  );
}

/** The dominant lead story on the homepage and category pages. */
export function LeadCard({ a, as: Tag = "h2" }: { a: CardArticle; as?: H }) {
  return (
    <article className="group">
      <Link prefetch={false} href={href(a)} tabIndex={-1} aria-hidden="true">
        <ResponsiveImage image={a.featuredImage} sizes="(min-width: 1024px) 680px, 100vw" priority />
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CategoryLabel name={a.category.name} slug={a.category.slug} />
        <Flags a={a} />
      </div>
      <Tag className="mt-1 text-[1.75rem] font-bold leading-snug text-ink sm:text-[2.1rem] sm:leading-tight">
        <Link prefetch={false} href={href(a)} className="headline-link">
          {a.headline}
        </Link>
      </Tag>
      <p className="mt-2 text-lg leading-relaxed text-[#333]">{a.summary}</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted">
        <span>{byline(a)}</span>
        <span aria-hidden="true">·</span>
        <When a={a} />
      </p>
    </article>
  );
}

/** Standard card with image, used in section grids. */
export function StoryCard({
  a,
  as: Tag = "h3",
  summary = false,
  showCategory = true,
  large = false,
}: {
  a: CardArticle;
  as?: H;
  summary?: boolean;
  showCategory?: boolean;
  large?: boolean;
}) {
  return (
    <article className="flex flex-col">
      <Link prefetch={false} href={href(a)} tabIndex={-1} aria-hidden="true">
        <ResponsiveImage
          image={a.featuredImage}
          sizes={large ? "(min-width: 1024px) 560px, 100vw" : "(min-width: 1024px) 300px, (min-width: 640px) 45vw, 100vw"}
        />
      </Link>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {showCategory && <CategoryLabel name={a.category.name} slug={a.category.slug} />}
        <Flags a={a} />
      </div>
      <Tag className={`mt-1 font-bold leading-snug text-ink ${large ? "text-2xl" : "text-[1.15rem]"}`}>
        <Link prefetch={false} href={href(a)} className="headline-link">
          {a.headline}
        </Link>
      </Tag>
      {summary && <p className="mt-1.5 line-clamp-3 text-base leading-relaxed text-[#444]">{a.summary}</p>}
      <div className="mt-1.5">
        <When a={a} />
      </div>
    </article>
  );
}

/** Thumbnail on the left, headline on the right. */
export function RowCard({ a, as: Tag = "h3", showCategory = true }: { a: CardArticle; as?: H; showCategory?: boolean }) {
  return (
    <article className="flex gap-3">
      <Link prefetch={false} href={href(a)} tabIndex={-1} aria-hidden="true" className="w-28 shrink-0 sm:w-32">
        <ResponsiveImage image={a.featuredImage} sizes="128px" ratio="4/3" />
      </Link>
      <div className="min-w-0">
        {showCategory && <CategoryLabel name={a.category.name} slug={a.category.slug} className="text-xs" />}
        <Tag className="text-base font-semibold leading-snug text-ink">
          <Link prefetch={false} href={href(a)} className="headline-link">
            {a.headline}
          </Link>
        </Tag>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <When a={a} />
          <Flags a={a} />
        </div>
      </div>
    </article>
  );
}

/** Wide listing row used on category, search and archive pages. */
export function ListingCard({ a }: { a: CardArticle }) {
  return (
    <article className="flex gap-4 border-b border-line py-5 first:pt-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryLabel name={a.category.name} slug={a.category.slug} />
          <Flags a={a} />
        </div>
        <h2 className="mt-1 text-xl font-bold leading-snug text-ink">
          <Link prefetch={false} href={href(a)} className="headline-link">
            {a.headline}
          </Link>
        </h2>
        <p className="mt-1.5 line-clamp-2 text-base text-[#444]">{a.summary}</p>
        <p className="mt-1.5 text-sm text-muted">
          {byline(a)} · <When a={a} relative={false} />
        </p>
      </div>
      <Link prefetch={false} href={href(a)} tabIndex={-1} aria-hidden="true" className="w-32 shrink-0 sm:w-56">
        <ResponsiveImage image={a.featuredImage} sizes="(min-width: 640px) 224px, 128px" ratio="3/2" />
      </Link>
    </article>
  );
}

/** Text-only headline with time, for fast scanning lists. */
export function HeadlineItem({ a, showCategory = true }: { a: CardArticle; showCategory?: boolean }) {
  return (
    <article className="py-3">
      <h3 className="text-base font-semibold leading-snug text-ink">
        <Link prefetch={false} href={href(a)} className="headline-link">
          {a.headline}
        </Link>
      </h3>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
        {showCategory && <span className="font-semibold text-brand">{a.category.name}</span>}
        <When a={a} />
        {a.isSample && <SampleBadge />}
      </p>
    </article>
  );
}
