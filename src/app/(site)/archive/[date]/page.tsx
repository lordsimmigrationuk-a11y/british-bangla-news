import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { cardInclude, liveWhere, pageParam } from "@/lib/queries";
import { formatDateLong, zonedDayRange } from "@/lib/format";
import { ArticleList } from "@/components/news/ArticleList";

const PER_PAGE = 30;

function parse(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return zonedDayRange(date);
}

export async function generateMetadata({ params }: PageProps<"/archive/[date]">): Promise<Metadata> {
  const { date } = await params;
  const r = parse(date);
  if (!r) return { title: "আর্কাইভ" };
  return { title: `${formatDateLong(r.start)} — আর্কাইভ`, alternates: { canonical: `/archive/${date}` } };
}

export default async function ArchiveDayPage({ params, searchParams }: PageProps<"/archive/[date]">) {
  const { date } = await params;
  const page = pageParam((await searchParams).page);
  const r = parse(date);
  if (!r) notFound();
  const where = { AND: [liveWhere(), { publishedAt: { gte: r.start, lt: r.end } }] };
  const [items, total] = await Promise.all([
    db.article.findMany({ where, orderBy: { publishedAt: "desc" }, take: PER_PAGE, skip: (page - 1) * PER_PAGE, include: cardInclude }),
    db.article.count({ where }),
  ]);
  const label = formatDateLong(r.start);
  return (
    <ArticleList
      title={label}
      intro="এই দিনে প্রকাশিত সংবাদ (বাংলাদেশ সময়)"
      items={items}
      basePath={`/archive/${date}`}
      page={page}
      totalPages={Math.max(1, Math.ceil(total / PER_PAGE))}
      crumbs={[
        { name: "প্রচ্ছদ", path: "/" },
        { name: "আর্কাইভ", path: "/archive" },
        { name: label, path: `/archive/${date}` },
      ]}
      empty="এই তারিখে কোনো সংবাদ প্রকাশিত হয়নি।"
    />
  );
}
