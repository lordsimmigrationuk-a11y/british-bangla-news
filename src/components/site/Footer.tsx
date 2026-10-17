import Link from "next/link";
import { getNavCategories } from "@/lib/queries";
import { getSettings, socialLinks } from "@/lib/settings";
import { SocialIcon } from "../icons";

const ABOUT_LINKS = [
  { name: "আমাদের সম্পর্কে", href: "/about" },
  { name: "আমাদের টিম", href: "/team" },
  { name: "যোগাযোগ", href: "/contact" },
  { name: "বিজ্ঞাপন দিন", href: "/advertise" },
];
const POLICY_LINKS = [
  { name: "সম্পাদকীয় নীতিমালা", href: "/editorial-policy" },
  { name: "সংশোধন নীতিমালা", href: "/corrections" },
  { name: "গোপনীয়তা নীতি", href: "/privacy" },
  { name: "শর্তাবলি", href: "/terms" },
];

export async function Footer() {
  const [cats, s] = await Promise.all([getNavCategories(), getSettings()]);
  const socials = socialLinks(s);
  const year = new Date().getFullYear();
  return (
    <footer className="on-dark mt-16 bg-footer text-[#d1d5db]">
      <div className="h-1 bg-brand" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Link prefetch={false} href="/" className="inline-flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
            <img src="/brand/logo-160.webp" alt={s.siteNameEn} width={64} height={64} loading="lazy" className="h-16 w-16" />
            <span className="text-xl font-bold text-white">{s.siteNameBn}</span>
          </Link>
          <p className="mt-4 max-w-sm text-base leading-relaxed">{s.tagline}</p>
          {socials.length > 0 && (
            <ul className="mt-5 flex gap-2" aria-label="সামাজিক যোগাযোগমাধ্যম">
              {socials.map((l) => (
                <li key={l.key}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-brand"
                  >
                    <SocialIcon name={l.key} />
                    <span className="sr-only">{l.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="md:col-span-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">বিভাগ</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {cats.map((c) => (
              <li key={c.id}>
                <Link prefetch={false} href={`/category/${c.slug}`} className="hover:text-white hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link prefetch={false} href="/video" className="hover:text-white hover:underline">
                ভিডিও
              </Link>
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-6 md:col-span-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-white">প্রতিষ্ঠান</h2>
            <ul className="mt-3 space-y-1.5">
              {ABOUT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link prefetch={false} href={l.href} className="hover:text-white hover:underline">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-white">নীতিমালা</h2>
            <ul className="mt-3 space-y-1.5">
              {POLICY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link prefetch={false} href={l.href} className="hover:text-white hover:underline">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} <span lang="en">{s.siteNameEn}</span>. সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="flex gap-4">
            <Link prefetch={false} href="/corrections" className="hover:text-white hover:underline">
              ভুল জানান
            </Link>
            <a href="/feed.xml" className="hover:text-white hover:underline">
              RSS
            </a>
            <Link href="/sitemap.xml" prefetch={false} className="hover:text-white hover:underline">
              সাইটম্যাপ
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
