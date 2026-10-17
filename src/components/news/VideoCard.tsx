import Link from "next/link";
import type { Media, Video } from "@prisma/client";
import { ResponsiveImage } from "./ResponsiveImage";
import { SampleBadge } from "./Labels";
import { PlayIcon } from "../icons";
import { formatDateShort } from "@/lib/format";
import { youtubeThumb } from "@/lib/youtube";

export function VideoCard({ v, dark = false }: { v: Video & { thumbnail: Media | null }; dark?: boolean }) {
  return (
    <article>
      <Link prefetch={false} href={`/video/${v.slug}`} className="group block" tabIndex={-1} aria-hidden="true">
        <div className="relative">
          {v.thumbnail ? (
            <ResponsiveImage image={v.thumbnail} sizes="(min-width: 1024px) 300px, 50vw" />
          ) : v.youtubeId ? (
            <div className="aspect-video w-full overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element -- YouTube-hosted thumbnail */}
              <img src={youtubeThumb(v.youtubeId)} alt="" loading="lazy" width={480} height={360} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="aspect-video w-full bg-[#222]" />
          )}
          <span className="absolute bottom-2 left-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white group-hover:bg-brand-dark">
            <PlayIcon />
          </span>
        </div>
      </Link>
      <h3 className={`mt-2 text-[1.05rem] font-semibold leading-snug ${dark ? "text-white" : "text-ink"}`}>
        <Link prefetch={false} href={`/video/${v.slug}`} className="headline-link">
          {v.title}
        </Link>
      </h3>
      <p className={`mt-1 flex items-center gap-2 text-sm ${dark ? "text-[#bbb]" : "text-muted"}`}>
        {v.publishedAt && <time dateTime={v.publishedAt.toISOString()}>{formatDateShort(v.publishedAt)}</time>}
        {v.isSample && <SampleBadge />}
      </p>
    </article>
  );
}
