import Link from "next/link";
import type { Article, Category, Media, User, Tag, ArticleTag } from "@prisma/client";
import { ActionForm, SubmitButton } from "./ActionForm";
import { Check, Field, StatusBadge, inputCls } from "./ui";
import { ResponsiveImage } from "../news/ResponsiveImage";
import { saveArticle } from "@/app/admin/(panel)/articles/actions";
import { utcToZonedLocal, formatDateTime, newsroomTimezone } from "@/lib/format";
import type { SessionUser } from "@/lib/auth";
import { canPublish } from "@/lib/permissions";

type Full = Article & { featuredImage: Media | null; tags: (ArticleTag & { tag: Tag })[] };

export function ArticleForm({
  article,
  user,
  categories,
  authors,
  isFeatured,
}: {
  article: Full | null;
  user: SessionUser;
  categories: (Category & { children: Category[] })[];
  authors: Pick<User, "id" | "name">[];
  isFeatured: boolean;
}) {
  const a = article;
  const editor = canPublish(user);
  const isLive = a && (a.status === "PUBLISHED" || a.status === "SCHEDULED");
  const tz = newsroomTimezone();

  return (
    <ActionForm action={saveArticle} className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <input type="hidden" name="id" value={a?.id ?? ""} />
      <div className="space-y-5">
        <div className="space-y-5 rounded border border-line bg-white p-5">
          <Field label="শিরোনাম *" htmlFor="headline">
            <input
              id="headline"
              name="headline"
              required
              maxLength={250}
              defaultValue={a?.headline}
              className={`${inputCls} text-xl font-bold`}
            />
          </Field>
          <Field label="সারাংশ *" htmlFor="summary" hint="শিরোনামের নিচে ও তালিকায় দেখানো হয়। ১–২ বাক্য।">
            <textarea id="summary" name="summary" required rows={3} maxLength={600} defaultValue={a?.summary} className={inputCls} />
          </Field>
          <Field
            label="মূল লেখা *"
            htmlFor="body"
            hint={
              <details>
                <summary className="cursor-pointer font-semibold">লেখার ফরম্যাট (Markdown)</summary>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  <li>অনুচ্ছেদের মাঝে একটি ফাঁকা লাইন রাখুন।</li>
                  <li>
                    উপশিরোনাম: লাইনের শুরুতে <code>## </code> (ছোট উপশিরোনাম <code>### </code>)
                  </li>
                  <li>
                    উদ্ধৃতি: লাইনের শুরুতে <code>&gt; </code>
                  </li>
                  <li>
                    তালিকা: লাইনের শুরুতে <code>- </code> বা <code>1. </code>
                  </li>
                  <li>
                    মোটা লেখা: <code>**লেখা**</code> · লিংক: <code>[লেখা](https://...)</code>
                  </li>
                  <li>YouTube ভিডিও: আলাদা লাইনে শুধু ভিডিওর লিংক দিন।</li>
                </ul>
              </details>
            }
          >
            <textarea
              id="body"
              name="body"
              required
              rows={22}
              defaultValue={a?.body}
              className={`${inputCls} font-[inherit] leading-relaxed`}
            />
          </Field>
        </div>

        <div className="grid gap-5 rounded border border-line bg-white p-5 sm:grid-cols-2">
          <h2 className="text-lg font-bold sm:col-span-2">প্রধান ছবি</h2>
          {a?.featuredImage && (
            <div className="sm:col-span-2">
              <div className="max-w-sm">
                <ResponsiveImage image={a.featuredImage} sizes="384px" />
              </div>
              <div className="mt-2">
                <Check name="removeImage" label="ছবিটি সরিয়ে দিন" />
              </div>
            </div>
          )}
          <Field
            label={a?.featuredImage ? "নতুন ছবি দিয়ে বদলান" : "ছবি আপলোড"}
            htmlFor="image"
            hint="JPEG, PNG, WebP বা AVIF, সর্বোচ্চ ৮ MB। স্বয়ংক্রিয়ভাবে WebP-তে রূপান্তর ও লোকেশন তথ্য মুছে ফেলা হয়।"
            className="sm:col-span-2"
          >
            <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="mt-1 block text-sm" />
          </Field>
          <Field
            label="বিকল্প লেখা (alt text)"
            htmlFor="imageAlt"
            hint="ছবিতে কী দেখা যাচ্ছে, যারা ছবি দেখতে পান না তাদের জন্য।"
            className="sm:col-span-2"
          >
            <input id="imageAlt" name="imageAlt" maxLength={300} defaultValue={a?.featuredImage?.alt ?? ""} className={inputCls} />
          </Field>
          <Field label="ছবির ক্যাপশন" htmlFor="imageCaption">
            <input id="imageCaption" name="imageCaption" maxLength={400} defaultValue={a?.imageCaption ?? ""} className={inputCls} />
          </Field>
          <Field label="ছবির কৃতজ্ঞতা / সূত্র" htmlFor="imageCredit" hint="যেমন: আলোকচিত্রীর নাম বা লাইসেন্সদাতা সংস্থা।">
            <input id="imageCredit" name="imageCredit" maxLength={200} defaultValue={a?.featuredImage?.credit ?? ""} className={inputCls} />
          </Field>
          <Field label="ভিডিও (YouTube লিংক, ঐচ্ছিক)" htmlFor="videoUrl" className="sm:col-span-2">
            <input id="videoUrl" name="videoUrl" type="url" defaultValue={a?.videoUrl ?? ""} className={inputCls} />
          </Field>
        </div>

        <div className="grid gap-5 rounded border border-line bg-white p-5 sm:grid-cols-2">
          <h2 className="text-lg font-bold sm:col-span-2">সার্চ ইঞ্জিন ও লিংক</h2>
          <Field
            label="URL স্লাগ"
            htmlFor="slug"
            hint={`ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন। খালি রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে। প্রকাশের পর বদলালে পুরোনো লিংক নতুনটিতে পাঠিয়ে দেওয়া হয়।`}
            className="sm:col-span-2"
          >
            <div className="mt-1 flex items-center">
              <span className="rounded-l border border-r-0 border-[#9ca3af] bg-surface px-2 py-2 text-sm text-muted">/news/</span>
              <input
                id="slug"
                name="slug"
                defaultValue={a?.slug ?? ""}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className="block w-full rounded-r border border-[#9ca3af] px-3 py-2 text-base"
                lang="en"
              />
            </div>
          </Field>
          <Field label="SEO শিরোনাম (ঐচ্ছিক)" htmlFor="seoTitle" hint="খালি থাকলে মূল শিরোনাম ব্যবহার হবে।">
            <input id="seoTitle" name="seoTitle" maxLength={120} defaultValue={a?.seoTitle ?? ""} className={inputCls} />
          </Field>
          <Field label="মেটা বিবরণ (ঐচ্ছিক)" htmlFor="seoDescription" hint="খালি থাকলে সারাংশ ব্যবহার হবে।">
            <input id="seoDescription" name="seoDescription" maxLength={300} defaultValue={a?.seoDescription ?? ""} className={inputCls} />
          </Field>
          <Field label="ট্যাগ" htmlFor="tags" hint="কমা দিয়ে আলাদা করুন, সর্বোচ্চ ১২টি।" className="sm:col-span-2">
            <input id="tags" name="tags" defaultValue={a?.tags.map((t) => t.tag.name).join(", ") ?? ""} className={inputCls} />
          </Field>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-3 rounded border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">প্রকাশ</h2>
            {a && <StatusBadge status={a.status} />}
          </div>
          {a?.publishedAt && (
            <p className="text-sm text-muted">
              {a.status === "SCHEDULED" ? "নির্ধারিত সময়" : "প্রকাশ"}: {formatDateTime(a.publishedAt)}
            </p>
          )}
          <Field label="সংস্করণ নোট (ঐচ্ছিক)" htmlFor="revisionNote">
            <input id="revisionNote" name="revisionNote" maxLength={200} className={inputCls} placeholder="কী পরিবর্তন হলো" />
          </Field>
          {editor && isLive && <Check name="significantUpdate" label="গুরুত্বপূর্ণ হালনাগাদ" hint="পাঠকদের ‘হালনাগাদ’ সময় দেখানো হবে।" />}
          <div className="flex flex-col gap-2 pt-2">
            {editor ? (
              <>
                <SubmitButton name="intent" value="publish">
                  {isLive ? "হালনাগাদ প্রকাশ করুন" : "এখনই প্রকাশ করুন"}
                </SubmitButton>
                <SubmitButton name="intent" value="save" variant="secondary">
                  {isLive ? "পরিবর্তন সংরক্ষণ (প্রকাশিত থাকবে)" : "খসড়া সংরক্ষণ"}
                </SubmitButton>
                <details className="rounded border border-line p-3">
                  <summary className="cursor-pointer text-sm font-semibold">প্রকাশের সময় নির্ধারণ</summary>
                  <Field label={`তারিখ ও সময় (${tz})`} htmlFor="scheduleAt" className="mt-2">
                    <input
                      id="scheduleAt"
                      name="scheduleAt"
                      type="datetime-local"
                      defaultValue={a?.status === "SCHEDULED" ? utcToZonedLocal(a.publishedAt) : ""}
                      className={inputCls}
                    />
                  </Field>
                  <SubmitButton name="intent" value="schedule" variant="dark" className="mt-2 w-full">
                    নির্ধারণ করুন
                  </SubmitButton>
                </details>
                {a && a.status !== "DRAFT" && a.status !== "REVIEW" && (
                  <SubmitButton
                    name="intent"
                    value="unpublish"
                    variant="danger"
                    confirm="সংবাদটি সাইট থেকে সরিয়ে খসড়ায় ফেরত নেওয়া হবে। নিশ্চিত?"
                  >
                    প্রকাশ প্রত্যাহার
                  </SubmitButton>
                )}
                {a && a.status !== "ARCHIVED" && (
                  <SubmitButton
                    name="intent"
                    value="archive"
                    variant="danger"
                    confirm="সংবাদটি আর্কাইভ করা হবে এবং পাঠকেরা আর দেখতে পাবেন না। নিশ্চিত?"
                  >
                    আর্কাইভ করুন
                  </SubmitButton>
                )}
              </>
            ) : (
              <>
                <SubmitButton name="intent" value="submit">
                  পর্যালোচনার জন্য জমা দিন
                </SubmitButton>
                <SubmitButton name="intent" value="save" variant="secondary">
                  খসড়া সংরক্ষণ
                </SubmitButton>
                <p className="text-xs text-muted">প্রতিবেদকের লেখা সম্পাদক পর্যালোচনা করে প্রকাশ করবেন।</p>
              </>
            )}
            {a && (
              <Link href={`/preview/${a.id}`} target="_blank" className="text-center text-sm font-semibold text-brand-dark underline">
                প্রিভিউ দেখুন (সংরক্ষিত সংস্করণ)
              </Link>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded border border-line bg-white p-5">
          <h2 className="text-lg font-bold">বিভাগ ও লেখক</h2>
          <Field label="বিভাগ *" htmlFor="categoryId">
            <select id="categoryId" name="categoryId" required defaultValue={a?.categoryId ?? ""} className={inputCls}>
              <option value="">বেছে নিন</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="উপবিভাগ" htmlFor="subcategoryId" hint="নির্বাচিত বিভাগের অধীন হতে হবে।">
            <select id="subcategoryId" name="subcategoryId" defaultValue={a?.subcategoryId ?? ""} className={inputCls}>
              <option value="">নেই</option>
              {categories
                .filter((c) => c.children.length)
                .map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    {c.children.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
            </select>
          </Field>
          {editor && (
            <>
              <Field label="লেখক" htmlFor="authorId">
                <select id="authorId" name="authorId" defaultValue={a?.authorId ?? user.id} className={inputCls}>
                  {authors.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="বাইলাইন (ঐচ্ছিক)"
                htmlFor="bylineOverride"
                hint="যেমন ‘নিজস্ব প্রতিবেদক’ বা সংবাদ সংস্থার নাম। দিলে লেখকের নামের বদলে এটি দেখানো হবে।"
              >
                <input
                  id="bylineOverride"
                  name="bylineOverride"
                  maxLength={120}
                  defaultValue={a?.bylineOverride ?? ""}
                  className={inputCls}
                />
              </Field>
            </>
          )}
        </div>

        {editor && (
          <div className="space-y-3 rounded border border-line bg-white p-5">
            <h2 className="text-lg font-bold">প্রচ্ছদ ও বিশেষ চিহ্ন</h2>
            <Check
              name="makeFeatured"
              label="প্রধান সংবাদ (লিড)"
              defaultChecked={isFeatured}
              hint="প্রচ্ছদের সবচেয়ে বড় জায়গায় দেখানো হবে।"
            />
            <Check name="isBreaking" label="ব্রেকিং নিউজ" defaultChecked={a?.isBreaking} hint="শুধু সত্যিকারের জরুরি সংবাদের জন্য।" />
            <Field
              label="ব্রেকিং কত ঘণ্টা থাকবে"
              htmlFor="breakingHours"
              hint={a?.breakingExpiresAt ? `বর্তমান মেয়াদ: ${formatDateTime(a.breakingExpiresAt)}` : "খালি বা ০ = যতক্ষণ না বন্ধ করা হয়।"}
            >
              <input id="breakingHours" name="breakingHours" type="number" min={0} max={168} className={inputCls} />
            </Field>
            <Check name="isEditorsPick" label="সম্পাদকীয় নির্বাচন" defaultChecked={a?.isEditorsPick} />
            <Field label="জনপ্রিয় তালিকায় সম্পাদকীয় অগ্রাধিকার (০–১০০)" htmlFor="editorialRank">
              <input
                id="editorialRank"
                name="editorialRank"
                type="number"
                min={0}
                max={100}
                defaultValue={a?.editorialRank ?? 0}
                className={inputCls}
              />
            </Field>
            <Check
              name="isSponsored"
              label="স্পনসরড কনটেন্ট"
              defaultChecked={a?.isSponsored}
              hint="পাঠকদের স্পষ্টভাবে ‘স্পনসরড’ লেবেল দেখানো হবে।"
            />
            <Field label="স্পনসরের নাম" htmlFor="sponsorName">
              <input id="sponsorName" name="sponsorName" maxLength={120} defaultValue={a?.sponsorName ?? ""} className={inputCls} />
            </Field>
            <Check name="noindex" label="সার্চ ইঞ্জিনে দেখাবেন না (noindex)" defaultChecked={a?.noindex} />
            <Check
              name="isSample"
              label="নমুনা কনটেন্ট"
              defaultChecked={a?.isSample}
              hint="পাঠকদের ‘নমুনা’ লেবেল দেখানো হয় এবং সার্চ ইঞ্জিন থেকে বাদ থাকে।"
            />
          </div>
        )}
      </div>
    </ActionForm>
  );
}
