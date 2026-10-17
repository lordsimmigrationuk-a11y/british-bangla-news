"use client";

import { useState } from "react";

/** Uploads a video file straight to the upload endpoint, then puts the resulting media id in a hidden field. */
export function VideoUploader({ currentName }: { currentName: string | null }) {
  const [fileId, setFileId] = useState("");
  const [status, setStatus] = useState(currentName ? `বর্তমান ফাইল: ${currentName.split("/").pop()}` : "");
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus("আপলোড হচ্ছে…");
    try {
      const res = await fetch("/api/admin/upload-video", {
        method: "POST",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "আপলোড ব্যর্থ হয়েছে।");
      setFileId(data.id);
      setStatus("আপলোড সম্পন্ন। সংরক্ষণ করুন।");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1">
      <input id="video-file" type="file" accept="video/mp4,video/webm" onChange={onChange} disabled={busy} className="block text-sm" />
      <input type="hidden" name="fileId" value={fileId} />
      <p role="status" aria-live="polite" className="mt-1 text-xs text-muted">
        {status}
      </p>
    </div>
  );
}
