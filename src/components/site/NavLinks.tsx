"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { name: string; href: string };

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-stretch overflow-x-auto [scrollbar-width:none]">
      {items.map((it) => {
        const active = isActive(pathname, it.href);
        return (
          <li key={it.href} className="shrink-0">
            <Link
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`block px-3 py-2.5 text-[1.02rem] font-semibold leading-6 text-white transition-colors hover:bg-brand-dark ${
                active ? "bg-brand-dark shadow-[inset_0_-3px_0_#fff]" : ""
              }`}
            >
              {it.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
