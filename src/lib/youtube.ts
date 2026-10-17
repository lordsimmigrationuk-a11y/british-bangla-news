/** Extract an 11-character YouTube video id from common URL shapes or a bare id. */
export function youtubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return valid(u.pathname.slice(1));
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.searchParams.get("v")) return valid(u.searchParams.get("v")!);
      const m = /^\/(embed|shorts|live)\/([^/?#]+)/.exec(u.pathname);
      if (m) return valid(m[2]);
    }
  } catch {
    return null;
  }
  return null;
}
const valid = (id: string) => (/^[A-Za-z0-9_-]{11}$/.test(id) ? id : null);

export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
