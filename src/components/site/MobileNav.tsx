"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon, SearchIcon } from "../icons";
import type { NavItem } from "./NavLinks";

export function MobileNav({ items, extra }: { items: NavItem[]; extra: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("input,a,button")?.focus();
    const button = buttonRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>("a,button,input");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded text-ink hover:bg-surface lg:hidden"
      >
        <MenuIcon className="h-6 w-6" />
        <span className="sr-only">মেনু খুলুন</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="প্রধান মেনু" id="mobile-menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div ref={panelRef} className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-lg font-bold">বিভাগসমূহ</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded hover:bg-surface"
              >
                <CloseIcon className="h-6 w-6" />
                <span className="sr-only">মেনু বন্ধ করুন</span>
              </button>
            </div>
            <form action="/search" method="get" role="search" aria-label="মেনু থেকে খুঁজুন" className="flex gap-2 border-b border-line p-4">
              <label htmlFor="m-search" className="sr-only">
                খবর খুঁজুন
              </label>
              <input
                id="m-search"
                name="q"
                type="search"
                placeholder="খবর খুঁজুন…"
                className="min-w-0 flex-1 rounded border border-line px-3 py-2 text-base"
              />
              <button type="submit" className="rounded bg-brand px-3 text-white hover:bg-brand-dark">
                <SearchIcon />
                <span className="sr-only">খুঁজুন</span>
              </button>
            </form>
            <nav aria-label="মোবাইল প্রধান মেনু">
              <ul>
                {items.map((it) => (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={pathname === it.href ? "page" : undefined}
                      className={`block border-b border-line px-5 py-3 text-lg font-semibold ${
                        pathname === it.href ? "border-l-4 border-l-brand text-brand" : "text-ink"
                      }`}
                    >
                      {it.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="bg-surface py-2">
                {extra.map((it) => (
                  <li key={it.href}>
                    <Link href={it.href} className="block px-5 py-2 text-base text-muted hover:text-ink">
                      {it.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
