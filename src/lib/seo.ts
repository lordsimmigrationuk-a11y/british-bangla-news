import type { Settings } from "./settings";
import { socialLinks } from "./settings";
import { absoluteUrl, siteUrl } from "./env";
import { imageUrl, type ImageLike } from "./image";

export const LOGO_PATH = "/brand/logo-512.png";

export function organizationJsonLd(s: Settings) {
  const sameAs = socialLinks(s).map((l) => l.url);
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "@id": `${siteUrl()}/#organization`,
    name: s.siteNameEn,
    alternateName: s.siteNameBn,
    url: siteUrl(),
    logo: { "@type": "ImageObject", url: absoluteUrl(LOGO_PATH), width: 512, height: 512 },
    ...(sameAs.length ? { sameAs } : {}),
    publishingPrinciples: absoluteUrl("/editorial-policy"),
    correctionsPolicy: absoluteUrl("/corrections"),
  };
}

export function websiteJsonLd(s: Settings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    url: siteUrl(),
    name: s.siteNameBn,
    alternateName: s.siteNameEn,
    inLanguage: "bn",
    publisher: { "@id": `${siteUrl()}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl()}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function newsArticleJsonLd(a: {
  url: string;
  headline: string;
  description: string;
  image: ImageLike | null;
  publishedAt: Date;
  modifiedAt: Date;
  authorName: string;
  authorUrl: string | null;
  section: string;
  isSponsored: boolean;
  publisherName: string;
}) {
  const images = a.image
    ? [absoluteUrl(imageUrl(a.image, 1600)), absoluteUrl(imageUrl(a.image, 960))].filter((v, i, arr) => arr.indexOf(v) === i)
    : [absoluteUrl("/brand/og-default.png")];
  return {
    "@context": "https://schema.org",
    "@type": a.isSponsored ? "AdvertiserContentArticle" : "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(a.url) },
    headline: a.headline.slice(0, 110),
    description: a.description,
    image: images,
    datePublished: a.publishedAt.toISOString(),
    dateModified: a.modifiedAt.toISOString(),
    inLanguage: "bn",
    articleSection: a.section,
    author: [
      a.authorUrl
        ? { "@type": "Person", name: a.authorName, url: absoluteUrl(a.authorUrl) }
        : { "@type": "Organization", name: a.authorName },
    ],
    publisher: {
      "@type": "NewsMediaOrganization",
      name: a.publisherName,
      url: siteUrl(),
      logo: { "@type": "ImageObject", url: absoluteUrl(LOGO_PATH), width: 512, height: 512 },
    },
  };
}
