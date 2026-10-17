import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { cardInclude, liveWhere, pageParam } from "@/lib/queries";
import { PAGE_SIZE } from "@/lib/constants";
import { ArticleList } from "@/components/news/ArticleList";
import { ResponsiveImage } from "@/components/news/ResponsiveImage";
import { JsonLd } from "@/components/site/JsonLd";
import { absoluteUrl } from "@/lib/env";

const getAuthor = cache((slug: string) =>
  db.user.findFirst({ where: { slug: decodeURIComponent(slug), active: true }, include: { avatar: true } }),
);

export async function generateMetadata({ params, searchParams }: PageProps<"/author/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = pageParam((await searchParams).page);
  const u = await getAuthor(slug);
  if (!u) return { title: "লেখক পাওয়া যায়নি" };
  return {
    title: u.name,
    description: u.bio || `${u.name}-এর লেখা সংবাদ ও প্রতিবেদন।`,
    alternates: { canonical: page > 1 ? `/author/${u.slug}?page=${page}` : `/author/${u.slug}` },
    robots: u.isSample ? { index: false } : undefined,
  };
}

export default async function AuthorPage({ params, searchParams }: PageProps<"/author/[slug]">) {
  const { slug } = await params;
  const page = pageParam((await searchParams).page);
  const u = await getAuthor(slug);
  if (!u) notFound();
  const where = { ...liveWhere(), authorId: u.id, bylineOverride: null };
  const [items, total] = await Promise.all([
    db.article.findMany({ where, orderBy: { publishedAt: "desc" }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, include: cardInclude }),
    db.article.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <ArticleList
      title={u.name}
      intro={u.designation}
      items={items}
      basePath={`/author/${u.slug}`}
      page={page}
      totalPages={totalPages}
      crumbs={[
        { name: "প্রচ্ছদ", path: "/" },
        { name: "আমাদের টিম", path: "/team" },
        { name: u.name, path: `/author/${u.slug}` },
      ]}
      empty="এই লেখকের কোনো প্রকাশিত লেখা এখনও নেই।"
    >
      {!u.isSample && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: {
              "@type": "Person",
              name: u.name,
              url: absoluteUrl(`/author/${u.slug}`),
              ...(u.designation ? { jobTitle: u.designation } : {}),
            },
          }}
        />
      )}
      {(u.bio || u.avatar) && (
        <section className="mt-5 flex gap-4 bg-surface p-5" aria-label="লেখক পরিচিতি">
          {u.avatar && (
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full">
              <ResponsiveImage image={u.avatar} sizes="80px" ratio="1/1" alt="" />
            </div>
          )}
          {u.bio && <p className="text-base leading-relaxed">{u.bio}</p>}
        </section>
      )}
    </ArticleList>
  );
}
