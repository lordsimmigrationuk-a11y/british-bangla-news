import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { MESSAGE_KIND_LABELS } from "@/lib/constants";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { PageHeader } from "@/components/admin/ui";
import { updateMessage } from "./actions";

export const metadata: Metadata = { title: "বার্তা" };
const STATUS = { NEW: "নতুন", READ: "পড়া হয়েছে", RESOLVED: "নিষ্পন্ন" } as const;

export default async function MessagesAdmin() {
  await requireUser(["ADMIN", "EDITOR"]);
  const items = await db.contactMessage.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 200 });
  return (
    <>
      <PageHeader title="পাঠকের বার্তা ও সংশোধনের অনুরোধ">যোগাযোগ, সংশোধন ও বিজ্ঞাপন ফর্ম থেকে আসা বার্তা।</PageHeader>
      {items.length === 0 && <p className="text-muted">কোনো বার্তা নেই।</p>}
      <ul className="space-y-3">
        {items.map((m) => (
          <li key={m.id} className={`rounded border bg-white p-4 ${m.status === "NEW" ? "border-brand" : "border-line"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p>
                <span className="font-semibold">{MESSAGE_KIND_LABELS[m.kind as keyof typeof MESSAGE_KIND_LABELS] ?? m.kind}</span> ·{" "}
                {m.name} ·{" "}
                <a href={`mailto:${m.email}`} className="underline">
                  {m.email}
                </a>
              </p>
              <p className="text-muted">
                {formatDateTime(m.createdAt)} · {STATUS[m.status as keyof typeof STATUS]}
              </p>
            </div>
            {m.subject && <p className="mt-2 font-semibold">{m.subject}</p>}
            {m.articleUrl && (
              <p className="mt-1 text-sm">
                প্রতিবেদন:{" "}
                <a href={m.articleUrl} className="break-all underline" target="_blank" rel="noopener noreferrer">
                  {m.articleUrl}
                </a>
              </p>
            )}
            <p className="mt-2 whitespace-pre-line">{m.message}</p>
            <ActionForm action={updateMessage} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={m.id} />
              {m.status !== "READ" && (
                <SubmitButton name="op" value="READ" variant="secondary">
                  পড়া হয়েছে
                </SubmitButton>
              )}
              {m.status !== "RESOLVED" && (
                <SubmitButton name="op" value="RESOLVED" variant="secondary">
                  নিষ্পন্ন
                </SubmitButton>
              )}
              <SubmitButton name="op" value="delete" variant="danger" confirm="বার্তাটি মুছে যাবে। নিশ্চিত?">
                মুছুন
              </SubmitButton>
            </ActionForm>
          </li>
        ))}
      </ul>
    </>
  );
}
