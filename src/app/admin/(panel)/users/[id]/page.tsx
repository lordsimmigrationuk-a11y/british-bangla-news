import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { PageHeader, Card, Field, Check, Notice, inputCls } from "@/components/admin/ui";
import { ProfileFields } from "@/components/admin/UserFields";
import { updateUser } from "../actions";

export const metadata: Metadata = { title: "ব্যবহারকারী সম্পাদনা" };

export default async function EditUser({ params, searchParams }: PageProps<"/admin/users/[id]">) {
  await requireUser(["ADMIN"]);
  const { id } = await params;
  const { done } = await searchParams;
  const u = await db.user.findUnique({ where: { id }, include: { avatar: true } });
  if (!u) notFound();
  return (
    <>
      <PageHeader title={u.name}>
        <span lang="en">{u.email}</span>
      </PageHeader>
      {done && <Notice>{done === "created" ? "অ্যাকাউন্ট তৈরি হয়েছে।" : "সংরক্ষিত হয়েছে।"}</Notice>}
      <ActionForm action={updateUser} className="space-y-6">
        <input type="hidden" name="id" value={u.id} />
        <Card title="অ্যাকাউন্ট ও অনুমতি">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ভূমিকা" htmlFor="role">
              <select id="role" name="role" defaultValue={u.role} className={inputCls}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="নতুন পাসওয়ার্ড (ঐচ্ছিক)" htmlFor="newPassword" hint="দিলে ব্যবহারকারী সব ডিভাইস থেকে লগআউট হবেন।">
              <input id="newPassword" name="newPassword" type="password" minLength={12} className={inputCls} autoComplete="new-password" />
            </Field>
            <Check
              name="active"
              label="সক্রিয়"
              defaultChecked={u.active}
              hint="নিষ্ক্রিয় করলে লগইন ও লেখকের পাতা বন্ধ হবে, প্রকাশিত লেখা থাকবে।"
            />
            <Check
              name="canLogin"
              label="লগইন করতে পারবেন"
              defaultChecked={u.canLogin}
              hint="বন্ধ রাখলে শুধু বাইলাইন/লেখক প্রোফাইল হিসেবে থাকবে।"
            />
          </div>
        </Card>
        <Card title="প্রোফাইল">
          <ProfileFields u={u} />
          <div className="mt-4">
            <Check name="showOnTeam" label="‘আমাদের টিম’ পাতায় দেখান" defaultChecked={u.showOnTeam} />
          </div>
        </Card>
        <SubmitButton>সংরক্ষণ</SubmitButton>
      </ActionForm>
    </>
  );
}
