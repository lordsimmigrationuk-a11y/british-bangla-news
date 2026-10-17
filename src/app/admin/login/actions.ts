"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { clientIp, hashKey } from "@/lib/request";
import type { ActionState } from "@/components/admin/ActionForm";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) });

// A fixed hash so unknown emails take the same time as wrong passwords.
const DUMMY_HASH = "$2b$12$8M/uEypDf1QM1mSLqs/Rxu6RMI3ATDXxYwThU89sAxzoKjLO.HLQS";

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { error: "ইমেইল ও পাসওয়ার্ড লিখুন।" };
  const { email, password } = parsed.data;
  const ip = hashKey(await clientIp());
  const keyEmail = `login:${hashKey(email)}`;
  const keyIp = `login-ip:${ip}`;
  if (!rateLimit(keyEmail, 5, 15 * 60 * 1000).ok || !rateLimit(keyIp, 30, 15 * 60 * 1000).ok) {
    return { error: "অনেকবার ভুল চেষ্টা হয়েছে। ১৫ মিনিট পরে আবার চেষ্টা করুন।" };
  }
  const user = await db.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.active || !user.canLogin) return { error: "ইমেইল বা পাসওয়ার্ড সঠিক নয়।" };
  resetRateLimit(keyEmail);
  await createSession(user.id);
  const next = String(fd.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
