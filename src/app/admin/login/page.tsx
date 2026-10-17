import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { Field, inputCls } from "@/components/admin/ui";
import { login } from "./actions";

export const metadata: Metadata = { title: "লগইন" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded border border-line bg-white p-8 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
        <img src="/brand/logo-160.webp" alt="British Bangla News" width={72} height={72} className="mx-auto h-[72px] w-[72px]" />
        <h1 className="mt-4 text-center text-xl font-bold">নিউজরুমে প্রবেশ</h1>
        <ActionForm action={login} className="mt-6 space-y-4">
          <Field label="ইমেইল" htmlFor="email">
            <input id="email" name="email" type="email" autoComplete="username" required className={inputCls} />
          </Field>
          <Field label="পাসওয়ার্ড" htmlFor="password">
            <input id="password" name="password" type="password" autoComplete="current-password" required className={inputCls} />
          </Field>
          <SubmitButton className="w-full py-2.5">প্রবেশ করুন</SubmitButton>
        </ActionForm>
        <p className="mt-6 text-center text-xs text-muted">
          শুধু অনুমোদিত সংবাদকর্মীদের জন্য। পাসওয়ার্ড ভুলে গেলে অ্যাডমিনিস্ট্রেটরের সাথে যোগাযোগ করুন।
        </p>
      </div>
    </main>
  );
}
