import Link from "next/link";
import { getNavCategories, getBreaking } from "@/lib/queries";
import { getSettings, socialLinks } from "@/lib/settings";
import { formatDateLong } from "@/lib/format";
import { youtubeId } from "@/lib/youtube";
import { SearchIcon, SocialIcon } from "../icons";
import { DesktopNav, type NavItem } from "./NavLinks";
import { MobileNav } from "./MobileNav";
import { BreakingTicker } from "./BreakingTicker";

export const INFO_LINKS: NavItem[] = [
  { name: "ভিডিও", href: "/video" },
  { name: "সর্বশেষ", href: "/latest" },
  { name: "আর্কাইভ", href: "/archive" },
  { name: "আমাদের সম্পর্কে", href: "/about" },
  { name: "যোগাযোগ", href: "/contact" },
];

export async function Header() {
  const [cats, settings, breaking] = await Promise.all([getNavCategories(), getSettings(), getBreaking()]);
  const items: NavItem[] = [{ name: "প্রচ্ছদ", href: "/" }, ...cats.map((c) => ({ name: c.name, href: `/category/${c.slug}` }))];
  const socials = socialLinks(settings);
  const hasLive = Boolean(youtubeId(settings.liveStreamUrl));

  return (
    <>
      <a href="#main" className="skip-link">
        মূল বিষয়বস্তুতে যান
      </a>
      <header>
        <div className="border-b border-line bg-surface text-sm text-muted">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5">
            <p>
              <time>{formatDateLong(new Date())}</time>
              <span className="hidden sm:inline"> · বাংলাদেশ সময়</span>
            </p>
            <div className="flex items-center gap-4">
              <ul className="hidden items-center gap-4 md:flex">
                <li>
                  <Link href="/about" className="hover:text-ink">
                    আমাদের সম্পর্কে
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-ink">
                    যোগাযোগ
                  </Link>
                </li>
                <li>
                  <Link href="/advertise" className="hover:text-ink">
                    বিজ্ঞাপন
                  </Link>
                </li>
              </ul>
              {socials.length > 0 && (
                <ul className="flex items-center gap-1" aria-label="সামাজিক যোগাযোগমাধ্যম">
                  {socials.map((s) => (
                    <li key={s.key}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer me"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-white hover:text-brand"
                      >
                        <SocialIcon name={s.key} />
                        <span className="sr-only">{s.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
            <MobileNav items={items} extra={INFO_LINKS} />
            <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={`${settings.siteNameBn} — প্রচ্ছদ`}>
              <picture>
                <source srcSet="/brand/logo-160.webp 1x, /brand/logo-320.webp 2x" type="image/webp" />
                {}
                <img
                  src="/brand/logo-160.png"
                  srcSet="/brand/logo-160.png 1x, /brand/logo-320.png 2x"
                  alt={settings.siteNameEn}
                  width={80}
                  height={80}
                  className="h-14 w-14 sm:h-[4.5rem] sm:w-[4.5rem] lg:h-20 lg:w-20"
                  fetchPriority="high"
                />
              </picture>
              <span className="hidden flex-col leading-tight md:flex">
                <span className="text-2xl font-bold text-ink">{settings.siteNameBn}</span>
                <span className="text-sm text-muted">{settings.tagline}</span>
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              {hasLive && (
                <Link
                  href="/live"
                  className="hidden items-center gap-1.5 rounded border border-brand px-3 py-1.5 text-sm font-bold text-brand hover:bg-brand hover:text-white sm:inline-flex"
                >
                  <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
                  সরাসরি
                </Link>
              )}
              <form action="/search" method="get" role="search" aria-label="সাইটে খুঁজুন" className="hidden lg:flex">
                <label htmlFor="h-search" className="sr-only">
                  খবর খুঁজুন
                </label>
                <input
                  id="h-search"
                  name="q"
                  type="search"
                  placeholder="খবর খুঁজুন…"
                  className="w-56 rounded-l border border-r-0 border-line px-3 py-2 text-base focus:border-ink xl:w-64"
                />
                <button type="submit" className="rounded-r bg-ink px-3 text-white hover:bg-brand">
                  <SearchIcon />
                  <span className="sr-only">খুঁজুন</span>
                </button>
              </form>
              <Link
                href="/search"
                className="inline-flex h-11 w-11 items-center justify-center rounded text-ink hover:bg-surface lg:hidden"
              >
                <SearchIcon className="h-6 w-6" />
                <span className="sr-only">খবর খুঁজুন</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <nav aria-label="প্রধান বিভাগসমূহ" className="on-brand sticky top-0 z-40 hidden bg-brand lg:block">
        <div className="mx-auto max-w-7xl px-2">
          <DesktopNav items={items} />
        </div>
      </nav>
      {/* Compact scrolling category strip for phones and tablets; the full menu is in the drawer. */}
      <nav aria-label="বিভাগ" className="on-brand bg-brand lg:hidden">
        <div className="mx-auto max-w-7xl">
          <DesktopNav items={items} />
        </div>
      </nav>

      <BreakingTicker items={breaking} mode={settings.tickerMode === "static" ? "static" : "scroll"} />
    </>
  );
}
