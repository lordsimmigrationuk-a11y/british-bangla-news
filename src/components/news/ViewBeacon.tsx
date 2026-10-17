"use client";

import { useEffect } from "react";

/** Counts one anonymous view per page load. Skipped when the browser sends Global Privacy Control or Do Not Track. */
export function ViewBeacon({ articleId }: { articleId: string }) {
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.globalPrivacyControl || nav.doNotTrack === "1") return;
    const body = JSON.stringify({ id: articleId });
    if (!navigator.sendBeacon?.("/api/views", new Blob([body], { type: "application/json" }))) {
      fetch("/api/views", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
    }
  }, [articleId]);
  return null;
}
