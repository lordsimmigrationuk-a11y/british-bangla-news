import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { renderArticleBody } from "@/lib/markdown";
import { formatDateShort } from "@/lib/format";
import { Breadcrumbs } from "./Breadcrumbs";

export async function getPage(slug: string) {
  return db.page.findUnique({ where: { slug } });
}

export async function StaticPage({ slug, children }: { slug: string; children?: React.ReactNode }) {
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 pt-5">
      <Breadcrumbs
        items={[
          { name: "প্রচ্ছদ", path: "/" },
          { name: page.title, path: `/${page.slug}` },
        ]}
      />
      <h1 className="mt-4 border-b-2 border-ink pb-3 text-3xl font-bold sm:text-4xl">{page.title}</h1>
      {page.isPlaceholder && (
        <p role="note" className="mt-5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-base text-amber-950">
          এই পাতার কিছু তথ্য প্রাথমিক খসড়া। প্রকাশক যাচাই করা তথ্য দিয়ে শিগগিরই এটি হালনাগাদ করবেন।
        </p>
      )}
      <div className="article-body mt-6" dangerouslySetInnerHTML={{ __html: renderArticleBody(page.body) }} />
      {children}
      <p className="mt-10 text-sm text-muted">সর্বশেষ হালনাগাদ: {formatDateShort(page.updatedAt)}</p>
    </main>
  );
}
