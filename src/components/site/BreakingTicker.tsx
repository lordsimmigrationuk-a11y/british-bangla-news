"use client";

import Link from "next/link";
import { useState } from "react";
import { PauseIcon, PlayIcon } from "../icons";

type Item = { id: string; slug: string; headline: string };

/**
 * Breaking-news strip. Only stories an editor has flagged as breaking appear here.
 * With several items it scrolls; readers can pause it, and it never moves under
 * prefers-reduced-motion. In "static" mode it shows a plain list.
 */
export function BreakingTicker({ items, mode }: { items: Item[]; mode: "scroll" | "static" }) {
  const [paused, setPaused] = useState(false);
  if (!items.length) return null;
  const scroll = mode === "scroll" && items.length > 1;

  const list = (hidden = false) =>
    items.map((it) => (
      <li key={(hidden ? "dup-" : "") + it.id} className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
        <Link
          prefetch={false}
          href={`/news/${it.slug}`}
          tabIndex={hidden ? -1 : undefined}
          className="px-4 font-semibold text-white hover:underline"
        >
          {it.headline}
        </Link>
        <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
      </li>
    ));

  return (
    <section aria-label="ব্রেকিং নিউজ" className="on-dark bg-ink text-white">
      <div className="mx-auto flex max-w-7xl items-stretch">
        <h2 className="flex shrink-0 items-center bg-brand px-3 text-sm font-bold uppercase tracking-wide sm:px-4 sm:text-base">ব্রেকিং</h2>
        {scroll ? (
          <div className="ticker relative min-w-0 flex-1 overflow-hidden" data-paused={paused}>
            <ul
              className="ticker-track flex w-max items-center py-2.5"
              style={{ ["--ticker-duration" as string]: `${Math.max(20, items.length * 12)}s` }}
            >
              {list()}
              {list(true)}
            </ul>
          </div>
        ) : (
          <ul className="flex min-w-0 flex-1 flex-col py-2 sm:flex-row sm:flex-wrap">
            {items.map((it) => (
              <li key={it.id} className="min-w-0">
                <Link prefetch={false} href={`/news/${it.slug}`} className="block truncate px-4 py-0.5 font-semibold hover:underline">
                  {it.headline}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {scroll && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            className="flex shrink-0 items-center gap-1 border-l border-white/20 px-3 text-sm hover:bg-white/10"
          >
            {paused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon />}
            <span className="sr-only sm:not-sr-only">{paused ? "চালু" : "থামান"}</span>
          </button>
        )}
      </div>
    </section>
  );
}
