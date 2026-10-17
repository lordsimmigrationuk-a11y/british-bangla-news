import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { youtubeEmbedUrl, youtubeId } from "@/lib/youtube";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const metadata: Metadata = { title: "সরাসরি সম্প্রচার", alternates: { canonical: "/live" } };

/** Exists only while an editor has configured a live-stream URL; otherwise 404. */
export default async function LivePage() {
  const s = await getSettings();
  const id = youtubeId(s.liveStreamUrl);
  if (!id) notFound();
  return (
    <main className="mx-auto max-w-5xl px-4 pt-5">
      <Breadcrumbs
        items={[
          { name: "প্রচ্ছদ", path: "/" },
          { name: "সরাসরি", path: "/live" },
        ]}
      />
      <h1 className="mt-4 text-3xl font-bold">সরাসরি সম্প্রচার</h1>
      <p className="mt-1 text-muted">সম্প্রচার চালু না থাকলে ভিডিও প্লেয়ারে পরবর্তী সময়সূচি বা আগের রেকর্ডিং দেখা যেতে পারে।</p>
      <div className="video-embed mt-5">
        <iframe src={youtubeEmbedUrl(id)} title="সরাসরি সম্প্রচার" allow="encrypted-media; picture-in-picture" allowFullScreen />
      </div>
    </main>
  );
}
