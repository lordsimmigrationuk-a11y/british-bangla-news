import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-6xl font-bold text-brand">৪০৪</p>
      <h1 className="mt-4 text-3xl font-bold">পাতাটি পাওয়া যায়নি</h1>
      <Link href="/" className="mt-6 inline-block font-semibold text-brand-dark underline">
        প্রচ্ছদে ফিরে যান
      </Link>
    </main>
  );
}
