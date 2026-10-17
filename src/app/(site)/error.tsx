"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">দুঃখিত, একটি সমস্যা হয়েছে</h1>
      <p className="mt-3 text-lg text-muted">পাতাটি লোড করা যায়নি। আবার চেষ্টা করুন।</p>
      <button onClick={reset} className="mt-6 rounded bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark">
        আবার চেষ্টা করুন
      </button>
    </main>
  );
}
