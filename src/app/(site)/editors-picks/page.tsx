import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cardInclude, liveWhere, pageParam } from "@/lib/queries";
import { PAGE_SIZE } from "@/lib/constants";
import { ArticleList } from "@/components/news/ArticleList";

export async function generateMetadata({ searchParams }: PageProps<"/editors-picks">): Promise<Metadata> {
  const page = pageParam((await searchParams).page);
  return { title: "সম্পাদকীয় নির্বাচন", alternates: { canonical: page > 1 ? `/editors-picks?page=${page}` : "/editors-picks" } };
}

export default async function EditorsPicksPage({ searchParams }: PageProps<"/editors-picks">) {
  const page = pageParam((await searchParams).page);
  const where = { ...liveWhere(), isEditorsPick: true };
  const [items, total] = await Promise.all([
    db.article.findMany({ where, orderBy: [{ publishedAt: "desc" }], take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, include: cardInclude }),
    db.article.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages) notFound();
  return (
    <ArticleList
      title="সম্পাদকীয় নির্বাচন"
      intro="গুরুত্বপূর্ণ প্রতিবেদন, ব্যাখ্যামূলক লেখা ও মতামত, সম্পাদকদের বাছাই।"
      items={items}
      basePath="/editors-picks"
      page={page}
      totalPages={totalPages}
      crumbs={[
        { name: "প্রচ্ছদ", path: "/" },
        { name: "সম্পাদকীয় নির্বাচন", path: "/editors-picks" },
      ]}
    />
  );
}
