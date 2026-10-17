"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { setSettings } from "@/lib/settings";
import { SECTION_KINDS } from "@/lib/constants";
import type { ActionState } from "@/components/admin/ActionForm";

const EDITORS = ["ADMIN", "EDITOR"] as const;

export async function setFeatured(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser([...EDITORS]);
  const id = String(fd.get("featuredArticleId") ?? "");
  if (id && !(await db.article.findUnique({ where: { id } }))) return { error: "সংবাদটি পাওয়া যায়নি।" };
  await setSettings({ featuredArticleId: id });
  redirect("/admin/homepage?done=featured");
}

export async function setBreaking(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser([...EDITORS]);
  const id = String(fd.get("articleId") ?? "");
  const on = fd.get("on") === "1";
  const hours = Number(fd.get("hours") ?? 0);
  if (!id) return { error: "একটি সংবাদ বেছে নিন।" };
  await db.article.update({
    where: { id },
    data: { isBreaking: on, breakingExpiresAt: on && hours > 0 ? new Date(Date.now() + Math.min(hours, 168) * 3600_000) : null },
  });
  redirect("/admin/homepage?done=breaking");
}

export async function addSection(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser([...EDITORS]);
  const kind = String(fd.get("kind"));
  const title = String(fd.get("title") ?? "")
    .trim()
    .slice(0, 80);
  const categoryId = String(fd.get("categoryId") ?? "") || null;
  const category2Id = String(fd.get("category2Id") ?? "") || null;
  if (!(SECTION_KINDS as readonly string[]).includes(kind)) return { error: "অজানা ধরন।" };
  if ((kind === "CATEGORY" || kind === "CATEGORY_PAIR") && !categoryId) return { error: "বিভাগ বেছে নিন।" };
  if (kind === "CATEGORY_PAIR" && !category2Id) return { error: "দ্বিতীয় বিভাগও বেছে নিন।" };
  if (!title) return { error: "শিরোনাম দিন।" };
  const max = await db.homeSection.aggregate({ _max: { order: true } });
  await db.homeSection.create({
    data: {
      kind,
      title,
      categoryId: kind.startsWith("CATEGORY") ? categoryId : null,
      category2Id: kind === "CATEGORY_PAIR" ? category2Id : null,
      order: (max._max.order ?? 0) + 10,
    },
  });
  redirect("/admin/homepage?done=section");
}

export async function updateSection(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser([...EDITORS]);
  const id = String(fd.get("id"));
  const op = String(fd.get("op"));
  const sections = await db.homeSection.findMany({ orderBy: { order: "asc" } });
  const idx = sections.findIndex((s) => s.id === id);
  if (idx === -1) return { error: "অংশটি পাওয়া যায়নি।" };
  if (op === "delete") {
    await db.homeSection.delete({ where: { id } });
  } else if (op === "toggle") {
    await db.homeSection.update({ where: { id }, data: { enabled: !sections[idx].enabled } });
  } else if (op === "up" || op === "down") {
    const j = op === "up" ? idx - 1 : idx + 1;
    if (j >= 0 && j < sections.length) {
      [sections[idx], sections[j]] = [sections[j], sections[idx]];
      await db.$transaction(sections.map((s, i) => db.homeSection.update({ where: { id: s.id }, data: { order: (i + 1) * 10 } })));
    }
  } else if (op === "rename") {
    const title = String(fd.get("title") ?? "")
      .trim()
      .slice(0, 80);
    if (title) await db.homeSection.update({ where: { id }, data: { title } });
  }
  redirect("/admin/homepage?done=section");
}
