import { headers } from "next/headers";
import { createHash } from "node:crypto";

export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** One-way hash used only as an in-memory rate-limit key; never persisted. */
export function hashKey(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}
