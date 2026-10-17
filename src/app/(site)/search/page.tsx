import type { Metadata } from "next";
import { normaliseQuery, pageParam, searchArticles } from "@/lib/queries";
import { PAGE_SIZE } from "@/lib/constants";
import { toBnDigits } from "@/lib/format";
import { ListingCard } from "@/components/news/ArticleCard";
import { Pagination } from "@/components/site/Pagination";
import { SearchIcon } from "@/components/icons";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = normaliseQuery((await searchParams).q);
  return {
    title: q ? `“${q}” — অনুসন্ধানের ফলাফল` : "অনুসন্ধান",
    robots: { index: false, follow: true },
    alternates: { canonical: "/search" },
  };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = normaliseQuery(sp.q);
  const page = pageParam(sp.page);
  const result = q.length >= 2 ? await searchArticles(q, page) : null;
  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 0;

  return (
    <main className="mx-auto max-w-4xl px-4 pt-8">
      <h1 className="text-3xl font-bold">অনুসন্ধান</h1>
      <form action="/search" method="get" role="search" aria-label="অনুসন্ধান ফর্ম" className="mt-4 flex gap-2">
        <label htmlFor="q" className="sr-only">
          শিরোনাম বা বিষয়বস্তু লিখুন
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="শিরোনাম বা বিষয়বস্তু লিখুন…"
          className="min-w-0 flex-1 rounded border border-[#9ca3af] px-4 py-3 text-lg focus:border-ink"
          autoFocus={!q}
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded bg-brand px-5 text-lg font-semibold text-white hover:bg-brand-dark"
        >
          <SearchIcon />
          খুঁজুন
        </button>
      </form>

      <div className="mt-8" aria-live="polite">
        {!q && <p className="text-lg text-muted">খবর খুঁজতে উপরের ঘরে বাংলা বা ইংরেজিতে শব্দ লিখুন।</p>}
        {q && q.length < 2 && <p className="text-lg text-muted">অনুগ্রহ করে কমপক্ষে দুটি অক্ষর লিখুন।</p>}
        {result && result.total === 0 && (
          <div className="border border-line bg-surface p-6">
            <p className="text-lg font-semibold">“{q}” লিখে কোনো সংবাদ পাওয়া যায়নি।</p>
            <ul className="mt-2 list-disc pl-6 text-muted">
              <li>বানান ঠিক আছে কিনা দেখুন।</li>
              <li>আরও সাধারণ বা কম শব্দ ব্যবহার করুন।</li>
              <li>বিভাগ থেকে খবর দেখুন।</li>
            </ul>
          </div>
        )}
        {result && result.total > 0 && (
          <>
            <p className="mb-4 text-muted">
              “{q}” — মোট {toBnDigits(result.total)}টি ফলাফল
              {totalPages > 1 && ` · পাতা ${toBnDigits(page)}/${toBnDigits(totalPages)}`}
            </p>
            <div>
              {result.items.map((a) => (
                <ListingCard key={a.id} a={a} />
              ))}
            </div>
            <Pagination basePath="/search" page={page} totalPages={totalPages} params={{ q }} />
          </>
        )}
      </div>
    </main>
  );
}
