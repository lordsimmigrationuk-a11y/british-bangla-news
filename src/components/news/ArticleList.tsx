import type { CardArticle } from "@/lib/queries";
import { ListingCard } from "./ArticleCard";
import { Pagination } from "../site/Pagination";
import { Breadcrumbs } from "../site/Breadcrumbs";

export function ArticleList({
  title,
  intro,
  items,
  basePath,
  page = 1,
  totalPages = 1,
  crumbs,
  empty = "এখানে এখনও কোনো সংবাদ নেই।",
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  items: CardArticle[];
  basePath: string;
  page?: number;
  totalPages?: number;
  crumbs: { name: string; path: string }[];
  empty?: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 pt-5">
      <Breadcrumbs items={crumbs} />
      <header className="mt-4 border-b-2 border-ink pb-3">
        <h1 className="text-3xl font-bold sm:text-4xl">
          <span className="mr-3 inline-block h-7 w-2 bg-brand align-[-3px]" aria-hidden="true" />
          {title}
        </h1>
        {intro && <div className="mt-2 text-lg text-muted">{intro}</div>}
      </header>
      {children}
      <div className="mt-6">
        {items.length ? (
          items.map((a) => <ListingCard key={a.id} a={a} />)
        ) : (
          <p className="py-12 text-center text-lg text-muted">{empty}</p>
        )}
      </div>
      <Pagination basePath={basePath} page={page} totalPages={totalPages} />
    </main>
  );
}
