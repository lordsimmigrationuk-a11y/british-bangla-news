import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaticPage, getPage } from "@/components/site/StaticPage";
import { plainText } from "@/lib/markdown";

// Contact, corrections and team have their own routes with forms or listings.
const RESERVED = new Set(["contact", "corrections", "team", "advertise"]);

export async function generateMetadata({ params }: PageProps<"/[page]">): Promise<Metadata> {
  const { page } = await params;
  const p = RESERVED.has(page) ? null : await getPage(page);
  if (!p) return { title: "পাতা পাওয়া যায়নি" };
  return { title: p.title, description: plainText(p.body, 160), alternates: { canonical: `/${p.slug}` } };
}

export default async function InfoPage({ params }: PageProps<"/[page]">) {
  const { page } = await params;
  if (RESERVED.has(page) || !/^[a-z0-9-]+$/.test(page)) notFound();
  return <StaticPage slug={page} />;
}
