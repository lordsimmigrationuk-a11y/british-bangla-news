/**
 * Seeds categories, homepage sections, information pages and default settings.
 * Sample (demo) articles, videos and authors are added only when SEED_SAMPLE_CONTENT
 * is not "false"; they are all marked as samples and can be removed in Admin → Settings.
 * The first administrator is created from ADMIN_EMAIL / ADMIN_PASSWORD (never hardcoded).
 *
 * Run with: npm run db:seed   (safe to re-run: existing rows are left alone)
 */
import { execFileSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";
import { saveImageBuffer } from "../src/lib/media-core";
import { uploadDir } from "../src/lib/env";
import { CATEGORIES, PAGES, SAMPLE_ARTICLES, SAMPLE_AUTHORS, SAMPLE_VIDEOS, sampleBody } from "./seed-content";

const PALETTES = [
  ["#2b3a42", "#3f5765", "#bdd4de", "#efefef"],
  ["#3b2f2f", "#6b4f4f", "#d9c5b2", "#f3ede6"],
  ["#1f3b2d", "#2f5d47", "#a8c3a0", "#eef3ea"],
  ["#2a2d43", "#414770", "#c4c9e2", "#f0f1f7"],
  ["#40332a", "#7a6248", "#e0cfa9", "#f7f2e6"],
  ["#2f2f2f", "#5a5a5a", "#c9c9c9", "#f2f2f2"],
  ["#173f4f", "#2c6e7f", "#9fd0d8", "#eaf5f7"],
  ["#4a2530", "#7d3c4c", "#e1b7c0", "#f8eef0"],
];

/** Abstract placeholder "photograph" clearly labelled as a sample image. */
function placeholderSvg(i: number, w = 1600, h = 900) {
  const [d, m, l, bg] = PALETTES[i % PALETTES.length];
  const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
  const blocks = Array.from({ length: 9 }, (_, k) => {
    const bw = 90 + r(k) * 160;
    const bh = 160 + r(k + 20) * 380;
    const x = k * (w / 9) + r(k + 40) * 30;
    return `<rect x="${x.toFixed(0)}" y="${(h - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="${k % 2 ? d : m}" opacity="0.9"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${l}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <circle cx="${(w * (0.2 + r(1) * 0.6)).toFixed(0)}" cy="${(h * 0.3).toFixed(0)}" r="${(90 + r(2) * 80).toFixed(0)}" fill="#ffffff" opacity="0.55"/>
  <path d="M0 ${h * 0.72} Q ${w * 0.3} ${h * (0.55 + r(3) * 0.1)} ${w * 0.55} ${h * 0.7} T ${w} ${h * 0.66} V ${h} H 0 Z" fill="${l}" opacity="0.7"/>
  ${blocks}
  <rect x="${w - 380}" y="28" width="350" height="56" rx="4" fill="#000000" opacity="0.55"/>
  <text x="${w - 205}" y="66" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff" letter-spacing="3">SAMPLE IMAGE</text>
</svg>`;
}

async function sampleImage(i: number, alt: string) {
  const buf = await sharp(Buffer.from(placeholderSvg(i)))
    .png()
    .toBuffer();
  return saveImageBuffer(buf, { alt, credit: "নমুনা ছবি (প্রতিস্থাপনযোগ্য)", isSample: true });
}

async function sampleVideoFile(i: number): Promise<string | null> {
  const rel = `video/sample/sample-${i}-${randomBytes(4).toString("hex")}.mp4`;
  const abs = path.join(uploadDir(), rel);
  await mkdir(path.dirname(abs), { recursive: true });
  try {
    execFileSync(
      "ffmpeg",
      [
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        `testsrc2=size=1280x720:rate=25:duration=6`,
        "-pix_fmt",
        "yuv420p",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "30",
        "-movflags",
        "+faststart",
        "-y",
        abs,
      ],
      { stdio: "ignore" },
    );
    return rel;
  } catch {
    await rm(abs, { force: true });
    return null;
  }
}

async function main() {
  const now = Date.now();

  // Categories
  for (const [i, c] of CATEGORIES.entries()) {
    const parent = await db.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name, description: c.description, order: (i + 1) * 10 },
      update: {},
    });
    for (const [j, ch] of (c.children ?? []).entries()) {
      await db.category.upsert({
        where: { slug: ch.slug },
        create: { slug: ch.slug, name: ch.name, parentId: parent.id, order: (j + 1) * 10, showInNav: false },
        update: {},
      });
    }
  }
  const cat = async (slug: string) => (await db.category.findUniqueOrThrow({ where: { slug } })).id;

  // Homepage sections
  if ((await db.homeSection.count()) === 0) {
    const sections: { kind: string; title: string; c1?: string; c2?: string }[] = [
      { kind: "CATEGORY", title: "বাংলাদেশ", c1: "bangladesh" },
      { kind: "CATEGORY", title: "যুক্তরাজ্য", c1: "uk" },
      { kind: "CATEGORY", title: "আন্তর্জাতিক", c1: "international" },
      { kind: "POPULAR", title: "জনপ্রিয় সংবাদ" },
      { kind: "CATEGORY_PAIR", title: "রাজনীতি ও অর্থনীতি", c1: "politics", c2: "economy" },
      { kind: "CATEGORY_PAIR", title: "শিক্ষা ও প্রযুক্তি", c1: "education", c2: "technology" },
      { kind: "VIDEO", title: "ভিডিও সংবাদ" },
      { kind: "CATEGORY", title: "খেলাধুলা", c1: "sports" },
      { kind: "CATEGORY", title: "বিনোদন ও জীবনযাপন", c1: "entertainment" },
      { kind: "CATEGORY_PAIR", title: "প্রবাস ও মতামত", c1: "probash", c2: "opinion" },
      { kind: "EDITORS_PICK", title: "সম্পাদকীয় নির্বাচন" },
    ];
    for (const [i, s] of sections.entries()) {
      await db.homeSection.create({
        data: {
          kind: s.kind,
          title: s.title,
          order: (i + 1) * 10,
          categoryId: s.c1 ? await cat(s.c1) : null,
          category2Id: s.c2 ? await cat(s.c2) : null,
        },
      });
    }
  }

  // Information pages
  for (const p of PAGES) {
    await db.page.upsert({ where: { slug: p.slug }, create: { ...p, isPlaceholder: true }, update: {} });
  }

  // First administrator from environment variables
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  let adminId: string | null = null;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
    const existing = await db.user.findUnique({ where: { email: adminEmail } });
    if (existing) {
      adminId = existing.id;
    } else {
      const u = await db.user.create({
        data: {
          email: adminEmail,
          name: process.env.ADMIN_NAME?.trim() || "অ্যাডমিন",
          slug: "admin-" + randomBytes(3).toString("hex"),
          role: "ADMIN",
          passwordHash: await bcrypt.hash(adminPassword, 12),
          showOnTeam: false,
        },
      });
      adminId = u.id;
      console.log(`Created administrator ${adminEmail}`);
    }
  } else {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set: no administrator created. Set them and re-run `npm run db:seed`.");
  }

  if (process.env.SEED_SAMPLE_CONTENT === "false") return;
  if (await db.article.count({ where: { isSample: true } })) {
    console.log("Sample content already present; skipping.");
    return;
  }

  // Sample authors (byline-only profiles; they cannot log in)
  const authors = [];
  for (const a of SAMPLE_AUTHORS) {
    authors.push(
      await db.user.upsert({
        where: { slug: a.slug },
        create: {
          email: `${a.slug}@example.invalid`,
          name: a.name,
          slug: a.slug,
          designation: a.designation,
          bio: "এটি একটি নমুনা লেখক প্রোফাইল। প্রকৃত সংবাদকর্মীর যাচাই করা তথ্য দিয়ে প্রতিস্থাপন করুন বা মুছে ফেলুন।",
          role: "REPORTER",
          passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 10),
          canLogin: false,
          isSample: true,
        },
        update: {},
      }),
    );
  }

  console.log("Generating sample images…");
  const images = [];
  for (let i = 0; i < 16; i++) images.push(await sampleImage(i, "নমুনা ছবি: বিমূর্ত নকশা, কোনো প্রকৃত দৃশ্য নয়"));

  for (const [i, a] of SAMPLE_ARTICLES.entries()) {
    const minutesAgo = 12 + i * 95; // spread over roughly the last three days
    const tagIds = [];
    for (const name of a.tags) {
      const slug = name.replace(/\s+/g, "-");
      const t = await db.tag.upsert({ where: { name }, create: { name, slug }, update: {} });
      tagIds.push(t.id);
    }
    const art = await db.article.create({
      data: {
        slug: `sample-${a.cat}-${i + 1}`,
        headline: a.headline,
        summary: a.summary,
        body: sampleBody(a),
        status: "PUBLISHED",
        categoryId: await cat(a.cat),
        subcategoryId: a.sub ? await cat(a.sub) : null,
        authorId: authors[a.author].id,
        featuredImageId: images[i % images.length].id,
        imageCaption: "নমুনা ক্যাপশন: প্রকৃত ছবির বিবরণ এখানে থাকবে।",
        isEditorsPick: !!a.pick,
        editorialRank: a.rank ?? 0,
        isBreaking: !!a.breaking,
        isSample: true,
        publishedAt: new Date(now - minutesAgo * 60_000),
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    });
    await db.articleRevision.create({
      data: {
        articleId: art.id,
        editorId: adminId,
        headline: art.headline,
        summary: art.summary,
        body: art.body,
        status: art.status,
        note: "নমুনা কনটেন্ট যোগ",
      },
    });
  }

  // Workflow examples: one in review, one scheduled
  const wf = [
    { status: "REVIEW", headline: "নমুনা খসড়া: পর্যালোচনার অপেক্ষায় থাকা একটি প্রতিবেদন", at: null as Date | null },
    { status: "SCHEDULED", headline: "নমুনা: আগামীকাল প্রকাশের জন্য নির্ধারিত একটি প্রতিবেদন", at: new Date(now + 24 * 3600_000) },
  ];
  for (const [k, w] of wf.entries()) {
    await db.article.create({
      data: {
        slug: `sample-workflow-${k + 1}`,
        headline: w.headline,
        summary: "প্রকাশনা কর্মপ্রবাহ দেখানোর জন্য নমুনা।",
        body: sampleBody({ cat: "bangladesh", headline: w.headline, summary: "", tags: [], author: 0 }),
        status: w.status,
        publishedAt: w.at,
        categoryId: await cat("bangladesh"),
        authorId: authors[0].id,
        isSample: true,
      },
    });
  }

  // Sample videos
  console.log("Generating sample videos…");
  for (const [i, v] of SAMPLE_VIDEOS.entries()) {
    const rel = await sampleVideoFile(i);
    if (!rel) {
      console.log("ffmpeg not available: sample videos skipped.");
      break;
    }
    const file = await db.media.create({ data: { kind: "video", path: rel, mime: "video/mp4", isSample: true } });
    const thumb = await sampleImage(i + 3, "নমুনা ভিডিওর থাম্বনেইল");
    await db.video.create({
      data: {
        slug: `sample-video-${i + 1}`,
        title: v.title,
        description: v.description,
        fileId: file.id,
        thumbnailId: thumb.id,
        status: "PUBLISHED",
        isSample: true,
        publishedAt: new Date(now - (i + 1) * 5 * 3600_000),
      },
    });
  }
  console.log(`Seeded ${SAMPLE_ARTICLES.length} sample articles.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
