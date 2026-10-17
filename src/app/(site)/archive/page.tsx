import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { zonedDateKey, formatDateLong, zonedDayRange } from "@/lib/format";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const metadata: Metadata = { title: "আর্কাইভ", alternates: { canonical: "/archive" } };

export default async function ArchivePage({ searchParams }: PageProps<"/archive">) {
  const { date } = await searchParams;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) redirect(`/archive/${date}`);
  const today = zonedDateKey(new Date());
  const recent = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    return d.toISOString().slice(0, 10);
  });
  return (
    <main className="mx-auto max-w-4xl px-4 pt-5">
      <Breadcrumbs
        items={[
          { name: "প্রচ্ছদ", path: "/" },
          { name: "আর্কাইভ", path: "/archive" },
        ]}
      />
      <h1 className="mt-4 border-b-2 border-ink pb-3 text-3xl font-bold sm:text-4xl">আর্কাইভ</h1>
      <form action="/archive" method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="date" className="block text-base font-semibold">
            তারিখ বেছে নিন
          </label>
          <input
            id="date"
            name="date"
            type="date"
            max={today}
            defaultValue={today}
            required
            className="mt-1 rounded border border-[#9ca3af] px-3 py-2 text-base"
          />
        </div>
        <button type="submit" className="rounded bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-dark">
          দেখুন
        </button>
      </form>
      <h2 className="mt-10 text-xl font-bold">সাম্প্রতিক দিনগুলো</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {recent.map((d) => (
          <li key={d}>
            <Link href={`/archive/${d}`} className="block border border-line px-4 py-2 hover:border-brand hover:text-brand">
              {formatDateLong(zonedDayRange(d)!.start)}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
