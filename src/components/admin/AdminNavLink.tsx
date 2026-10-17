"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const p = usePathname();
  const active =
    href === "/admin"
      ? p === "/admin"
      : p === href ||
        (p.startsWith(href + "/") && href !== "/admin/articles") ||
        (href === "/admin/articles" && p.startsWith("/admin/articles/") && !p.endsWith("/new"));
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block rounded px-3 py-2 text-sm font-semibold ${active ? "bg-brand text-white" : "text-white/85 hover:bg-white/10"}`}
    >
      {children}
    </Link>
  );
}
