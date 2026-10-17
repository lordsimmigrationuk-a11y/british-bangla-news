import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { cardInclude, liveWhere, pageParam } from "@/lib/queries";
import { PAGE_SIZE } from "@/lib/constants";
import { ArticleList } from "@/components/news/ArticleList";

const getTag = cache((slug: string) => db.tag.findUnique({ where: { slug: decodeURIComponent(slug) } }));

export async function generateMetadata({ params, searchParams }: PageProps<"/tag/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = pageParam((await searchParams).page);
  const t = await getTag(slug);
  if (!t) return { title: "ট্যাগ পাওয়া যায়নি" };
  return { title: `${t.name} — সব খবর`, alternates: { canonical: page > 1 ? `/tag/${t.slug}?page=${page}` : `/tag/${t.slug}` } };
}

export default async function TagPage({ params, searchParams }: PageProps<"/tag/[slug]">) {
  const { slug } = await params;
  const page = pageParam((await searchParams).page);
  const t = await getTag(slug);
  if (!t) notFound();
  const where = { ...liveWhere(), tags: { some: { tagId: t.id } } };
  const [items, total] = await Promise.all([
    db.article.findMany({ where, orderBy: { publishedAt: "desc" }, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, include: cardInclude }),
    db.article.count({ where }),
  ]);
  return (
    <ArticleList
      title={t.name}
      intro="এই বিষয়ের সব সংবাদ"
      items={items}
      basePath={`/tag/${t.slug}`}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
      crumbs={[
        { name: "প্রচ্ছদ", path: "/" },
        { name: t.name, path: `/tag/${t.slug}` },
      ]}
    />
  );
}
