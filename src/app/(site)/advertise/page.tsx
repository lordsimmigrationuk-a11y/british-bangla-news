import type { Metadata } from "next";
import { StaticPage } from "@/components/site/StaticPage";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = { title: "বিজ্ঞাপন দিন", alternates: { canonical: "/advertise" } };

export default function AdvertisePage() {
  return (
    <StaticPage slug="advertise">
      <section aria-labelledby="ad-form" className="mt-10">
        <h2 id="ad-form" className="mb-4 text-2xl font-bold">
          বিজ্ঞাপন সংক্রান্ত অনুসন্ধান
        </h2>
        <ContactForm kind="ADVERTISING" />
      </section>
    </StaticPage>
  );
}
