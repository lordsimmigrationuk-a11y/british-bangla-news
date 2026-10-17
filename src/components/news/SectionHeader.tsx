import Link from "next/link";
import { ChevronRight } from "../icons";

export function SectionHeader({ title, href, id, as: Tag = "h2" }: { title: string; href?: string; id?: string; as?: "h2" | "h3" }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b-2 border-ink pb-1.5">
      <Tag
        id={id}
        className="relative text-xl font-bold text-ink before:mr-2 before:inline-block before:h-4 before:w-1.5 before:bg-brand before:align-[-1px] before:content-['']"
      >
        {href ? (
          <Link href={href} className="hover:text-brand">
            {title}
          </Link>
        ) : (
          title
        )}
      </Tag>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-brand hover:text-brand-dark hover:underline"
        >
          সব খবর দেখুন
          <span className="sr-only"> ({title})</span>
          <ChevronRight />
        </Link>
      )}
    </div>
  );
}
