import "server-only";
import { cache } from "react";
import { db } from "./db";

export const SETTING_DEFAULTS = {
  siteNameBn: "ব্রিটিশ বাংলা নিউজ",
  siteNameEn: "British Bangla News",
  tagline: "বাংলাদেশ, যুক্তরাজ্য ও বিশ্বের নির্ভরযোগ্য বাংলা সংবাদ",
  featuredArticleId: "",
  liveStreamUrl: "",
  youtubeChannelUrl: "",
  facebookUrl: "",
  xUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  whatsappUrl: "",
  contactEmail: "",
  newsroomEmail: "",
  advertisingEmail: "",
  ga4Id: "",
  googleSiteVerification: "",
  bingSiteVerification: "",
  adsEnabled: "false",
  adsenseClientId: "",
  adSlotHomeBanner: "",
  adSlotCategory: "",
  adSlotArticleSidebar: "",
  adSlotInArticle: "",
  adSlotMobile: "",
  popularMode: "views", // views | editorial
  popularWindowDays: "7",
  tickerMode: "scroll", // scroll | static
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = Record<SettingKey, string>;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.setting.findMany();
  const out = { ...SETTING_DEFAULTS } as Settings;
  for (const r of rows) if (r.key in out) out[r.key as SettingKey] = r.value;
  return out;
});

export async function setSettings(values: Partial<Settings>) {
  await db.$transaction(
    Object.entries(values).map(([key, value]) =>
      db.setting.upsert({ where: { key }, create: { key, value: value ?? "" }, update: { value: value ?? "" } }),
    ),
  );
}

export function socialLinks(s: Settings) {
  return [
    { key: "facebook", label: "Facebook", url: s.facebookUrl },
    { key: "youtube", label: "YouTube", url: s.youtubeChannelUrl },
    { key: "x", label: "X", url: s.xUrl },
    { key: "instagram", label: "Instagram", url: s.instagramUrl },
    { key: "tiktok", label: "TikTok", url: s.tiktokUrl },
    { key: "whatsapp", label: "WhatsApp", url: s.whatsappUrl },
  ].filter((l) => /^https:\/\//.test(l.url)) as { key: SocialKey; label: string; url: string }[];
}
export type SocialKey = "facebook" | "youtube" | "x" | "instagram" | "tiktok" | "whatsapp";

export function adsActive(s: Settings) {
  return s.adsEnabled === "true" && /^ca-pub-\d+$/.test(s.adsenseClientId);
}
