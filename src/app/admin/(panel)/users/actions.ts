"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, hashPassword, passwordProblem, verifyPassword } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { SLUG_PATTERN, asciiSlug } from "@/lib/slug";
import { saveImageUpload, UploadError } from "@/lib/media";
import type { ActionState } from "@/components/admin/ActionForm";

const profile = z.object({
  name: z.string().trim().min(2, "নাম দিন।").max(80),
  designation: z.string().trim().max(80),
  bio: z.string().trim().max(1000),
  slug: z.string().trim().toLowerCase().max(60),
});

async function avatarFrom(fd: FormData, name: string, uploaderId: string) {
  const file = fd.get("avatar");
  if (!(file instanceof File) || file.size === 0) return undefined;
  const m = await saveImageUpload(file, { alt: name, uploaderId });
  return m.id;
}

async function uniqueSlug(slug: string, exceptId?: string) {
  if (!SLUG_PATTERN.test(slug)) throw new UploadError("প্রোফাইল URL-এ শুধু ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন দিন।");
  const clash = await db.user.findFirst({ where: { slug, NOT: exceptId ? { id: exceptId } : undefined } });
  if (clash) throw new UploadError("এই প্রোফাইল URL ইতিমধ্যে ব্যবহৃত।");
  return slug;
}

export async function createUser(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireUser(["ADMIN"]);
  const parsed = profile
    .extend({ email: z.string().trim().toLowerCase().email("সঠিক ইমেইল দিন।"), role: z.enum(ROLES), password: z.string() })
    .safeParse(Object.fromEntries(["name", "designation", "bio", "slug", "email", "role", "password"].map((k) => [k, fd.get(k) ?? ""])));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const v = parsed.data;
  const pw = passwordProblem(v.password);
  if (pw) return { error: pw };
  if (await db.user.findUnique({ where: { email: v.email } })) return { error: "এই ইমেইলে ইতিমধ্যে অ্যাকাউন্ট আছে।" };
  try {
    const slug = await uniqueSlug(v.slug || asciiSlug(v.email.split("@")[0], "author"));
    const avatarId = await avatarFrom(fd, v.name, admin.id);
    const u = await db.user.create({
      data: {
        email: v.email,
        name: v.name,
        role: v.role,
        designation: v.designation || null,
        bio: v.bio || null,
        slug,
        passwordHash: await hashPassword(v.password),
        avatarId,
        showOnTeam: fd.get("showOnTeam") === "on",
      },
    });
    redirect(`/admin/users/${u.id}?done=created`);
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }
}

export async function updateUser(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireUser(["ADMIN"]);
  const id = String(fd.get("id"));
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return { error: "ব্যবহারকারী পাওয়া যায়নি।" };
  const parsed = profile
    .extend({ role: z.enum(ROLES) })
    .safeParse(Object.fromEntries(["name", "designation", "bio", "slug", "role"].map((k) => [k, fd.get(k) ?? ""])));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const v = parsed.data;
  const active = fd.get("active") === "on";
  const canLogin = fd.get("canLogin") === "on";
  if (id === admin.id && (v.role !== "ADMIN" || !active || !canLogin)) {
    return { error: "নিজের অ্যাডমিন অধিকার বা অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না।" };
  }
  const newPw = String(fd.get("newPassword") ?? "");
  if (newPw) {
    const pw = passwordProblem(newPw);
    if (pw) return { error: pw };
  }
  try {
    const slug = await uniqueSlug(v.slug || target.slug, id);
    const avatarId = await avatarFrom(fd, v.name, admin.id);
    await db.user.update({
      where: { id },
      data: {
        name: v.name,
        designation: v.designation || null,
        bio: v.bio || null,
        slug,
        role: v.role,
        active,
        canLogin,
        showOnTeam: fd.get("showOnTeam") === "on",
        ...(avatarId ? { avatarId } : {}),
        ...(newPw ? { passwordHash: await hashPassword(newPw) } : {}),
      },
    });
    // Signing out everywhere when access changes.
    if (!active || !canLogin || newPw || v.role !== target.role) await db.session.deleteMany({ where: { userId: id } });
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }
  redirect(`/admin/users/${id}?done=1`);
}

export async function updateOwnProfile(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profile.safeParse(Object.fromEntries(["name", "designation", "bio", "slug"].map((k) => [k, fd.get(k) ?? ""])));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const v = parsed.data;
  try {
    const slug = await uniqueSlug(v.slug || user.slug, user.id);
    const avatarId = await avatarFrom(fd, v.name, user.id);
    await db.user.update({
      where: { id: user.id },
      data: { name: v.name, designation: v.designation || null, bio: v.bio || null, slug, ...(avatarId ? { avatarId } : {}) },
    });
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    throw e;
  }
  redirect("/admin/profile?done=profile");
}

export async function changeOwnPassword(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const u = await db.user.findUnique({ where: { id: user.id } });
  if (!u || !(await verifyPassword(current, u.passwordHash))) return { error: "বর্তমান পাসওয়ার্ড সঠিক নয়।" };
  const pw = passwordProblem(next);
  if (pw) return { error: pw };
  if (next !== confirm) return { error: "নতুন পাসওয়ার্ড দুটি মেলেনি।" };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  return { error: null, notice: "পাসওয়ার্ড পরিবর্তন হয়েছে।" };
}
