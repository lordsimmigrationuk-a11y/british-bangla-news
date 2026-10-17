import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { PageHeader, Notice, Field, Check, inputCls } from "@/components/admin/ui";
import { savePage } from "../actions";

export const metadata: Metadata = { title: "পাতা সম্পাদনা" };

export default async function EditPage({ params, searchParams }: PageProps<"/admin/pages/[id]">) {
  await requireUser(["ADMIN", "EDITOR"]);
  const { id } = await params;
  const { done } = await searchParams;
  const p = await db.page.findUnique({ where: { id } });
  if (!p) notFound();
  return (
    <>
      <PageHeader
        title={p.title}
        actions={
          <Link href={`/${p.slug}`} target="_blank" className="rounded border border-[#9ca3af] bg-white px-4 py-2 text-sm font-semibold">
            সাইটে দেখুন
          </Link>
        }
      />
      {done && <Notice>সংরক্ষিত হয়েছে।</Notice>}
      <ActionForm action={savePage} className="space-y-4 rounded border border-line bg-white p-5">
        <input type="hidden" name="id" value={p.id} />
        <Field label="শিরোনাম" htmlFor="title">
          <input id="title" name="title" required defaultValue={p.title} className={inputCls} />
        </Field>
        <Field
          label="লেখা (Markdown)"
          htmlFor="body"
          hint="উপশিরোনামের জন্য ## ব্যবহার করুন। শুধু যাচাই করা তথ্য দিন; ঠিকানা, ফোন নম্বর বা নিবন্ধন নম্বর অনুমান করে লিখবেন না।"
        >
          <textarea id="body" name="body" rows={24} defaultValue={p.body} className={inputCls} />
        </Field>
        <Check
          name="isPlaceholder"
          label="এখনও খসড়া তথ্য"
          defaultChecked={p.isPlaceholder}
          hint="তথ্য যাচাই হয়ে গেলে টিক তুলে দিন; তখন পাঠকদের নোটিশ আর দেখাবে না।"
        />
        <SubmitButton>সংরক্ষণ</SubmitButton>
      </ActionForm>
    </>
  );
}
