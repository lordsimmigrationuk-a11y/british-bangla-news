import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isEditorOrAbove } from "@/lib/permissions";
import { ARTICLE_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { pageParam } from "@/lib/queries";
import { PageHeader, LinkButton, StatusBadge, Notice, inputCls } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";
import { SampleBadge } from "@/components/news/Labels";

export const metadata: Metadata = { title: "সংবাদ" };
const PER = 25;

export default async function ArticlesAdmin({ searchParams }: PageProps<"/admin/articles">) {
  const user = await requireUser();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (ARTICLE_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const flag = typeof sp.flag === "string" ? sp.flag : "";
  const page = pageParam(sp.page);

  const where: Prisma.ArticleWhereInput = {
    ...(isEditorOrAbove(user) ? {} : { authorId: user.id }),
    ...(status ? { status } : {}),
    ...(q ? { headline: { contains: q } } : {}),
    ...(flag === "breaking"
      ? { isBreaking: true }
      : flag === "pick"
        ? { isEditorsPick: true }
        : flag === "sample"
          ? { isSample: true }
          : {}),
  };
  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: PER,
      skip: (page - 1) * PER,
      include: { category: true, author: { select: { name: true } } },
    }),
    db.article.count({ where }),
  ]);
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (q) params.q = q;
  if (flag) params.flag = flag;

  return (
    <>
      <PageHeader
        title={isEditorOrAbove(user) ? "সব সংবাদ" : "আমার লেখা"}
        actions={<LinkButton href="/admin/articles/new">নতুন সংবাদ</LinkButton>}
      >
        মোট {total}টি
      </PageHeader>
      {sp.done === "deleted" && <Notice>সংবাদটি মুছে ফেলা হয়েছে।</Notice>}
      <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
        <div>
          <label htmlFor="f-q" className="text-sm font-semibold">
            শিরোনামে খুঁজুন
          </label>
          <input id="f-q" name="q" defaultValue={q} className={inputCls} />
        </div>
        <div>
          <label htmlFor="f-status" className="text-sm font-semibold">
            অবস্থা
          </label>
          <select id="f-status" name="status" defaultValue={status} className={inputCls}>
            <option value="">সব</option>
            {ARTICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-flag" className="text-sm font-semibold">
            চিহ্ন
          </label>
          <select id="f-flag" name="flag" defaultValue={flag} className={inputCls}>
            <option value="">সব</option>
            <option value="breaking">ব্রেকিং</option>
            <option value="pick">সম্পাদকীয় নির্বাচন</option>
            <option value="sample">নমুনা কনটেন্ট</option>
          </select>
        </div>
        <button className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white">ফিল্টার</button>
      </form>
      <div className="overflow-x-auto rounded border border-line bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line bg-surface">
            <tr>
              <th scope="col" className="px-3 py-2">
                শিরোনাম
              </th>
              <th scope="col" className="px-3 py-2">
                অবস্থা
              </th>
              <th scope="col" className="px-3 py-2">
                বিভাগ
              </th>
              <th scope="col" className="px-3 py-2">
                লেখক
              </th>
              <th scope="col" className="px-3 py-2">
                শেষ পরিবর্তন
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/articles/${a.id}`} className="font-semibold hover:text-brand hover:underline">
                    {a.headline}
                  </Link>
                  <span className="ml-2 inline-flex gap-1 align-middle">
                    {a.isBreaking && <span className="rounded bg-brand px-1.5 text-xs text-white">ব্রেকিং</span>}
                    {a.isSample && <SampleBadge />}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-3 py-2.5">{a.category.name}</td>
                <td className="px-3 py-2.5">{a.bylineOverride || a.author.name}</td>
                <td className="px-3 py-2.5 whitespace-nowrap text-muted">{formatDateTime(a.updatedAt)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  কোনো সংবাদ পাওয়া যায়নি।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination basePath="/admin/articles" page={page} totalPages={Math.max(1, Math.ceil(total / PER))} params={params} />
    </>
  );
}
