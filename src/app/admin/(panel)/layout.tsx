import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/constants";
import { isAdmin, isEditorOrAbove } from "@/lib/permissions";
import { logout } from "../login/actions";
import { AdminNavLink } from "@/components/admin/AdminNavLink";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  // Scheduled stories whose time has come are marked published (they are already visible to readers).
  await db.article.updateMany({ where: { status: "SCHEDULED", publishedAt: { lte: new Date() } }, data: { status: "PUBLISHED" } });
  const newMessages = isEditorOrAbove(user) ? await db.contactMessage.count({ where: { status: "NEW" } }) : 0;

  const links = [
    { href: "/admin", label: "ড্যাশবোর্ড", show: true },
    { href: "/admin/articles", label: "সংবাদ", show: true },
    { href: "/admin/articles/new", label: "নতুন সংবাদ", show: true },
    { href: "/admin/homepage", label: "প্রচ্ছদ ও ব্রেকিং", show: isEditorOrAbove(user) },
    { href: "/admin/categories", label: "বিভাগ", show: isEditorOrAbove(user) },
    { href: "/admin/videos", label: "ভিডিও", show: isEditorOrAbove(user) },
    { href: "/admin/pages", label: "তথ্য পাতা", show: isEditorOrAbove(user) },
    { href: "/admin/messages", label: `বার্তা${newMessages ? ` (${newMessages})` : ""}`, show: isEditorOrAbove(user) },
    { href: "/admin/users", label: "ব্যবহারকারী", show: isAdmin(user) },
    { href: "/admin/settings", label: "সেটিংস", show: isAdmin(user) },
    { href: "/admin/profile", label: "আমার প্রোফাইল", show: true },
  ].filter((l) => l.show);

  return (
    <div className="lg:flex">
      <a href="#admin-main" className="skip-link">
        মূল অংশে যান
      </a>
      <aside className="on-dark bg-ink text-white lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
          <img src="/brand/logo-96.webp" alt="" width={40} height={40} className="h-10 w-10" />
          <div className="leading-tight">
            <p className="font-bold">নিউজরুম</p>
            <p className="text-xs text-white/70">British Bangla News</p>
          </div>
        </div>
        <nav aria-label="অ্যাডমিন মেনু" className="px-2 py-3">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {links.map((l) => (
              <li key={l.href} className="shrink-0">
                <AdminNavLink href={l.href}>{l.label}</AdminNavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden border-t border-white/10 px-4 py-4 text-sm lg:block">
          <p className="font-semibold">{user.name}</p>
          <p className="text-white/70">{ROLE_LABELS[user.role]}</p>
          <div className="mt-3 flex gap-3">
            <Link href="/" className="underline" target="_blank">
              সাইট দেখুন
            </Link>
            <form action={logout}>
              <button className="underline">লগআউট</button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-line bg-white px-4 py-2 text-sm lg:hidden">
          <span>
            {user.name} · {ROLE_LABELS[user.role]}
          </span>
          <form action={logout}>
            <button className="underline">লগআউট</button>
          </form>
        </div>
        <main id="admin-main" className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
