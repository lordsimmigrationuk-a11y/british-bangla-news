import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { PageHeader, LinkButton, StatusBadge } from "@/components/admin/ui";

export const metadata: Metadata = { title: "ভিডিও" };

export default async function VideosAdmin() {
  await requireUser(["ADMIN", "EDITOR"]);
  const items = await db.video.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <>
      <PageHeader title="ভিডিও সংবাদ" actions={<LinkButton href="/admin/videos/new">নতুন ভিডিও</LinkButton>} />
      <ul className="divide-y divide-line rounded border border-line bg-white">
        {items.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <Link href={`/admin/videos/${v.id}`} className="font-semibold hover:underline">
                {v.title}
              </Link>
              <p className="text-xs text-muted">
                {v.youtubeId ? "YouTube" : "আপলোড করা ফাইল"} · {formatDateTime(v.updatedAt)}
              </p>
            </div>
            <StatusBadge status={v.status} />
          </li>
        ))}
        {items.length === 0 && <li className="px-4 py-8 text-center text-muted">কোনো ভিডিও নেই।</li>}
      </ul>
    </>
  );
}
