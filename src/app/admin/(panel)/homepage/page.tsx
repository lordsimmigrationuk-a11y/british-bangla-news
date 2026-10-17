import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { liveWhere } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { SECTION_KINDS, SECTION_KIND_LABELS } from "@/lib/constants";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { PageHeader, Notice, Card, Field, inputCls } from "@/components/admin/ui";
import { addSection, setBreaking, setFeatured, updateSection } from "./actions";

export const metadata: Metadata = { title: "প্রচ্ছদ ও ব্রেকিং" };

export default async function HomepageAdmin({ searchParams }: PageProps<"/admin/homepage">) {
  await requireUser(["ADMIN", "EDITOR"]);
  const { done } = await searchParams;
  const now = new Date();
  const [settings, recent, breaking, sections, categories] = await Promise.all([
    getSettings(),
    db.article.findMany({
      where: liveWhere(),
      orderBy: { publishedAt: "desc" },
      take: 60,
      select: { id: true, headline: true, publishedAt: true },
    }),
    db.article.findMany({
      where: { isBreaking: true },
      orderBy: { publishedAt: "desc" },
      select: { id: true, headline: true, breakingExpiresAt: true, status: true },
    }),
    db.homeSection.findMany({ orderBy: { order: "asc" }, include: { category: true, category2: true } }),
    db.category.findMany({ orderBy: [{ parentId: "asc" }, { order: "asc" }] }),
  ]);

  return (
    <>
      <PageHeader title="প্রচ্ছদ ও ব্রেকিং নিউজ">
        প্রধান সংবাদ, ব্রেকিং স্ট্রিপ এবং প্রচ্ছদের অংশগুলোর ক্রম এখানে নিয়ন্ত্রণ করুন।
      </PageHeader>
      {done && <Notice>পরিবর্তন সংরক্ষিত হয়েছে।</Notice>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="প্রধান সংবাদ (লিড)">
          <ActionForm action={setFeatured} className="space-y-3">
            <Field
              label="প্রচ্ছদের সবচেয়ে বড় জায়গায় যে সংবাদ থাকবে"
              htmlFor="featuredArticleId"
              hint="‘স্বয়ংক্রিয়’ বেছে নিলে সর্বশেষ প্রকাশিত সংবাদ দেখানো হবে।"
            >
              <select id="featuredArticleId" name="featuredArticleId" defaultValue={settings.featuredArticleId} className={inputCls}>
                <option value="">স্বয়ংক্রিয় (সর্বশেষ সংবাদ)</option>
                {recent.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.headline}
                  </option>
                ))}
              </select>
            </Field>
            <SubmitButton>সংরক্ষণ</SubmitButton>
          </ActionForm>
        </Card>

        <Card title="ব্রেকিং নিউজ">
          {breaking.length === 0 ? (
            <p className="text-sm text-muted">এখন কোনো ব্রেকিং নিউজ চালু নেই। ব্রেকিং স্ট্রিপ সাইটে লুকানো থাকবে।</p>
          ) : (
            <ul className="divide-y divide-line">
              {breaking.map((b) => {
                const expired = b.breakingExpiresAt && b.breakingExpiresAt <= now;
                return (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="text-sm">
                      <Link href={`/admin/articles/${b.id}`} className="font-semibold hover:underline">
                        {b.headline}
                      </Link>
                      <p className="text-xs text-muted">
                        {expired
                          ? "মেয়াদ শেষ"
                          : b.breakingExpiresAt
                            ? `চলবে ${formatDateTime(b.breakingExpiresAt)} পর্যন্ত`
                            : "বন্ধ না করা পর্যন্ত চলবে"}
                        {b.status !== "PUBLISHED" && " · প্রকাশিত নয়, তাই দেখানো হচ্ছে না"}
                      </p>
                    </div>
                    <ActionForm action={setBreaking}>
                      <input type="hidden" name="articleId" value={b.id} />
                      <input type="hidden" name="on" value="0" />
                      <SubmitButton variant="danger">বন্ধ করুন</SubmitButton>
                    </ActionForm>
                  </li>
                );
              })}
            </ul>
          )}
          <ActionForm action={setBreaking} className="mt-4 space-y-3 border-t border-line pt-4">
            <input type="hidden" name="on" value="1" />
            <Field label="ব্রেকিং হিসেবে চালু করুন" htmlFor="b-article">
              <select id="b-article" name="articleId" required className={inputCls}>
                <option value="">একটি প্রকাশিত সংবাদ বেছে নিন</option>
                {recent.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.headline}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="কত ঘণ্টা (০ = বন্ধ না করা পর্যন্ত)" htmlFor="b-hours">
              <input id="b-hours" name="hours" type="number" min={0} max={168} defaultValue={6} className={inputCls} />
            </Field>
            <SubmitButton>চালু করুন</SubmitButton>
          </ActionForm>
        </Card>
      </div>

      <Card title="প্রচ্ছদের অংশসমূহ" className="mt-6">
        <ol className="divide-y divide-line">
          {sections.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className={`font-semibold ${s.enabled ? "" : "text-muted line-through"}`}>{s.title}</p>
                <p className="text-xs text-muted">
                  {SECTION_KIND_LABELS[s.kind as keyof typeof SECTION_KIND_LABELS]}
                  {s.category && ` · ${s.category.name}`}
                  {s.category2 && ` + ${s.category2.name}`}
                </p>
              </div>
              <ActionForm action={updateSection} className="flex flex-wrap gap-1.5">
                <input type="hidden" name="id" value={s.id} />
                <SubmitButton name="op" value="up" variant="secondary" className="px-2.5">
                  <span aria-hidden="true">↑</span>
                  <span className="sr-only">উপরে সরান</span>
                </SubmitButton>
                <SubmitButton name="op" value="down" variant="secondary" className="px-2.5">
                  <span aria-hidden="true">↓</span>
                  <span className="sr-only">নিচে সরান</span>
                </SubmitButton>
                <SubmitButton name="op" value="toggle" variant="secondary">
                  {s.enabled ? "লুকান" : "দেখান"}
                </SubmitButton>
                <SubmitButton name="op" value="delete" variant="danger" confirm="অংশটি মুছে ফেলা হবে। নিশ্চিত?">
                  মুছুন
                </SubmitButton>
              </ActionForm>
            </li>
          ))}
        </ol>

        <ActionForm action={addSection} className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="ধরন" htmlFor="s-kind">
            <select id="s-kind" name="kind" className={inputCls}>
              {SECTION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {SECTION_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="শিরোনাম" htmlFor="s-title">
            <input id="s-title" name="title" required maxLength={80} className={inputCls} />
          </Field>
          <Field label="বিভাগ" htmlFor="s-cat" hint="বিভাগভিত্তিক অংশের জন্য">
            <select id="s-cat" name="categoryId" className={inputCls}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="দ্বিতীয় বিভাগ" htmlFor="s-cat2" hint="শুধু ‘দুটি বিভাগ পাশাপাশি’">
            <select id="s-cat2" name="category2Id" className={inputCls}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <SubmitButton>অংশ যোগ করুন</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
