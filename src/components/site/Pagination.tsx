import Link from "next/link";
import { toBnDigits } from "@/lib/format";

/** Plain links (crawlable) to numbered pages; `?page=N` keeps any other query parameters. */
export function Pagination({
  basePath,
  page,
  totalPages,
  params = {},
}: {
  basePath: string;
  page: number;
  totalPages: number;
  params?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams(params);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);
  const cls = "inline-flex min-w-10 h-10 items-center justify-center rounded border px-3 text-base";
  return (
    <nav aria-label="পৃষ্ঠা নম্বর" className="mt-8">
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 && (
          <li>
            <Link href={href(page - 1)} rel="prev" className={`${cls} border-line hover:border-ink`}>
              আগের পাতা
            </Link>
          </li>
        )}
        {pages.map((p) => (
          <li key={p}>
            {p === page ? (
              <span aria-current="page" className={`${cls} border-brand bg-brand font-bold text-white`}>
                {toBnDigits(p)}
              </span>
            ) : (
              <Link href={href(p)} className={`${cls} border-line hover:border-ink`}>
                {toBnDigits(p)}
              </Link>
            )}
          </li>
        ))}
        {page < totalPages && (
          <li>
            <Link href={href(page + 1)} rel="next" className={`${cls} border-line hover:border-ink`}>
              পরের পাতা
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
