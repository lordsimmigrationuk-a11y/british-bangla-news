import "server-only";
import { Marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { youtubeId, youtubeEmbedUrl } from "./youtube";

const marked = new Marked({ gfm: true, breaks: false });

/** A line holding only a YouTube link becomes a responsive, privacy-enhanced embed. */
function expandEmbeds(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!/^https?:\/\/\S+$/.test(t)) return line;
      const id = youtubeId(t);
      if (!id) return line;
      return `\n<div class="video-embed"><iframe src="${youtubeEmbedUrl(id)}" title="ভিডিও" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n`;
    })
    .join("\n");
}

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "ul",
    "ol",
    "li",
    "strong",
    "em",
    "b",
    "i",
    "a",
    "br",
    "hr",
    "figure",
    "figcaption",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "code",
    "pre",
    "div",
    "iframe",
    "cite",
    "sup",
    "sub",
  ],
  allowedAttributes: {
    a: ["href", "title", "rel", "target"],
    div: ["class"],
    iframe: ["src", "title", "loading", "allow", "allowfullscreen"],
    th: ["scope"],
  },
  allowedClasses: { div: ["video-embed"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowedIframeHostnames: ["www.youtube-nocookie.com"],
  transformTags: {
    // Article bodies start at h2 because the headline is the page's only h1.
    h1: "h2",
    a: (tagName, attribs) => {
      const external = /^https?:\/\//.test(attribs.href ?? "");
      return {
        tagName,
        attribs: external ? { ...attribs, rel: "noopener noreferrer", target: "_blank" } : attribs,
      };
    },
  },
};

export function renderArticleBody(md: string): string {
  const raw = marked.parse(expandEmbeds(md), { async: false }) as string;
  return sanitizeHtml(raw, SANITIZE);
}

/** Split rendered HTML after the nth paragraph so an in-article slot can sit between them. */
export function splitAfterParagraph(html: string, n: number): [string, string] | null {
  let idx = -1;
  let pos = 0;
  for (let i = 0; i < n; i++) {
    idx = html.indexOf("</p>", pos);
    if (idx === -1) return null;
    pos = idx + 4;
  }
  if (html.slice(pos).split("</p>").length < 3) return null;
  return [html.slice(0, pos), html.slice(pos)];
}

export function plainText(md: string, max = 300): string {
  const text = md
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~\[\]()!|-]/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}
