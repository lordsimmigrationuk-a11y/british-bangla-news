import Link from "next/link";

export function SampleBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-sm border border-amber-600/40 bg-amber-50 px-1.5 text-xs font-semibold leading-5 text-amber-900 ${className}`}
      title="এটি নমুনা কনটেন্ট, প্রকৃত সংবাদ নয়"
    >
      নমুনা
    </span>
  );
}

export function SponsoredLabel({ sponsor }: { sponsor?: string | null }) {
  return (
    <span className="inline-block rounded-sm bg-ink px-1.5 text-xs font-semibold leading-5 text-white">
      স্পনসরড{sponsor ? ` · ${sponsor}` : ""}
    </span>
  );
}

export function CategoryLabel({ name, slug, className = "" }: { name: string; slug: string; className?: string }) {
  return (
    <Link
      prefetch={false}
      href={`/category/${slug}`}
      className={`text-sm font-semibold text-brand hover:text-brand-dark hover:underline ${className}`}
    >
      {name}
    </Link>
  );
}
