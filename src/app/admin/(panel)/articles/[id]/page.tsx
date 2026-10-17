import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditArticle, isEditorOrAbove } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/format";
import { liveWhere } from "@/lib/queries";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { PageHeader, Notice, StatusBadge } from "@/components/admin/ui";
import { deleteArticle, restoreRevision } from "../actions";

export const metadata: Metadata = { title: "সংবাদ সম্পাদনা" };

const DONE: Record<string, string> = {
  save: "সংরক্ষণ করা হয়েছে।",
  submit: "পর্যালোচনার জন্য জমা দেওয়া হয়েছে। একজন সম্পাদক দেখে প্রকাশ করবেন।",
  publish: "প্রকাশিত হয়েছে।",
  schedule: "প্রকাশের সময় নির্ধারণ করা হয়েছে।",
  unpublish: "প্রকাশ প্রত্যাহার করা হয়েছে; সংবাদটি এখন খসড়া।",
  archive: "আর্কাইভ করা হয়েছে।",
  restore: "পুরোনো সংস্করণ ফিরিয়ে আনা হয়েছে।",
};

export default async function EditArticle({ params, searchParams }: PageProps<"/admin/articles/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { done } = await searchParams;
  const a = await db.article.findUnique({
    where: { id },
    include: { featuredImage: true, tags: { include: { tag: true } } },
  });
  if (!a) notFound();
  const editable = canEditArticle(user, a);
  if (!editable && a.authorId !== user.id) notFound();

  const [categories, authors, revisions, settings, isLive] = await Promise.all([
    db.category.findMany({ where: { parentId: null }, orderBy: { order: "asc" }, include: { children: { orderBy: { order: "asc" } } } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.articleRevision.findMany({
      where: { articleId: a.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { editor: { select: { name: true } } },
    }),
    getSettings(),
    db.article.count({ where: { id: a.id, ...liveWhere() } }),
  ]);

  return (
    <>
      <PageHeader
        title="সংবাদ সম্পাদনা"
        actions={
          isLive ? (
            <Link
              href={`/news/${a.slug}`}
              target="_blank"
              className="rounded border border-[#9ca3af] bg-white px-4 py-2 text-sm font-semibold hover:border-ink"
            >
              সাইটে দেখুন
            </Link>
          ) : null
        }
      >
        <StatusBadge status={a.status} /> · শেষ পরিবর্তন {formatDateTime(a.updatedAt)}
      </PageHeader>
      {typeof done === "string" && DONE[done] && <Notice>{DONE[done]}</Notice>}
      {editable ? (
        <ArticleForm article={a} user={user} categories={categories} authors={authors} isFeatured={settings.featuredArticleId === a.id} />
      ) : (
        <Notice tone="warn">
          এই সংবাদটি এখন পর্যালোচনা বা প্রকাশের পর্যায়ে আছে, তাই প্রতিবেদক হিসেবে আপনি এটি আর সম্পাদনা করতে পারবেন না। প্রয়োজন হলে
          সম্পাদকের সাথে যোগাযোগ করুন।
        </Notice>
      )}

      <section className="mt-8 rounded border border-line bg-white p-5" aria-labelledby="rev-h">
        <h2 id="rev-h" className="text-lg font-bold">
          সংস্করণের ইতিহাস
        </h2>
        <ol className="mt-3 divide-y divide-line">
          {revisions.map((r, i) => (
            <li key={r.id} className="py-3">
              <details>
                <summary className="cursor-pointer text-sm">
                  <span className="font-semibold">{formatDateTime(r.createdAt)}</span> · {r.editor?.name ?? "অজানা"} · {r.note}
                  {i === 0 && <span className="ml-2 rounded bg-surface px-1.5 text-xs">বর্তমান</span>}
                </summary>
                <div className="mt-2 rounded bg-surface p-3 text-sm">
                  <p className="font-bold">{r.headline}</p>
                  <p className="mt-1 text-muted">{r.summary}</p>
                  <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap font-[inherit]">{r.body}</pre>
                  {i > 0 && editable && (
                    <ActionForm action={restoreRevision} className="mt-2">
                      <input type="hidden" name="revisionId" value={r.id} />
                      <SubmitButton variant="secondary" confirm="শিরোনাম, সারাংশ ও মূল লেখা এই সংস্করণে ফিরিয়ে নেওয়া হবে। নিশ্চিত?">
                        এই সংস্করণ ফিরিয়ে আনুন
                      </SubmitButton>
                    </ActionForm>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ol>
      </section>

      {isEditorOrAbove(user) && (
        <section className="mt-8 rounded border border-brand/40 bg-white p-5">
          <h2 className="text-lg font-bold text-brand-dark">স্থায়ীভাবে মুছে ফেলা</h2>
          <p className="mt-1 text-sm text-muted">
            প্রকাশিত সংবাদ সাধারণত মুছে না ফেলে আর্কাইভ করা ভালো। মুছে ফেললে সংস্করণের ইতিহাসও মুছে যাবে।
          </p>
          <ActionForm action={deleteArticle} className="mt-3">
            <input type="hidden" name="id" value={a.id} />
            <SubmitButton variant="danger" confirm="এই সংবাদ ও এর সব সংস্করণ স্থায়ীভাবে মুছে যাবে। এটি ফেরানো যাবে না। নিশ্চিত?">
              মুছে ফেলুন
            </SubmitButton>
          </ActionForm>
        </section>
      )}
    </>
  );
}
