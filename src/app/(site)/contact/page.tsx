import type { Metadata } from "next";
import { StaticPage } from "@/components/site/StaticPage";
import { ContactForm } from "@/components/site/ContactForm";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "যোগাযোগ", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const s = await getSettings();
  const emails = [
    { label: "সাধারণ যোগাযোগ", v: s.contactEmail },
    { label: "সংবাদকক্ষ", v: s.newsroomEmail },
    { label: "বিজ্ঞাপন", v: s.advertisingEmail },
  ].filter((e) => e.v.includes("@"));
  return (
    <StaticPage slug="contact">
      {emails.length > 0 && (
        <ul className="mt-6 space-y-1 text-base">
          {emails.map((e) => (
            <li key={e.label}>
              <strong>{e.label}:</strong>{" "}
              <a href={`mailto:${e.v}`} className="text-brand-dark underline" lang="en">
                {e.v}
              </a>
            </li>
          ))}
        </ul>
      )}
      <section aria-labelledby="form-h" className="mt-10">
        <h2 id="form-h" className="mb-4 text-2xl font-bold">
          বার্তা পাঠান
        </h2>
        <ContactForm kind="GENERAL" />
      </section>
    </StaticPage>
  );
}
