"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { SLUG_PATTERN } from "@/lib/slug";
import type { ActionState } from "@/components/admin/ActionForm";

const schema = z.object({
  name: z.string().trim().min(2, "নাম দিন।").max(60),
  slug: z.string().trim().toLowerCase().regex(SLUG_PATTERN, "স্লাগে ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন।").max(60),
  description: z.string().trim().max(300),
  parentId: z.string().max(40),
  order: z.coerce.number().int().min(0).max(1000).catch(0),
});

export async function saveCategory(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser(["ADMIN", "EDITOR"]);
  const id = String(fd.get("id") ?? "") || null;
  const parsed = schema.safeParse({
    name: fd.get("name"),
    slug: fd.get("slug"),
    description: fd.get("description") ?? "",
    parentId: fd.get("parentId") ?? "",
    order: fd.get("order"),
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  const v = parsed.data;
  const clash = await db.category.findFirst({ where: { slug: v.slug, NOT: id ? { id } : undefined } });
  if (clash) return { error: "এই স্লাগ অন্য বিভাগে ব্যবহৃত হয়েছে।" };
  if (v.parentId) {
    const parent = await db.category.findUnique({ where: { id: v.parentId } });
    if (!parent || parent.parentId) return { error: "মূল বিভাগ হিসেবে শুধু প্রধান বিভাগ বেছে নেওয়া যাবে।" };
    if (parent.id === id) return { error: "বিভাগ নিজের উপবিভাগ হতে পারে না।" };
    if (id && (await db.category.count({ where: { parentId: id } })))
      return { error: "যে বিভাগের উপবিভাগ আছে, সেটি অন্যের উপবিভাগ হতে পারে না।" };
  }
  const data = {
    name: v.name,
    slug: v.slug,
    description: v.description || null,
    parentId: v.parentId || null,
    order: v.order,
    showInNav: fd.get("showInNav") === "on",
  };
  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data });
  redirect("/admin/categories?done=1");
}

export async function deleteCategory(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser(["ADMIN", "EDITOR"]);
  const id = String(fd.get("id"));
  const used = await db.article.count({ where: { OR: [{ categoryId: id }, { subcategoryId: id }] } });
  if (used) return { error: `এই বিভাগে ${used}টি সংবাদ আছে। আগে সেগুলো অন্য বিভাগে সরান।` };
  await db.category.updateMany({ where: { parentId: id }, data: { parentId: null } });
  await db.category.delete({ where: { id } });
  redirect("/admin/categories?done=1");
}
