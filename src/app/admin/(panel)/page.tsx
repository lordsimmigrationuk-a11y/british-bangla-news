import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, isEditorOrAbove } from "@/lib/permissions";
import { STATUS_LABELS, ARTICLE_STATUSES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { siteUrl } from "@/lib/env";
import { getSettings, socialLinks } from "@/lib/settings";
import { PageHeader, LinkButton, StatusBadge, Notice, Card } from "@/components/admin/ui";

export const metadata: Metadata = { title: "ড্যাশবোর্ড" };

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const editor = isEditorOrAbove(user);
  const scope = editor ? {} : { authorId: user.id };

  const [counts, review, mine, scheduled, sampleCount, placeholderPages, settings] = await Promise.all([
    db.article.groupBy({ by: ["status"], where: scope, _count: true }),
    editor
      ? db.article.findMany({
          where: { status: "REVIEW" },
          orderBy: { updatedAt: "desc" },
          take: 10,
          include: { author: { select: { name: true } } },
        })
      : Promise.resolve([]),
    db.article.findMany({ where: { authorId: user.id, status: { in: ["DRAFT", "REVIEW"] } }, orderBy: { updatedAt: "desc" }, take: 8 }),
    db.article.findMany({
      where: { ...scope, status: "SCHEDULED", publishedAt: { gt: new Date() } },
      orderBy: { publishedAt: "asc" },
      take: 8,
    }),
    db.article.count({ where: { isSample: true } }),
    db.page.count({ where: { isPlaceholder: true } }),
    getSettings(),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  const launch = [
    { ok: sampleCount === 0, text: `নমুনা কনটেন্ট মুছে ফেলা হয়েছে (${sampleCount}টি বাকি)`, href: "/admin/settings#sample" },
    { ok: placeholderPages === 0, text: `তথ্য পাতাগুলো যাচাই করা তথ্যে হালনাগাদ (${placeholderPages}টি খসড়া)`, href: "/admin/pages" },
    { ok: siteUrl().startsWith("https://") && !siteUrl().includes("localhost"), text: "SITE_URL প্রকৃত ডোমেইনে সেট করা", href: null },
    { ok: socialLinks(settings).length > 0, text: "সামাজিক যোগাযোগমাধ্যমের লিংক যোগ করা", href: "/admin/settings" },
    { ok: settings.contactEmail.includes("@"), text: "যোগাযোগের ইমেইল দেওয়া", href: "/admin/settings" },
    { ok: Boolean(settings.googleSiteVerification), text: "Google Search Console যাচাই কোড দেওয়া", href: "/admin/settings" },
  ];

  return (
    <>
      <PageHeader title={`স্বাগতম, ${user.name}`} actions={<LinkButton href="/admin/articles/new">নতুন সংবাদ লিখুন</LinkButton>} />
      {denied && <Notice tone="error">ওই পাতাটি দেখার অনুমতি আপনার নেই।</Notice>}

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ARTICLE_STATUSES.map((s) => (
          <Link key={s} href={`/admin/articles?status=${s}`} className="rounded border border-line bg-white p-4 hover:border-ink">
            <p className="text-sm text-muted">{STATUS_LABELS[s]}</p>
            <p className="text-3xl font-bold">{count(s)}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {editor && (
          <Card title="পর্যালোচনার অপেক্ষায়">
            {review.length === 0 ? (
              <p className="text-sm text-muted">কোনো লেখা অপেক্ষায় নেই।</p>
            ) : (
              <ul className="divide-y divide-line">
                {review.map((a) => (
                  <li key={a.id} className="py-2">
                    <Link href={`/admin/articles/${a.id}`} className="font-semibold hover:underline">
                      {a.headline}
                    </Link>
                    <p className="text-xs text-muted">
                      {a.author.name} · {formatDateTime(a.updatedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        <Card title="আমার খসড়া">
          {mine.length === 0 ? (
            <p className="text-sm text-muted">কোনো খসড়া নেই।</p>
          ) : (
            <ul className="divide-y divide-line">
              {mine.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                  <Link href={`/admin/articles/${a.id}`} className="font-semibold hover:underline">
                    {a.headline}
                  </Link>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="নির্ধারিত প্রকাশ">
          {scheduled.length === 0 ? (
            <p className="text-sm text-muted">কিছু নির্ধারিত নেই।</p>
          ) : (
            <ul className="divide-y divide-line">
              {scheduled.map((a) => (
                <li key={a.id} className="py-2">
                  <Link href={`/admin/articles/${a.id}`} className="font-semibold hover:underline">
                    {a.headline}
                  </Link>
                  <p className="text-xs text-muted">{formatDateTime(a.publishedAt!)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {isAdmin(user) && (
          <Card title="প্রকাশের আগে যা করতে হবে">
            <ul className="space-y-2 text-sm">
              {launch.map((l) => (
                <li key={l.text} className="flex items-start gap-2">
                  <span aria-hidden="true" className={l.ok ? "text-green-700" : "text-brand"}>
                    {l.ok ? "✓" : "○"}
                  </span>
                  <span className="sr-only">{l.ok ? "সম্পন্ন:" : "বাকি:"}</span>
                  {l.href && !l.ok ? (
                    <Link href={l.href} className="underline">
                      {l.text}
                    </Link>
                  ) : (
                    <span>{l.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
