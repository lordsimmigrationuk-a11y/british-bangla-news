import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings, type SettingKey } from "@/lib/settings";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { PageHeader, Notice, Card, Field, Check, inputCls } from "@/components/admin/ui";
import { saveSettings, deleteSampleContent } from "./actions";

export const metadata: Metadata = { title: "সেটিংস" };

type Row = { key: SettingKey; label: string; hint?: string; type?: string };

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "সাইটের পরিচয়",
    rows: [
      { key: "siteNameBn", label: "সাইটের নাম (বাংলা)" },
      { key: "siteNameEn", label: "সাইটের নাম (ইংরেজি)" },
      { key: "tagline", label: "ট্যাগলাইন / সংক্ষিপ্ত বিবরণ" },
    ],
  },
  {
    title: "যোগাযোগ (শুধু যাচাই করা তথ্য)",
    rows: [
      { key: "contactEmail", label: "সাধারণ যোগাযোগের ইমেইল", type: "email" },
      { key: "newsroomEmail", label: "সংবাদকক্ষের ইমেইল", type: "email" },
      { key: "advertisingEmail", label: "বিজ্ঞাপন বিভাগের ইমেইল", type: "email" },
    ],
  },
  {
    title: "সামাজিক যোগাযোগমাধ্যম ও সম্প্রচার",
    rows: [
      { key: "facebookUrl", label: "Facebook পেজ", type: "url" },
      { key: "youtubeChannelUrl", label: "YouTube চ্যানেল", type: "url" },
      { key: "xUrl", label: "X (Twitter)", type: "url" },
      { key: "instagramUrl", label: "Instagram", type: "url" },
      { key: "tiktokUrl", label: "TikTok", type: "url" },
      { key: "whatsappUrl", label: "WhatsApp চ্যানেল", type: "url" },
      {
        key: "liveStreamUrl",
        label: "সরাসরি সম্প্রচারের YouTube লিংক",
        type: "url",
        hint: "শুধু সম্প্রচার চলার সময় দিন এবং শেষ হলে মুছে দিন। খালি থাকলে সাইটে ‘সরাসরি’ অংশ দেখাবে না।",
      },
    ],
  },
  {
    title: "সার্চ ইঞ্জিন ও অ্যানালিটিক্স",
    rows: [
      { key: "googleSiteVerification", label: "Google Search Console যাচাই কোড", hint: 'HTML tag পদ্ধতির content="..." অংশটি।' },
      { key: "bingSiteVerification", label: "Bing Webmaster যাচাই কোড" },
      {
        key: "ga4Id",
        label: "Google Analytics 4 Measurement ID",
        hint: "যেমন G-XXXXXXX। খালি থাকলে কোনো অ্যানালিটিক্স স্ক্রিপ্ট লোড হবে না।",
      },
    ],
  },
  {
    title: "বিজ্ঞাপন (Google AdSense)",
    rows: [
      { key: "adsenseClientId", label: "AdSense publisher ID", hint: "যেমন ca-pub-1234567890" },
      { key: "adSlotHomeBanner", label: "প্রচ্ছদ ব্যানার slot ID" },
      { key: "adSlotCategory", label: "বিভাগের পাতা slot ID" },
      { key: "adSlotArticleSidebar", label: "সংবাদের সাইডবার slot ID" },
      { key: "adSlotInArticle", label: "সংবাদের ভেতরে slot ID" },
      { key: "adSlotMobile", label: "মোবাইল slot ID" },
    ],
  },
];

export default async function SettingsAdmin({ searchParams }: PageProps<"/admin/settings">) {
  await requireUser(["ADMIN"]);
  const { done } = await searchParams;
  const s = await getSettings();
  const samples = await db.article.count({ where: { isSample: true } });
  return (
    <>
      <PageHeader title="সেটিংস" />
      {done === "1" && <Notice>সেটিংস সংরক্ষিত হয়েছে।</Notice>}
      {done === "sample" && <Notice>সব নমুনা কনটেন্ট মুছে ফেলা হয়েছে।</Notice>}
      <ActionForm action={saveSettings} className="space-y-6">
        {GROUPS.map((g) => (
          <Card key={g.title} title={g.title}>
            <div className="grid gap-4 sm:grid-cols-2">
              {g.rows.map((r) => (
                <Field key={r.key} label={r.label} htmlFor={r.key} hint={r.hint}>
                  <input id={r.key} name={r.key} type={r.type ?? "text"} defaultValue={s[r.key]} className={inputCls} />
                </Field>
              ))}
              {g.title.startsWith("বিজ্ঞাপন") && (
                <div className="sm:col-span-2">
                  <Check
                    name="adsEnabled"
                    label="বিজ্ঞাপন চালু"
                    defaultChecked={s.adsEnabled === "true"}
                    hint="বৈধ AdSense অ্যাকাউন্ট ও slot ID না থাকলে চালু করবেন না। বিজ্ঞাপন সবসময় ‘বিজ্ঞাপন’ লেবেলসহ আলাদা দেখানো হয়।"
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
        <Card title="প্রদর্শন">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="জনপ্রিয় সংবাদ নির্ধারণের পদ্ধতি" htmlFor="popularMode">
              <select id="popularMode" name="popularMode" defaultValue={s.popularMode} className={inputCls}>
                <option value="views">বেনামে গণনা করা পাঠ (সম্পাদকীয় অগ্রাধিকার দিয়ে পূরণ)</option>
                <option value="editorial">শুধু সম্পাদকীয় অগ্রাধিকার</option>
              </select>
            </Field>
            <Field label="গণনার সময়কাল (দিন)" htmlFor="popularWindowDays">
              <input
                id="popularWindowDays"
                name="popularWindowDays"
                type="number"
                min={1}
                max={30}
                defaultValue={s.popularWindowDays}
                className={inputCls}
              />
            </Field>
            <Field label="ব্রেকিং স্ট্রিপ" htmlFor="tickerMode">
              <select id="tickerMode" name="tickerMode" defaultValue={s.tickerMode} className={inputCls}>
                <option value="scroll">চলমান (থামানো যায়)</option>
                <option value="static">স্থির</option>
              </select>
            </Field>
          </div>
        </Card>
        <SubmitButton>সব সেটিংস সংরক্ষণ</SubmitButton>
      </ActionForm>

      <section id="sample" className="mt-10 rounded border border-brand/50 bg-white p-5">
        <h2 className="text-lg font-bold text-brand-dark">নমুনা কনটেন্ট মুছে ফেলুন</h2>
        <p className="mt-1 text-sm">
          ডেমো দেখানোর জন্য যোগ করা {samples}টি নমুনা সংবাদ, নমুনা ভিডিও, নমুনা লেখক ও নমুনা ছবি স্থায়ীভাবে মুছে যাবে। প্রকৃত সংবাদ
          প্রকাশের আগে এটি করুন।
        </p>
        <ActionForm action={deleteSampleContent} className="mt-3 flex flex-wrap items-end gap-3">
          <Field label="নিশ্চিত করতে DELETE লিখুন" htmlFor="confirm">
            <input id="confirm" name="confirm" className={inputCls} autoComplete="off" lang="en" />
          </Field>
          <SubmitButton variant="danger" confirm="সব নমুনা কনটেন্ট স্থায়ীভাবে মুছে যাবে। নিশ্চিত?">
            নমুনা কনটেন্ট মুছুন
          </SubmitButton>
        </ActionForm>
      </section>
    </>
  );
}
