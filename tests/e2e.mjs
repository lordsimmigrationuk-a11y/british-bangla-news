import { chromium } from "playwright";
// End-to-end checks against a freshly seeded local database (see README → Testing).
// Usage: BASE_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... node tests/e2e.mjs
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { execFileSync } from "child_process";
const base = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "test-password-123";
const S = mkdtempSync(join(tmpdir(), "bbn-e2e-"));
// Test fixtures: a valid JPEG and a tiny MP4 (needs ffmpeg; the video check is skipped without it).
const sharp = (await import("sharp")).default;
writeFileSync(
  join(S, "test.jpg"),
  await sharp({ create: { width: 2400, height: 1500, channels: 3, background: "#1e3c5a" } })
    .jpeg()
    .toBuffer(),
);
let hasVideo = true;
try {
  execFileSync("ffmpeg", [
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=size=320x240:rate=10:duration=1",
    "-pix_fmt",
    "yuv420p",
    "-y",
    join(S, "t.mp4"),
  ]);
} catch {
  hasVideo = false;
}
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);

const browser = await chromium.launch();
process.on("uncaughtException", (e) => {
  console.log(results.join("\n"));
  console.log("CRASH", e.message.split("\n")[0]);
  process.exit(1);
});
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await ctx.newPage();
page.on("dialog", (d) => d.accept());
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));

// Login as admin
await page.goto(base + "/admin/login");
await page.fill("#email", ADMIN_EMAIL);
await page.fill("#password", "wrong-password-xx");
await page.click("button[type=submit]");
await page.waitForSelector("form [role=alert]");
check("wrong password rejected", (await page.textContent("form [role=alert]")).includes("সঠিক নয়"));
await page.fill("#password", ADMIN_PASSWORD);
await page.click("button[type=submit]");
await page.waitForURL(base + "/admin");
check("admin login", true);

// Create a reporter
await page.goto(base + "/admin/users/new");
await page.fill("#email", "reporter@example.com");
await page.selectOption("#role", "REPORTER");
await page.fill("#password", "reporter-pass-1234");
await page.fill("#name", "পরীক্ষক প্রতিবেদক");
await page.fill("#slug", "test-reporter");
await page.click("button[type=submit]");
await page.waitForURL(/\/admin\/users\/.+\?done=created/);
check("create reporter user", true);

// New article as admin, with image, published
await page.goto(base + "/admin/articles/new");
await page.fill("#headline", "পরীক্ষামূলক প্রতিবেদন: স্বয়ংক্রিয় পরীক্ষা");
await page.fill("#summary", "এটি স্বয়ংক্রিয় পরীক্ষার জন্য তৈরি একটি প্রতিবেদন, যাচাইয়ের জন্য।");
await page.fill(
  "#body",
  "প্রথম অনুচ্ছেদ। অনন্যশব্দ পরীক্ষা।\n\n## উপশিরোনাম\n\n> একটি উদ্ধৃতি\n\n<script>alert(1)</script>\n\n[লিংক](javascript:alert(1))\n\nhttps://www.youtube.com/watch?v=dQw4w9WgXcQ\n\n- এক\n- দুই",
);
await page.selectOption("#categoryId", { label: "যুক্তরাজ্য" });
await page.setInputFiles("#image", `${S}/test.jpg`);
await page.fill("#imageAlt", "লাল আয়তক্ষেত্র");
await page.fill("#imageCredit", "পরীক্ষা");
await page.fill("#tags", "পরীক্ষা, অটোমেশন");
await page.fill("#slug", "automated-test-story");
await page.check("input[name=makeFeatured]");
await page.click("button[value=publish]");
await page.waitForURL(/\/admin\/articles\/.+\?done=publish/);
const articleUrl = page.url().split("?")[0];
check("publish article with image", true);

