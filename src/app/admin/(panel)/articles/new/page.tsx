import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { PageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "নতুন সংবাদ" };

export default async function NewArticle() {
  const user = await requireUser();
  const [categories, authors] = await Promise.all([
    db.category.findMany({ where: { parentId: null }, orderBy: { order: "asc" }, include: { children: { orderBy: { order: "asc" } } } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageHeader title="নতুন সংবাদ" />
      <ArticleForm article={null} user={user} categories={categories} authors={authors} isFeatured={false} />
    </>
  );
}
