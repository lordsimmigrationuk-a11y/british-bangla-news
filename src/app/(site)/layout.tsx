import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ThirdPartyScripts } from "@/components/site/ThirdPartyScripts";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: `${s.siteNameBn} | ${s.siteNameEn}`, template: `%s | ${s.siteNameBn}` },
    description: s.tagline,
    applicationName: s.siteNameEn,
    openGraph: { siteName: s.siteNameBn, locale: "bn_BD", type: "website", images: ["/brand/og-default.png"] },
    twitter: { card: "summary_large_image" },
    alternates: { types: { "application/rss+xml": "/feed.xml" } },
    verification: {
      ...(s.googleSiteVerification ? { google: s.googleSiteVerification } : {}),
      ...(s.bingSiteVerification ? { other: { "msvalidate.01": s.bingSiteVerification } } : {}),
    },
  };
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div id="main" tabIndex={-1} className="outline-none">
        {children}
      </div>
      <Footer />
      <ThirdPartyScripts />
    </>
  );
}