// Public page
let r = await page.goto(base + "/news/automated-test-story");
check("article live", r.status() === 200);
const html = await page.content();
check("script tag stripped", !html.includes("<script>alert(1)</script>") && !html.includes("javascript:alert"));
check("youtube embed rendered", html.includes("youtube-nocookie.com/embed/dQw4w9WgXcQ"));
check("NewsArticle JSON-LD", html.includes('"@type":"NewsArticle"'));
check("canonical", html.includes(`rel="canonical" href="${process.env.SITE_URL || base}/news/automated-test-story"`));
check("srcset webp", /srcSet="\/media\/img\/[^"]+-480\.webp 480w/i.test(html) || html.includes("-480.webp 480w"));
await page.goto(base + "/");
check("featured on homepage", (await page.textContent("main article h3")).includes("পরীক্ষামূলক প্রতিবেদন"));
const ns = await (await page.request.get(base + "/news-sitemap.xml")).text();
check("in news sitemap", ns.includes("automated-test-story"));
const sm = await (await page.request.get(base + "/sitemap.xml")).text();
check("in sitemap, samples excluded", sm.includes("automated-test-story") && !sm.includes("sample-uk-6"));

// Search Bengali
await page.goto(base + "/search?q=" + encodeURIComponent("অনন্যশব্দ"));
check("bengali body search", (await page.content()).includes("automated-test-story"));

// Slug change keeps old URL working
await page.goto(articleUrl);
await page.fill("#slug", "automated-test-story-renamed");
await page.check("input[name=isBreaking]");
await page.click("button[value=publish]");
await page.waitForURL(/done=publish/);
r = await page.request.get(base + "/news/automated-test-story", { maxRedirects: 0 });
check("old slug 308/301 redirect", [301, 308].includes(r.status()), String(r.status()));
await page.goto(base + "/");
check("breaking ticker shows", (await page.textContent("section[aria-label='ব্রেকিং নিউজ']")).includes("পরীক্ষামূলক"));

// Revision history
await page.goto(articleUrl);
const revs = await page.locator("#rev-h + ol > li").count();
check("revision history recorded", revs >= 2, `${revs} revisions`);

// Bad image upload rejected without losing text
await page.setInputFiles("#image", { name: "bad.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not an image") });
await page.fill("#imageAlt", "x");
await page.fill("#summary", "সম্পাদিত সারাংশ যা হারানো উচিত নয়, পরীক্ষার জন্য।");
await page.click("button[value=save]");
await page.waitForSelector("form [role=alert]");
check("invalid image rejected", (await page.textContent("form [role=alert]")).includes("বৈধ ছবি নয়"));
check("form text kept after error", (await page.inputValue("#summary")).startsWith("সম্পাদিত সারাংশ"));

// Video upload endpoint (admin session) and anonymous rejection
if (hasVideo) {
  const fs = await import("fs");
  const buf = fs.readFileSync(`${S}/t.mp4`);
  const up = await page.request.post(base + "/api/admin/upload-video", {
    headers: { "content-type": "video/mp4", origin: base },
    data: buf,
  });
  const j = await up.json();
  check("video upload (editor)", up.status() === 200 && !!j.id, String(up.status()));
  const anon = await (
    await browser.newContext()
  ).request.post(base + "/api/admin/upload-video", { headers: { "content-type": "video/mp4" }, data: buf });
  check("video upload rejected when signed out", anon.status() === 403, String(anon.status()));
  const bad = await page.request.post(base + "/api/admin/upload-video", {
    headers: { "content-type": "text/html", origin: base },
    data: "<h1>x</h1>",
  });
  check("non-video upload rejected", bad.status() === 415, String(bad.status()));
}

