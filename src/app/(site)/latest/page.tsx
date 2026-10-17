import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cardInclude, liveWhere, pageParam } from "@/lib/queries";
import { PAGE_SIZE } from "@/lib/constants";
import { ArticleList } from "@/components/news/ArticleList";

export async function generateMetadata({ searchParams }: PageProps<"/latest">): Promise<Metadata> {
  const page = pageParam((await searchParams).page);
  return {
    title: "সর্বশেষ সংবাদ",
    description: "সব বিভাগের সর্বশেষ প্রকাশিত সংবাদ, সময় অনুযায়ী সাজানো।",
    alternates: { canonical: page > 1 ? `/latest?page=${page}` : "/latest" },
  };
}

export default async function LatestPage({ searchParams }: PageProps<"/latest">) {
  const page = pageParam((await searchParams).page);
  const [items, total] = await Promise.all([
    db.article.findMany({
      where: liveWhere(),
      orderBy: { publishedAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: cardInclude,
    }),
    db.article.count({ where: liveWhere() }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) notFound();
  return (
    <ArticleList
      title="সর্বশেষ সংবাদ"
      intro="সব বিভাগের সংবাদ, সর্বশেষটি সবার আগে।"
      items={items}
      basePath="/latest"
      page={page}
      totalPages={totalPages}
      crumbs={[
        { name: "প্রচ্ছদ", path: "/" },
        { name: "সর্বশেষ", path: "/latest" },
      ]}
    />
  );
}
