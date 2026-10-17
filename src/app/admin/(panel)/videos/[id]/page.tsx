import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { PageHeader, Card, Field, Notice, inputCls } from "@/components/admin/ui";
import { VideoUploader } from "@/components/admin/VideoUploader";
import { ResponsiveImage } from "@/components/news/ResponsiveImage";
import { saveVideo, deleteVideo } from "../actions";

export const metadata: Metadata = { title: "ভিডিও সম্পাদনা" };

/** Handles both /admin/videos/new and /admin/videos/<id>. */
export default async function EditVideo({ params, searchParams }: PageProps<"/admin/videos/[id]">) {
  await requireUser(["ADMIN", "EDITOR"]);
  const { id } = await params;
  const { done } = await searchParams;
  const v = id === "new" ? null : await db.video.findUnique({ where: { id }, include: { thumbnail: true, file: true } });
  if (id !== "new" && !v) notFound();
  const maxMb = Number(process.env.VIDEO_MAX_MB || 200);
  return (
    <>
      <PageHeader title={v ? "ভিডিও সম্পাদনা" : "নতুন ভিডিও"} />
      {done && <Notice>সংরক্ষিত হয়েছে।</Notice>}
      <ActionForm action={saveVideo} className="space-y-6">
        <input type="hidden" name="id" value={v?.id ?? ""} />
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="শিরোনাম" htmlFor="title" className="sm:col-span-2">
              <input id="title" name="title" required defaultValue={v?.title} className={inputCls} />
            </Field>
            <Field label="বিবরণ" htmlFor="description" className="sm:col-span-2">
              <textarea id="description" name="description" rows={4} defaultValue={v?.description} className={inputCls} />
            </Field>
            <Field label="YouTube লিংক" htmlFor="youtube" hint="YouTube ভিডিও হলে এখানে লিংক দিন।">
              <input
                id="youtube"
                name="youtube"
                type="url"
                defaultValue={v?.youtubeId ? `https://www.youtube.com/watch?v=${v.youtubeId}` : ""}
                className={inputCls}
              />
            </Field>
            <Field
              label="অথবা ভিডিও ফাইল (MP4/WebM)"
              htmlFor="video-file"
              hint={`সর্বোচ্চ ${maxMb} MB। বড় ফাইলের জন্য YouTube বা ভিডিও হোস্টিং ব্যবহার করা ভালো।`}
            >
              <VideoUploader currentName={v?.file?.path ?? null} />
            </Field>
            <Field label="থাম্বনেইল ছবি" htmlFor="thumbnail" hint="YouTube ভিডিওর ক্ষেত্রে না দিলে YouTube-এর থাম্বনেইল দেখাবে।">
              {v?.thumbnail && (
                <div className="mt-1 w-48">
                  <ResponsiveImage image={v.thumbnail} sizes="192px" />
                </div>
              )}
              <input id="thumbnail" name="thumbnail" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-sm" />
            </Field>
            <Field label="URL স্লাগ" htmlFor="slug" hint="খালি রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে।">
              <input id="slug" name="slug" defaultValue={v?.slug ?? ""} className={inputCls} lang="en" />
            </Field>
            <Field label="অবস্থা" htmlFor="status">
              <select id="status" name="status" defaultValue={v?.status ?? "DRAFT"} className={inputCls}>
                <option value="DRAFT">খসড়া</option>
                <option value="PUBLISHED">প্রকাশিত</option>
                <option value="ARCHIVED">আর্কাইভ</option>
              </select>
            </Field>
          </div>
        </Card>
        <SubmitButton>সংরক্ষণ</SubmitButton>
      </ActionForm>
      {v && (
        <ActionForm action={deleteVideo} className="mt-6">
          <input type="hidden" name="id" value={v.id} />
          <SubmitButton variant="danger" confirm="ভিডিওটি মুছে যাবে। নিশ্চিত?">
            ভিডিও মুছুন
          </SubmitButton>
        </ActionForm>
      )}
    </>
  );
}
