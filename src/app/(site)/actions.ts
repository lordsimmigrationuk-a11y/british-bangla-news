"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, hashKey } from "@/lib/request";

export type FormState = { ok: boolean; message: string; errors?: Record<string, string> };

const schema = z.object({
  kind: z.enum(["GENERAL", "CORRECTION", "ADVERTISING"]),
  name: z.string().trim().min(2, "নাম লিখুন").max(120),
  email: z.string().trim().email("সঠিক ইমেইল ঠিকানা লিখুন").max(200),
  subject: z.string().trim().max(200).optional(),
  articleUrl: z.string().trim().max(500).optional(),
  message: z.string().trim().min(10, "বার্তাটি কমপক্ষে ১০ অক্ষরের হতে হবে").max(5000),
});

export async function submitMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  // Honeypot: real visitors never fill this hidden field.
  if (String(formData.get("website") ?? "")) return { ok: true, message: "ধন্যবাদ, আপনার বার্তা পেয়েছি।" };

  const ip = hashKey(await clientIp());
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000).ok) {
    return { ok: false, message: "অল্প সময়ে অনেকগুলো বার্তা পাঠানো হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।" };
  }
  const parsed = schema.safeParse({
    kind: formData.get("kind"),
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") || undefined,
    articleUrl: formData.get("articleUrl") || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
    return { ok: false, message: "ফর্মে কিছু তথ্য ঠিক নেই।", errors };
  }
  await db.contactMessage.create({ data: parsed.data });
  return {
    ok: true,
    message:
      parsed.data.kind === "CORRECTION"
        ? "ধন্যবাদ। আপনার সংশোধনের অনুরোধ সম্পাদকীয় দলের কাছে পৌঁছেছে।"
        : "ধন্যবাদ, আপনার বার্তা পেয়েছি। প্রয়োজনে আমরা ইমেইলে যোগাযোগ করব।",
  };
}
