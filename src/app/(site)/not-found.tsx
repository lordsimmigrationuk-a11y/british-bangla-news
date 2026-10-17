import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-6xl font-bold text-brand">৪০৪</p>
      <h1 className="mt-4 text-3xl font-bold">পাতাটি পাওয়া যায়নি</h1>
      <p className="mt-3 text-lg text-muted">আপনি যে পাতাটি খুঁজছেন সেটি সরানো হয়েছে বা কখনও ছিল না।</p>
      <form action="/search" method="get" role="search" className="mx-auto mt-6 flex max-w-md gap-2">
        <label htmlFor="nf-q" className="sr-only">
          খবর খুঁজুন
        </label>
        <input
          id="nf-q"
          name="q"
          type="search"
          placeholder="খবর খুঁজুন…"
          className="min-w-0 flex-1 rounded border border-[#9ca3af] px-3 py-2"
        />
        <button className="rounded bg-brand px-4 font-semibold text-white hover:bg-brand-dark">খুঁজুন</button>
      </form>
      <Link href="/" className="mt-6 inline-block font-semibold text-brand-dark underline">
        প্রচ্ছদে ফিরে যান
      </Link>
    </main>
  );
}
