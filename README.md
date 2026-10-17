# BRITISH BANGLA NEWS — news portal

A Bangla-language news website with its own newsroom (publishing system), built with
Next.js 16, TypeScript, Tailwind CSS and Prisma. Development runs on SQLite; production
runs on PostgreSQL.

- Public site: homepage, article, category/sub-category, search, author, tag, date archive,
  latest, popular, editors' picks, video and live pages, and the trust pages (about, contact,
  editorial policy, corrections, privacy, terms, advertise, team).
- Newsroom at `/admin`: roles, draft → review → scheduled/published → archived workflow,
  preview, revision history, featured story, breaking news, homepage section order, categories,
  videos, authors, information pages, reader messages and site settings.

## Contents

1. [Why this architecture](#why-this-architecture)
2. [Quick start (local)](#quick-start-local)
3. [Environment variables](#environment-variables)
4. [Newsroom guide](#newsroom-guide)
5. [Deploying to production](#deploying-to-production)
6. [Google Search setup](#google-search-setup)
7. [Analytics and advertising](#analytics-and-advertising)
8. [Security](#security)
9. [Backups and recovery](#backups-and-recovery)
10. [Testing and measured results](#testing-and-measured-results)
11. [What the owner must supply](#what-the-owner-must-supply)
12. [Known limitations](#known-limitations)
13. [Project structure](#project-structure)

## Why this architecture

**Custom Next.js app rather than WordPress.** The brief asked for server-rendered article pages,
strict control of structured data, a Bangla-first reading experience and a real editorial
workflow with roles. A single Next.js application delivers all of that in one codebase with no
plugin stack to keep patched. Every page is rendered on the server, so search engines receive the
full article HTML. The newsroom is part of the same app and uses the same database, so there is no
separate CMS to host or license.

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, server components, server actions), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 with brand tokens in `src/app/globals.css` |
| Database | Prisma 6 ORM. SQLite locally, PostgreSQL in production (one data model) |
| Auth | Email + password (bcrypt), random session tokens stored hashed, httpOnly cookies |
| Images | Uploads are decoded and re-encoded to WebP at 480/960/1600 px (EXIF/GPS stripped) |
| Fonts | Self-hosted Hind Siliguri (Bangla) and Inter (Latin) via `next/font/local` |

Rendering: pages are rendered per request from the database (Next's classic dynamic rendering;
`cacheComponents` is switched off in `next.config.ts`). This keeps publishing instant and simple.
Next.js says Cache Components will become the default in its next major version. When you upgrade,
follow `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`.

## Quick start (local)

Requirements: Node.js 20.9+ (22 LTS recommended) and npm. `ffmpeg` is optional (used only to
generate the sample videos).

```bash
npm ci
cp .env.example .env
# edit .env: set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters)
npx prisma db push          # create the SQLite database
npm run db:seed             # categories, pages, settings, first admin, sample content
npm run dev                 # http://localhost:3000  · newsroom: http://localhost:3000/admin
```

`npm run db:reset` wipes the local database and seeds again. To create or reset an admin later:
`ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run create-admin`.

### Sample content

The seed adds 41 fictional sample articles, 4 sample videos, 3 sample author profiles and
abstract placeholder images. All of it is marked as a sample:

- every card shows a **নমুনা** badge, and every sample article page shows a banner saying it is not real news;
- sample articles are `noindex`, are excluded from `sitemap.xml`, `news-sitemap.xml` and RSS, and carry no NewsArticle structured data;
- none of it describes real events, people or statistics.

Remove it all in **Admin → Settings → নমুনা কনটেন্ট মুছুন** before launch. You can also seed
production with `SEED_SAMPLE_CONTENT=false`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | `file:./dev.db` locally; `postgresql://…` in production |
| `SITE_URL` | yes | Public origin, e.g. `https://www.example.com` (canonical URLs, sitemaps, JSON-LD) |
| `UPLOAD_DIR` | yes | Folder for uploaded media. Must be persistent and backed up |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | when seeding | First administrator. Never commit them |
| `SEED_SAMPLE_CONTENT` | no | `false` to skip demo content |
| `NEWSROOM_TIMEZONE` | no | Defaults to `Asia/Dhaka` (dates, scheduling, archives) |
| `VIDEO_MAX_MB` | no | Upload limit for video files (default 200) |
| `COOKIE_SECURE` | no | Set `false` only to test a production build over plain http |

Everything else (social links, live stream, analytics, Search Console codes, ads, contact
emails) is edited by an administrator in **Admin → Settings** and stored in the database.
No secret keys are needed for the site to run.

## Newsroom guide

### Roles

| Role | Can do |
| --- | --- |
| **প্রতিবেদক (Reporter)** | Write articles, upload images, save drafts, submit for review, edit own work while it is a draft or in review. Cannot publish, schedule, flag breaking news or change site settings. |
| **সম্পাদক (Editor)** | Everything a reporter can, plus edit any article, publish, schedule, unpublish, archive, delete, set the lead story, breaking news, editors' picks, sponsored labels, homepage sections, categories, videos, information pages and reader messages. |
| **অ্যাডমিনিস্ট্রেটর (Administrator)** | Everything, plus users/roles and site settings. |

Permissions are enforced on the server in every action, not only by hiding buttons.

### Workflow

`খসড়া (Draft) → পর্যালোচনায় (Review) → নির্ধারিত (Scheduled) / প্রকাশিত (Published) → আর্কাইভ (Archived)`

- **Preview** shows the saved version with the real article template, for any status.
- **Schedule** takes a date and time in the newsroom timezone. The story goes live at that time automatically.
- **গুরুত্বপূর্ণ হালনাগাদ** (significant update) shows an "updated" time to readers and in structured data.
- Every save creates a **revision**. Any earlier revision can be restored.
- Changing a published article's URL slug keeps the old URL working (permanent redirect).

### Homepage, breaking news and popular stories

- **Lead story**: chosen manually in *প্রচ্ছদ ও ব্রেকিং* or with the "প্রধান সংবাদ" box on an article. There is no rotating carousel. If none is chosen, the newest story is used.
- **Breaking news**: only stories an editor flags appear in the strip, optionally with an expiry time. With no flagged stories, the strip is hidden. Readers can pause the scrolling ticker, and it never moves for people who prefer reduced motion. It can also be set to a static strip.
- **Homepage sections**: add, reorder, hide or remove category blocks, paired category blocks, popular, video and editors' picks.
- **জনপ্রিয় (Popular)**: ranked by anonymous daily view totals over a configurable window, topped up by the editorial rank you set on articles. You can switch to editorial ranking only. Counts are never shown to readers. No IP address, cookie or user ID is stored, and browsers sending Global Privacy Control or Do Not Track are not counted.

### Writing articles

The body uses Markdown, with a cheat sheet in the editor: blank line between paragraphs, `##`
subheading, `>` quote, `-` list, `**bold**`, `[text](https://…)`. A line containing only a
YouTube link becomes an embedded video (privacy-enhanced `youtube-nocookie.com`). All HTML is
sanitised on output, so scripts, event handlers and `javascript:` links are removed.

## Deploying to production

The app is a standard Node.js server (`next start`). It needs a **persistent disk** for
`UPLOAD_DIR`, so use a VPS, a container platform with a volume (Render, Railway, Fly.io, DigitalOcean
App Platform with a volume, or a Docker host). Serverless hosts with an ephemeral filesystem
(for example Vercel) are not suitable unless you first move uploads to object storage (see
[Known limitations](#known-limitations)).

1. **Create a PostgreSQL database** (14+), for example managed Postgres from your host.
2. **Set environment variables** on the server: `DATABASE_URL` (Postgres), `SITE_URL=https://your-domain`, `UPLOAD_DIR=/var/lib/bbn/uploads` (a persistent volume), and `NODE_ENV=production`.
3. **Build and migrate**:
   ```bash
   npm ci
   npm run postgres:schema        # regenerates prisma/postgres/schema.prisma from prisma/schema.prisma
   npm run postgres:migrate       # applies prisma/postgres/migrations to the database
   npm run build:postgres         # Prisma client for Postgres + next build
   ```
4. **Seed once**, with your real admin account and no demo content:
   ```bash
   ADMIN_EMAIL=you@yourdomain ADMIN_PASSWORD='a long passphrase' ADMIN_NAME='আপনার নাম' \
   SEED_SAMPLE_CONTENT=false DATABASE_URL=postgresql://… npx tsx prisma/seed.ts
   ```
   The seed script uses the generated Prisma client, so run it after `build:postgres`.
5. **Start** with `npm start` (port 3000, or set `PORT`) under a process manager (systemd, pm2 or your platform's runner).
6. **Put HTTPS in front** (your platform, Caddy or Nginx). Forward `Host`/`X-Forwarded-Host` and `X-Forwarded-For`. Server actions reject cross-origin form posts, so if a proxy rewrites the host, add it to `experimental.serverActions.allowedOrigins` in `next.config.ts`.
7. Sign in at `/admin`, then work through the **"প্রকাশের আগে যা করতে হবে"** checklist on the dashboard: delete sample content, verify the information pages, add contact emails and social links, and add the Search Console code.

### Railway, step by step

`railway.json` already tells Railway how to build (`npm run build:postgres`) and start
(`npm run start:production`, which applies database migrations, creates the categories, pages and
your admin account if they are missing, without sample content, and then starts the site). It is
safe to run on every restart.

1. Push this project to a GitHub repository.
2. In Railway, create a project, choose **Deploy from GitHub repo** and pick the repository.
3. In the same project, add **PostgreSQL** (Database → PostgreSQL).
4. On the website service, add a **Volume** mounted at `/data`.
5. On the website service, set these variables:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `SITE_URL` = `https://your-domain` (or the Railway URL until your domain is connected)
   - `UPLOAD_DIR` = `/data/uploads`
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ characters) and optionally `ADMIN_NAME`
6. Under **Settings → Networking**, generate a domain, or add your own domain and create the DNS
   record Railway shows at your domain registrar.
7. Open `/admin`, sign in and work through the launch checklist. Once signed in, you can remove
   `ADMIN_PASSWORD` from the variables; the account stays.

Tested locally on 17 October 2026 with PostgreSQL 16: migrations, admin creation, a restart (no
duplicates), every public page, and 32 end-to-end checks (the ticker pause check needs at least two
breaking stories, which an empty site does not have).

**Changing the data model later:** edit `prisma/schema.prisma`, run `npx prisma db push` locally,
then `npm run postgres:schema` and
`npx prisma migrate dev --schema prisma/postgres/schema.prisma --name <change>` against a
development Postgres to create the production migration. Commit it and run `postgres:migrate` on deploy.

**Scaling:** pages are rendered per request and each takes a handful of indexed queries
(roughly 10–40 ms locally). For heavy traffic, put a CDN in front for static assets and `/media/*`
(served with one-year immutable caching), run several app instances behind a load balancer, and
consider adopting Cache Components for page-level caching.

## Google Search setup

Implemented, following Google Search Central guidance:

- Unique `<title>` and meta description per page; self-referencing canonical URLs (page 2+ of listings are canonical to themselves).
- `NewsArticle` JSON-LD (headline, images, `datePublished`, `dateModified`, author with profile URL, publisher with logo). It always matches the visible page, and sponsored posts use `AdvertiserContentArticle`. Also `BreadcrumbList` on article and listing pages, `NewsMediaOrganization` and `WebSite` with SearchAction on the homepage, `VideoObject` on video pages, and `ProfilePage` on author pages.
- `/sitemap.xml` (all live content), `/news-sitemap.xml` (Google News format, last 48 hours, max 1,000), `/feed.xml` (RSS) and `/robots.txt` (blocks `/admin`, `/preview` and `/api`).
- Open Graph and Twitter card tags, `max-image-preview:large` and stable `/news/<slug>` URLs.
- Article text is in the server HTML. Pagination uses crawlable `?page=N` links.

To connect Search Console:

1. Add a **Domain** property at <https://search.google.com/search-console> and verify it by DNS, or use a URL-prefix property and paste the HTML-tag code into **Admin → Settings → Google Search Console যাচাই কোড**.
2. Under *Sitemaps*, submit `https://your-domain/sitemap.xml` and `https://your-domain/news-sitemap.xml`.
3. Use *URL Inspection* on a published article to confirm Google sees the rendered content, and check *Enhancements* for structured-data reports.
4. For Google News visibility, Google decides automatically based on its content policies. You can manage how your publication appears in Google Publisher Center.

None of this guarantees rankings, Google News inclusion or Discover traffic. Those depend on
Google's systems and on the quality and originality of your reporting.

## Analytics and advertising

Both are **off by default** and load no scripts until an administrator configures them.

- **Analytics**: enter a GA4 Measurement ID in Settings. Google Analytics sets cookies. Under UK PECR/GDPR and EU rules you need prior consent for analytics cookies, and **this site does not include a consent banner**. Before enabling GA4, add a consent management platform (CMP), or use a cookieless analytics product instead.
- **Ads**: placements exist for the homepage banner, category pages, the article sidebar, in-article (after the 4th paragraph, only in long articles) and mobile. Each slot is labelled "বিজ্ঞাপন" and reserves its space to avoid layout shift. To enable them, enter your AdSense publisher ID (`ca-pub-…`) and slot IDs, then tick *বিজ্ঞাপন চালু*. For UK/EEA visitors, Google requires a Google-certified CMP for personalised ads. Sponsored articles are a separate feature and always show a "স্পনসরড" label.

## Security

- Passwords are hashed with bcrypt (cost 12) and must be at least 12 characters. No password or key is stored in the source.
- Sessions use 32-byte random tokens stored as SHA-256 hashes. Cookies are `httpOnly`, `SameSite=Lax` and `Secure` in production, last 14 days, and are revoked when a password or role changes or an account is deactivated.
- Login is rate-limited (5 attempts per email and 30 per IP every 15 minutes) with uniform timing for unknown emails. Contact forms are rate-limited and include a honeypot field.
- Every server action re-checks the session and role. All input is validated with Zod.
- Article HTML is sanitised with an allow-list. Only `youtube-nocookie.com` iframes are permitted.
- Uploaded images are decoded with sharp and re-encoded (which strips EXIF/GPS metadata). Videos are limited to MP4/WebM with a size cap and are streamed to disk only after an auth check. Media is served only from `UPLOAD_DIR`, with path-traversal checks.
- Security headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` and HSTS. `/admin` is also `noindex`.
- **Rate limits are in memory**, so they apply per server process. With several instances, add a shared limiter (for example Redis) or rely on your proxy/WAF (such as Cloudflare rate limiting).
- A Content-Security-Policy header is not set yet. Add one when your analytics and ad providers are final.

## Backups and recovery

Back up two things: **the database** and **`UPLOAD_DIR`**.

- Database: run a nightly `pg_dump -Fc "$DATABASE_URL" > bbn-$(date +%F).dump` (or your host's automated backups with point-in-time recovery). Keep at least 14 daily and 8 weekly copies, stored off the server.
- Uploads: sync `UPLOAD_DIR` nightly to object storage (for example `rclone sync` or `aws s3 sync`). Files are never modified after upload, so incremental sync is cheap.
- Recovery: provision a database, restore with `pg_restore -d "$DATABASE_URL" --clean bbn-YYYY-MM-DD.dump`, restore `UPLOAD_DIR`, deploy the same app version and start it. **Test a restore every quarter.**

## Testing and measured results

Commands: `npm run typecheck`, `npm run lint`, `npm run build`.

Browser tests live in `tests/` and run against a freshly seeded local database:

```bash
npx playwright install chromium        # once
npm run db:reset && npm run build && npm start   # in another terminal
BASE_URL=http://localhost:3000 ADMIN_EMAIL=… ADMIN_PASSWORD=… node tests/e2e.mjs
BASE_URL=http://localhost:3000 node tests/a11y.mjs
```

Results on the build delivered with this README:

- `tests/e2e.mjs`: **37/37 checks passed.** They cover login and rate limiting, creating a reporter, publishing with an image, HTML sanitising, the YouTube embed, JSON-LD, canonical URLs, responsive `srcset`, lead story, breaking strip, sitemaps excluding samples, Bangla full-text search, old-slug redirects, revision history, rejection of invalid uploads without losing typed text, reporters being blocked from settings and from publishing (including by tampering with the form), the corrections form, the view counter, the mobile drawer (opens and closes with Escape), pausing the ticker, video upload auth, media path traversal, and pages throwing no JavaScript errors.
- `tests/a11y.mjs` (axe-core, WCAG 2.1 A/AA and best practices, desktop and phone): **no violations** on 14 key pages.
- Layouts were checked at 1366, 820 and 390 px wide with no horizontal scrolling.
- Lighthouse 12 mobile (simulated slow 4G and 4× CPU) against a local production build:

  | Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | Home | 83 | 100 | 100 | 100 | 4.1 s | 0 | 60 ms |
  | Article | 87 | 100 | 100 | 69* | 3.8 s | 0 | 120 ms |
  | Category | 84 | 100 | 100 | 100 | 4.4 s | 0 | 70 ms |

  \*SEO 69 is expected because sample articles are deliberately `noindex`. A real article scores 100.
  LCP is the area to improve. It is held back by the Bangla web fonts loading on a simulated slow
  connection. A CDN close to readers helps, and so does switching `display` to `"optional"` in
  `src/app/fonts.ts` if you prefer speed over guaranteed typography. Measure again on your
  real host, because these numbers come from a local container, not production.

## What the owner must supply

- A domain, hosting with a persistent disk, and a PostgreSQL database.
- Verified publisher details for the **About, Contact, Privacy and Terms** pages: legal name, address, editor and data controller. These pages show a "draft information" notice until you untick *এখনও খসড়া তথ্য*. Nothing was invented, and the placeholders are in square brackets.
- Real staff accounts and author bios (designations and bios must be factual).
- Official social media URLs, contact emails, and optionally a YouTube live-stream URL (only while actually live).
- Licensed photographs for every story.
- Optionally: a GA4 ID plus a consent tool, an AdSense account plus a CMP, and a Search Console verification code.

## Known limitations

- **Bangla only.** There is no language switcher, so no English edition is implemented. The header has no switcher, by design.
- **Markdown editor**, not a WYSIWYG editor. Inline images inside the article body are not supported (each article has one featured image plus optional YouTube embeds).
- **Uploads are stored on local disk.** Moving them to S3/R2-compatible object storage requires changing `src/lib/media-core.ts` and the `/media` route.
- **No outgoing email.** Contact and correction messages are stored and shown in *Admin → বার্তা*, and nobody is notified by email.
- **Search** uses database `LIKE` matching (case-insensitive on Postgres), which works for Bangla and is fine for tens of thousands of articles. For larger archives, add PostgreSQL full-text or trigram search.
- **Rate limits and the view-count de-duplication are per process** (see Security).
- **No password-reset email.** An administrator resets passwords in *Admin → ব্যবহারকারী*, or with `npm run create-admin`.

## Project structure

```
prisma/schema.prisma           data model (SQLite); prisma/postgres/ holds the generated Postgres schema + migrations
prisma/seed.ts, seed-content.ts categories, pages, settings, first admin, labelled sample content
public/brand/                  official logo (original file untouched) and resized copies
src/app/(site)/                public pages
src/app/admin/                 newsroom (login, dashboard, articles, homepage, categories, videos, pages, messages, users, settings)
src/app/media/[...path]        serves uploaded media
src/app/api/views              anonymous view counter
src/app/sitemap.ts, robots.ts, news-sitemap.xml/, feed.xml/
src/components/site            header, navigation, breaking ticker, footer, breadcrumbs, pagination, ad slot
src/components/news            article cards, article view, share buttons, video card
src/components/admin           forms and admin UI
src/lib                        db, auth, permissions, queries, settings, markdown, media, SEO helpers, formatting
tests/                         Playwright end-to-end and axe accessibility checks
```

The logo in `public/brand/british-bangla-news-logo-original.png` is the supplied file,
unmodified. The other sizes are proportional resizes of its artwork, cropped only to remove
the transparent margin.
