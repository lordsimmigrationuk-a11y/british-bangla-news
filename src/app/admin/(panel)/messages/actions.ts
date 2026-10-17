"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { ActionState } from "@/components/admin/ActionForm";

export async function updateMessage(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser(["ADMIN", "EDITOR"]);
  const id = String(fd.get("id"));
  const op = String(fd.get("op"));
  if (op === "delete") await db.contactMessage.delete({ where: { id } }).catch(() => null);
  else if (["NEW", "READ", "RESOLVED"].includes(op)) await db.contactMessage.update({ where: { id }, data: { status: op } });
  redirect("/admin/messages");
}
