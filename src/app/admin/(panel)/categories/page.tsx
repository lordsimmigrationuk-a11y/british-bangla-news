import type { Metadata } from "next";
import type { Category } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { PageHeader, Notice, Card, Field, Check, inputCls } from "@/components/admin/ui";
import { saveCategory, deleteCategory } from "./actions";

export const metadata: Metadata = { title: "বিভাগ" };

function CategoryFields({ c, parents }: { c?: Category; parents: Category[] }) {
  const p = c?.id ?? "new";
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <Field label="নাম" htmlFor={`n-${p}`} className="lg:col-span-2">
        <input id={`n-${p}`} name="name" required defaultValue={c?.name} className={inputCls} />
      </Field>
      <Field label="স্লাগ (URL)" htmlFor={`s-${p}`}>
        <input id={`s-${p}`} name="slug" required defaultValue={c?.slug} className={inputCls} lang="en" />
      </Field>
      <Field label="মূল বিভাগ" htmlFor={`p-${p}`}>
        <select id={`p-${p}`} name="parentId" defaultValue={c?.parentId ?? ""} className={inputCls}>
          <option value="">নেই (প্রধান বিভাগ)</option>
          {parents
            .filter((x) => x.id !== c?.id)
            .map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
        </select>
      </Field>
      <Field label="ক্রম" htmlFor={`o-${p}`}>
        <input id={`o-${p}`} name="order" type="number" min={0} defaultValue={c?.order ?? 0} className={inputCls} />
      </Field>
      <div className="flex items-end pb-2">
        <Check name="showInNav" label="মেনুতে দেখান" defaultChecked={c?.showInNav ?? true} />
      </div>
      <Field label="বিবরণ (বিভাগের পাতায় ও সার্চ ইঞ্জিনে)" htmlFor={`d-${p}`} className="sm:col-span-2 lg:col-span-6">
        <input id={`d-${p}`} name="description" maxLength={300} defaultValue={c?.description ?? ""} className={inputCls} />
      </Field>
    </div>
  );
}

export default async function CategoriesAdmin({ searchParams }: PageProps<"/admin/categories">) {
  await requireUser(["ADMIN", "EDITOR"]);
  const { done } = await searchParams;
  const all = await db.category.findMany({ orderBy: [{ order: "asc" }], include: { _count: { select: { articles: true } } } });
  const parents = all.filter((c) => !c.parentId);
  const ordered = parents.flatMap((p) => [p, ...all.filter((c) => c.parentId === p.id)]);
  return (
    <>
      <PageHeader title="বিভাগ">প্রধান বিভাগগুলো (মেনুতে দেখানো চালু থাকলে) সাইটের নেভিগেশনে ক্রম অনুযায়ী দেখা যায়।</PageHeader>
      {done && <Notice>সংরক্ষিত হয়েছে।</Notice>}
      <div className="space-y-3">
        {ordered.map((c) => (
          <details key={c.id} className={`rounded border border-line bg-white ${c.parentId ? "ml-6" : ""}`}>
            <summary className="cursor-pointer px-4 py-3">
              <span className="font-semibold">{c.name}</span>{" "}
              <span className="text-sm text-muted">
                /{c.slug} · {c._count.articles}টি সংবাদ{c.showInNav ? "" : " · মেনুতে লুকানো"}
              </span>
            </summary>
            <div className="border-t border-line p-4">
              <ActionForm action={saveCategory}>
                <CategoryFields c={c} parents={parents} />
                <div className="mt-3">
                  <SubmitButton>সংরক্ষণ</SubmitButton>
                </div>
              </ActionForm>
              <ActionForm action={deleteCategory} className="mt-3">
                <input type="hidden" name="id" value={c.id} />
                <SubmitButton variant="danger" confirm="বিভাগটি মুছে ফেলা হবে। নিশ্চিত?">
                  বিভাগ মুছুন
                </SubmitButton>
              </ActionForm>
            </div>
          </details>
        ))}
      </div>
      <Card title="নতুন বিভাগ" className="mt-6">
        <ActionForm action={saveCategory}>
          <CategoryFields parents={parents} />
          <div className="mt-3">
            <SubmitButton>যোগ করুন</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
