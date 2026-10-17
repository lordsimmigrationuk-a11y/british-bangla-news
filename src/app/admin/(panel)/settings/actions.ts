"use server";

import { redirect } from "next/navigation";
import { rm } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { setSettings, SETTING_DEFAULTS, type SettingKey } from "@/lib/settings";
import { uploadDir } from "@/lib/env";
import type { ActionState } from "@/components/admin/ActionForm";

const URL_KEYS: SettingKey[] = ["facebookUrl", "youtubeChannelUrl", "xUrl", "instagramUrl", "tiktokUrl", "whatsappUrl", "liveStreamUrl"];
const EMAIL_KEYS: SettingKey[] = ["contactEmail", "newsroomEmail", "advertisingEmail"];

export async function saveSettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser(["ADMIN"]);
  const values: Partial<Record<SettingKey, string>> = {};
  for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
    if (key === "featuredArticleId") continue;
    if (key === "adsEnabled") {
      values.adsEnabled = fd.get("adsEnabled") === "on" ? "true" : "false";
      continue;
    }
    const raw = fd.get(key);
    if (raw === null) continue;
    values[key] = String(raw).trim().slice(0, 500);
  }
  for (const k of URL_KEYS)
    if (values[k] && !/^https:\/\/[^\s]+$/.test(values[k]!)) return { error: `${k}: লিংকটি https:// দিয়ে শুরু হতে হবে।` };
  for (const k of EMAIL_KEYS) if (values[k] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[k]!)) return { error: `${k}: সঠিক ইমেইল দিন।` };
  if (values.ga4Id && !/^G-[A-Z0-9]+$/.test(values.ga4Id)) return { error: "GA4 Measurement ID দেখতে G-XXXXXXX এর মতো হবে।" };
  if (values.adsenseClientId && !/^ca-pub-\d+$/.test(values.adsenseClientId))
    return { error: "AdSense publisher ID দেখতে ca-pub-XXXXXXXX এর মতো হবে।" };
  if (values.adsEnabled === "true" && !values.adsenseClientId) return { error: "বিজ্ঞাপন চালু করতে AdSense publisher ID দিন।" };
  if (values.popularMode && !["views", "editorial"].includes(values.popularMode)) values.popularMode = "views";
  if (values.tickerMode && !["scroll", "static"].includes(values.tickerMode)) values.tickerMode = "scroll";
  await setSettings(values);
  redirect("/admin/settings?done=1");
}

/** Removes every item marked as sample content, including its uploaded images. */
export async function deleteSampleContent(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser(["ADMIN"]);
  if (fd.get("confirm") !== "DELETE") return { error: "নিশ্চিত করতে বক্সে DELETE লিখুন।" };
  const media = await db.media.findMany({ where: { isSample: true } });
  await db.article.deleteMany({ where: { isSample: true } });
  await db.video.deleteMany({ where: { isSample: true } });
  // Sample authors: reassign nothing (their articles are gone) and deactivate them.
  await db.user.deleteMany({ where: { isSample: true, id: { not: user.id }, articles: { none: {} } } });
  await db.media.deleteMany({ where: { isSample: true } });
  for (const m of media) {
    for (const w of m.widths.split(",").filter(Boolean)) {
      await rm(path.join(uploadDir(), `${m.path}-${w}.webp`), { force: true });
    }
  }
  await setSettings({ featuredArticleId: "" });
  redirect("/admin/settings?done=sample");
}
