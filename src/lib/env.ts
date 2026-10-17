export function siteUrl(): string {
  const raw = process.env.SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function uploadDir(): string {
  return process.env.UPLOAD_DIR || "./storage/uploads";
}
