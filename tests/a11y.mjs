import { chromium } from "playwright";
import { readFileSync } from "fs";
const axe = readFileSync(new URL("../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const base = process.env.BASE_URL || "http://localhost:3000";
const paths = [
  "/",
  "/news/sample-uk-6",
  "/category/uk",
  "/search?q=প্রবাসী",
  "/search?q=zzzz",
  "/latest",
  "/video",
  "/video/sample-video-1",
  "/contact",
  "/corrections",
  "/team",
  "/archive",
  "/author/sample-reporter",
  "/admin/login",
];
const browser = await chromium.launch();
for (const vp of [
  [1366, 900],
  [390, 844],
]) {
  const page = await browser.newPage({ viewport: { width: vp[0], height: vp[1] } });
  for (const p of paths) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.addScriptTag({ content: axe });
    const r = await page.evaluate(async () => {
      const res = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"] });
      return res.violations.map(
        (v) =>
          `${v.impact} ${v.id} (${v.nodes.length}): ${v.nodes
            .slice(0, 2)
            .map((n) => n.target.join(" "))
            .join(" | ")}`,
      );
    });
    console.log(`${vp[0]} ${p}: ${r.length ? "\n  " + r.join("\n  ") : "OK"}`);
  }
  await page.close();
}
await browser.close();