// Logout, login as reporter
await page.goto(base + "/admin");
await page.click("aside form button");
await page.waitForURL(base + "/admin/login");
await page.fill("#email", "reporter@example.com");
await page.fill("#password", "reporter-pass-1234");
await page.click("button[type=submit]");
await page.waitForURL(base + "/admin");
r = await page.goto(base + "/admin/settings");
check("reporter blocked from settings", page.url().includes("denied=1"));
await page.goto(base + "/admin/articles/new");
check("reporter has no publish button", (await page.locator("button[value=publish]").count()) === 0);
await page.fill("#headline", "প্রতিবেদকের খসড়া পরীক্ষা");
await page.fill("#summary", "প্রতিবেদকের লেখা একটি খসড়া, পরীক্ষার জন্য।");
await page.fill("#body", "খসড়ার মূল লেখা, পরীক্ষার জন্য যথেষ্ট দীর্ঘ।");
await page.selectOption("#categoryId", { label: "বাংলাদেশ" });
// Tamper with the button value to try to publish
await page.evaluate(() => {
  const b = document.querySelector("button[value=submit]");
  b.value = "publish";
});
await page.click("button[value=publish]");
await page.waitForSelector("form [role=alert]");
check("reporter cannot publish by tampering", (await page.textContent("form [role=alert]")).includes("শুধু সম্পাদকদের"));
await page.evaluate(() => {
  const b = document.querySelector("button[value=publish]");
  b.value = "submit";
});
await page.click("button[value=submit]");
await page.waitForURL(/done=submit/);
check("reporter submits for review", (await page.textContent("main")).includes("পর্যালোচনায়"));
const reporterArticle = page.url().split("?")[0];
r = await page.request.get(base + "/news/" + "x");
await page.goto(base + "/admin/articles");
const listCount = await page.locator("tbody tr").count();
check("reporter sees only own articles", listCount === 1, `${listCount} rows`);
// reporter can no longer edit after submit? (REVIEW is still editable by author by design)
await page.goto(reporterArticle);
check("reporter can still edit while in review", (await page.locator("#headline").count()) === 1);

// Contact form (public)
const pub = await browser.newPage();
await pub.goto(base + "/corrections");
await pub.fill("#cf-name", "পাঠক");
await pub.fill("#cf-email", "reader@example.com");
await pub.fill("#cf-message", "এই প্রতিবেদনে একটি তারিখ ভুল আছে বলে মনে হচ্ছে।");
await pub.click("#report form button[type=submit]");
await pub.waitForSelector("[role=status]");
check("correction form submitted", (await pub.textContent("[role=status]")).includes("সংশোধনের অনুরোধ"));

// View beacon
const vr = await pub.request.post(base + "/api/views", { data: { id: "aaaaaaaaaaaaaaaaaaaaaaaa" } });
check("view beacon accepts", vr.status() === 204);

// Mobile drawer keyboard
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(base + "/");
await m.click("button[aria-controls=mobile-menu]");
check("mobile drawer opens", await m.isVisible("#mobile-menu"));
await m.keyboard.press("Escape");
check("drawer closes on Escape", !(await m.isVisible("#mobile-menu")));
// Ticker pause
await m.click("section[aria-label='ব্রেকিং নিউজ'] button");
check("ticker pause toggles", (await m.getAttribute("section[aria-label='ব্রেকিং নিউজ'] .ticker", "data-paused")) === "true");

// Media path traversal
const t = await pub.request.get(base + "/media/..%2F..%2Fpackage.json");
check("media traversal blocked", t.status() === 404, String(t.status()));
const t2 = await pub.request.get(base + "/media/img/../../prisma/dev.db");
check("media non-media blocked", t2.status() === 404, String(t2.status()));

// Login rate limit
const lp = await browser.newPage();
let limited = false;
for (let i = 0; i < 7; i++) {
  await lp.goto(base + "/admin/login");
  await lp.fill("#email", "ratelimit@example.com");
  await lp.fill("#password", "nope-nope-nope");
  await lp.click("button[type=submit]");
  await lp.waitForSelector("form [role=alert]");
  if ((await lp.textContent("form [role=alert]")).includes("অনেকবার")) limited = true;
}
check("login rate limit", limited);

check("no page errors", errs.length === 0, errs.join("; "));
await browser.close();
console.log(results.join("\n"));
