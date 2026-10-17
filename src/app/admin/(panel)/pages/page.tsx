import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "তথ্য পাতা" };

export default async function PagesAdmin() {
  await requireUser(["ADMIN", "EDITOR"]);
  const pages = await db.page.findMany({ orderBy: { title: "asc" } });
  return (
    <>
      <PageHeader title="তথ্য পাতা">
        আমাদের সম্পর্কে, নীতিমালা ও যোগাযোগের পাতা। ‘খসড়া’ চিহ্নিত পাতায় পাঠকদের একটি নোটিশ দেখানো হয়।
      </PageHeader>
      <ul className="divide-y divide-line rounded border border-line bg-white">
        {pages.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <Link href={`/admin/pages/${p.id}`} className="font-semibold hover:underline">
                {p.title}
              </Link>
              <p className="text-xs text-muted">
                /{p.slug} · {formatDateTime(p.updatedAt)}
              </p>
            </div>
            {p.isPlaceholder ? (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">খসড়া তথ্য</span>
            ) : (
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-900">যাচাই করা</span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
