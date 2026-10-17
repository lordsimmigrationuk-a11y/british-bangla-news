import type { Media, User } from "@prisma/client";
import { Field, inputCls } from "./ui";
import { ResponsiveImage } from "../news/ResponsiveImage";

export function ProfileFields({ u }: { u?: User & { avatar: Media | null } }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="নাম (বাইলাইনে দেখাবে)" htmlFor="name">
        <input id="name" name="name" required defaultValue={u?.name} className={inputCls} />
      </Field>
      <Field label="পদবি" htmlFor="designation" hint="যেমন: স্টাফ রিপোর্টার, যুক্তরাজ্য প্রতিনিধি। শুধু প্রকৃত পদবি।">
        <input id="designation" name="designation" defaultValue={u?.designation ?? ""} className={inputCls} />
      </Field>
      <Field label="প্রোফাইল URL" htmlFor="slug" hint="/author/… · ইংরেজি ছোট হাতের অক্ষর ও হাইফেন">
        <input id="slug" name="slug" defaultValue={u?.slug ?? ""} className={inputCls} lang="en" />
      </Field>
      <Field label="ছবি" htmlFor="avatar" hint="বর্গাকার ছবি ভালো দেখায়।">
        <div className="mt-1 flex items-center gap-3">
          {u?.avatar && (
            <div className="h-12 w-12 overflow-hidden rounded-full">
              <ResponsiveImage image={u.avatar} sizes="48px" ratio="1/1" alt="" />
            </div>
          )}
          <input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
        </div>
      </Field>
      <Field
        label="সংক্ষিপ্ত পরিচিতি"
        htmlFor="bio"
        hint="সংবাদের নিচে ও লেখকের পাতায় দেখাবে। যাচাইযোগ্য তথ্য ছাড়া কোনো দাবি লিখবেন না।"
        className="sm:col-span-2"
      >
        <textarea id="bio" name="bio" rows={3} maxLength={1000} defaultValue={u?.bio ?? ""} className={inputCls} />
      </Field>
    </div>
  );
}
