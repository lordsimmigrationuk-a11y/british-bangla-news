import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { PageHeader, Card, Field, Check, inputCls } from "@/components/admin/ui";
import { ProfileFields } from "@/components/admin/UserFields";
import { createUser } from "../actions";

export const metadata: Metadata = { title: "নতুন ব্যবহারকারী" };

export default async function NewUser() {
  await requireUser(["ADMIN"]);
  return (
    <>
      <PageHeader title="নতুন ব্যবহারকারী" />
      <ActionForm action={createUser} className="space-y-6">
        <Card title="অ্যাকাউন্ট">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="ইমেইল" htmlFor="email">
              <input id="email" name="email" type="email" required className={inputCls} autoComplete="off" />
            </Field>
            <Field label="ভূমিকা" htmlFor="role">
              <select id="role" name="role" defaultValue="REPORTER" className={inputCls}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="প্রাথমিক পাসওয়ার্ড"
              htmlFor="password"
              hint="কমপক্ষে ১২ অক্ষর। নিরাপদ উপায়ে জানান এবং প্রথম লগইনের পর বদলাতে বলুন।"
            >
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={12}
                className={inputCls}
                autoComplete="new-password"
              />
            </Field>
          </div>
        </Card>
        <Card title="প্রোফাইল">
          <ProfileFields />
          <div className="mt-4">
            <Check name="showOnTeam" label="‘আমাদের টিম’ পাতায় দেখান" defaultChecked />
          </div>
        </Card>
        <SubmitButton>তৈরি করুন</SubmitButton>
      </ActionForm>
    </>
  );
}
