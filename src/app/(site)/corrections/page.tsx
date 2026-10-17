import type { Metadata } from "next";
import { StaticPage } from "@/components/site/StaticPage";
import { ContactForm } from "@/components/site/ContactForm";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = { title: "সংশোধন নীতিমালা", alternates: { canonical: "/corrections" } };

export default async function CorrectionsPage({ searchParams }: PageProps<"/corrections">) {
  const { article } = await searchParams;
  // Only prefill links that point at this site.
  const prefill = typeof article === "string" && article.startsWith(siteUrl()) ? article : undefined;
  return (
    <StaticPage slug="corrections">
      <section id="report" aria-labelledby="report-h" className="mt-10 scroll-mt-20 border border-line p-5">
        <h2 id="report-h" className="mb-4 text-2xl font-bold">
          সংশোধনের অনুরোধ পাঠান
        </h2>
        <ContactForm kind="CORRECTION" articleUrl={prefill} />
      </section>
    </StaticPage>
  );
}
