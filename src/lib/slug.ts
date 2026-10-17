export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ঀ-৿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

/** ASCII-only slug for URLs; falls back to a date-based slug when the text has no Latin characters. */
export function asciiSlug(input: string, fallbackPrefix = "news"): string {
  const s = input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  if (s.length >= 3) return s;
  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `${fallbackPrefix}-${stamp}-${Math.random().toString(36).slice(2, 7)}`;
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
