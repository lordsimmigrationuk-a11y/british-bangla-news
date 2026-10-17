"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { ActionState } from "@/components/admin/ActionForm";

export async function savePage(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser(["ADMIN", "EDITOR"]);
  const id = String(fd.get("id"));
  const title = String(fd.get("title") ?? "")
    .trim()
    .slice(0, 120);
  const body = String(fd.get("body") ?? "")
    .trim()
    .slice(0, 100_000);
  if (title.length < 2 || body.length < 10) return { error: "শিরোনাম ও লেখা দিন।" };
  await db.page.update({ where: { id }, data: { title, body, isPlaceholder: fd.get("isPlaceholder") === "on" } });
  redirect(`/admin/pages/${id}?done=1`);
}
