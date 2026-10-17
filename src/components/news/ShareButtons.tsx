"use client";

import { useState } from "react";
import { LinkIcon, MailIcon, ShareIcon, SocialIcon } from "../icons";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { key: "facebook" as const, label: "Facebook-এ শেয়ার করুন", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: "x" as const, label: "X-এ শেয়ার করুন", href: `https://x.com/intent/post?url=${u}&text=${t}` },
    { key: "whatsapp" as const, label: "WhatsApp-এ শেয়ার করুন", href: `https://wa.me/?text=${t}%20${u}` },
  ];
  const btn =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink hover:border-brand hover:text-brand";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("লিংকটি কপি করুন", url);
    }
  }

  async function nativeShare() {
    if (!("share" in navigator)) return copy();
    try {
      await navigator.share({ title, url });
    } catch {
      /* dismissed */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-muted">শেয়ার:</span>
      {links.map((l) => (
        <a key={l.key} href={l.href} target="_blank" rel="noopener noreferrer" className={btn}>
          <SocialIcon name={l.key} />
          <span className="sr-only">{l.label}</span>
        </a>
      ))}
      <a href={`mailto:?subject=${t}&body=${u}`} className={btn}>
        <MailIcon className="h-4 w-4" />
        <span className="sr-only">ইমেইলে পাঠান</span>
      </a>
      <button type="button" onClick={copy} className={btn}>
        <LinkIcon className="h-4 w-4" />
        <span className="sr-only">লিংক কপি করুন</span>
      </button>
      <button type="button" onClick={nativeShare} className={`${btn} sm:hidden`}>
        <ShareIcon className="h-4 w-4" />
        <span className="sr-only">অন্যান্য অ্যাপে শেয়ার</span>
      </button>
      <span role="status" aria-live="polite" className="text-sm text-green-700">
        {copied ? "লিংক কপি হয়েছে" : ""}
      </span>
    </div>
  );
}
