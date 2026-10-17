import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cache } from "react";
import { db } from "@/lib/db";
import { getCategoryArticles, countCategoryArticles, pageParam } from "@/lib/queries";
import { PAGE_SIZE } from "@/lib/constants";
import { toBnDigits } from "@/lib/format";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Pagination } from "@/components/site/Pagination";
import { AdSlot } from "@/components/site/AdSlot";
import { LeadCard, ListingCard } from "@/components/news/ArticleCard";

const getCategory = cache((slug: string) =>
  db.category.findUnique({
    where: { slug: decodeURIComponent(slug) },
    include: { parent: true, children: { orderBy: { order: "asc" } } },
  }),
);

export async function generateMetadata({ params, searchParams }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = pageParam((await searchParams).page);
  const c = await getCategory(slug);
  if (!c) return { title: "বিভাগ পাওয়া যায়নি" };
  const suffix = page > 1 ? ` — পাতা ${toBnDigits(page)}` : "";
  return {
    title: `${c.name}${suffix}`,
    description: c.description || `${c.name} বিভাগের সর্বশেষ সংবাদ, বিশ্লেষণ ও প্রতিবেদন।`,
    alternates: { canonical: page > 1 ? `/category/${c.slug}?page=${page}` : `/category/${c.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const page = pageParam((await searchParams).page);
  const c = await getCategory(slug);
  if (!c) notFound();

  const total = await countCategoryArticles(c.id);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages && total > 0) notFound();
  const items = await getCategoryArticles(c.id, PAGE_SIZE, [], (page - 1) * PAGE_SIZE);
  const [lead, ...rest] = page === 1 ? items : [null, ...items];

  const crumbs = [
    { name: "প্রচ্ছদ", path: "/" },
    ...(c.parent ? [{ name: c.parent.name, path: `/category/${c.parent.slug}` }] : []),
    { name: c.name, path: `/category/${c.slug}` },
  ];
  const siblings = c.children.length ? c.children : [];

  return (
    <main className="mx-auto max-w-7xl px-4 pt-5">
      <Breadcrumbs items={crumbs} />
      <header className="mt-4 border-b-2 border-ink pb-3">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">
          <span className="mr-3 inline-block h-7 w-2 bg-brand align-[-3px]" aria-hidden="true" />
          {c.name}
          {page > 1 && <span className="ml-2 text-xl font-normal text-muted">— পাতা {toBnDigits(page)}</span>}
        </h1>
        {c.description && <p className="mt-2 max-w-3xl text-lg text-muted">{c.description}</p>}
        {siblings.length > 0 && (
          <nav aria-label={`${c.name} উপবিভাগ`} className="mt-3">
            <ul className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/category/${s.slug}`}
                    className="inline-block rounded-full border border-line px-3 py-1 text-sm font-semibold hover:border-brand hover:text-brand"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {items.length === 0 ? (
        <p className="py-16 text-center text-lg text-muted">এই বিভাগে এখনও কোনো সংবাদ প্রকাশিত হয়নি।</p>
      ) : (
        <div className="mt-6 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {lead && (
              <div className="mb-8 border-b border-line pb-8">
                <LeadCard a={lead} />
              </div>
            )}
            <h2 className="sr-only">{c.name} বিভাগের সংবাদ তালিকা</h2>
            <div>
              {rest.map((a, i) => (
                <div key={a!.id}>
                  <ListingCard a={a!} />
                  {i === 3 && <AdSlot placement="mobile" />}
                </div>
              ))}
            </div>
            <Pagination basePath={`/category/${c.slug}`} page={page} totalPages={totalPages} />
          </div>
          <aside className="lg:col-span-4" aria-label="সাইডবার">
            <AdSlot placement="category" />
          </aside>
        </div>
      )}
    </main>
  );
}
