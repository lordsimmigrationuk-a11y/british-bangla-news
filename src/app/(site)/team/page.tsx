import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { StaticPage } from "@/components/site/StaticPage";
import { ResponsiveImage } from "@/components/news/ResponsiveImage";
import { SampleBadge } from "@/components/news/Labels";

export const metadata: Metadata = { title: "আমাদের টিম", alternates: { canonical: "/team" } };

export default async function TeamPage() {
  const people = await db.user.findMany({
    where: { active: true, showOnTeam: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: { avatar: true },
  });
  return (
    <StaticPage slug="team">
      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {people.map((p) => (
          <li key={p.id} className="flex gap-4 border border-line p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface">
              {p.avatar && <ResponsiveImage image={p.avatar} sizes="64px" ratio="1/1" alt="" />}
            </div>
            <div>
              <p className="text-lg font-bold">
                <Link href={`/author/${p.slug}`} className="hover:text-brand hover:underline">
                  {p.name}
                </Link>
              </p>
              {p.designation && <p className="text-sm text-muted">{p.designation}</p>}
              {p.isSample && <SampleBadge className="mt-1" />}
              {p.bio && <p className="mt-2 text-base leading-relaxed">{p.bio}</p>}
            </div>
          </li>
        ))}
      </ul>
    </StaticPage>
  );
}
