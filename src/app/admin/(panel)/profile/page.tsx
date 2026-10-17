import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { PageHeader, Card, Field, Notice, inputCls } from "@/components/admin/ui";
import { ProfileFields } from "@/components/admin/UserFields";
import { updateOwnProfile, changeOwnPassword } from "../users/actions";

export const metadata: Metadata = { title: "আমার প্রোফাইল" };

export default async function Profile({ searchParams }: PageProps<"/admin/profile">) {
  const user = await requireUser();
  const { done } = await searchParams;
  const u = await db.user.findUniqueOrThrow({ where: { id: user.id }, include: { avatar: true } });
  return (
    <>
      <PageHeader title="আমার প্রোফাইল" />
      {done && <Notice>প্রোফাইল সংরক্ষিত হয়েছে।</Notice>}
      <ActionForm action={updateOwnProfile}>
        <Card title="প্রোফাইল">
          <ProfileFields u={u} />
          <div className="mt-4">
            <SubmitButton>সংরক্ষণ</SubmitButton>
          </div>
        </Card>
      </ActionForm>
      <ActionForm action={changeOwnPassword} className="mt-6">
        <Card title="পাসওয়ার্ড পরিবর্তন">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="বর্তমান পাসওয়ার্ড" htmlFor="current">
              <input id="current" name="current" type="password" required autoComplete="current-password" className={inputCls} />
            </Field>
            <Field label="নতুন পাসওয়ার্ড" htmlFor="next" hint="কমপক্ষে ১২ অক্ষর">
              <input id="next" name="next" type="password" required minLength={12} autoComplete="new-password" className={inputCls} />
            </Field>
            <Field label="আবার লিখুন" htmlFor="confirm">
              <input id="confirm" name="confirm" type="password" required autoComplete="new-password" className={inputCls} />
            </Field>
          </div>
          <div className="mt-4">
            <SubmitButton>পাসওয়ার্ড বদলান</SubmitButton>
          </div>
        </Card>
      </ActionForm>
    </>
  );
}
