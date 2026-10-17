import type { Metadata } from "next";
import { getPopular } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { toBnDigits } from "@/lib/format";
import { ArticleList } from "@/components/news/ArticleList";

export const metadata: Metadata = {
  title: "জনপ্রিয় সংবাদ",
  alternates: { canonical: "/popular" },
};

export default async function PopularPage() {
  const [items, s] = await Promise.all([getPopular(20), getSettings()]);
  const intro =
    s.popularMode === "views"
      ? `গত ${toBnDigits(s.popularWindowDays)} দিনে পাঠকেরা যে সংবাদগুলো বেশি পড়েছেন। গণনা বেনামে করা হয়; কোনো ব্যক্তিগত তথ্য সংরক্ষণ করা হয় না।`
      : "আমাদের সম্পাদকীয় দলের বাছাই করা গুরুত্বপূর্ণ সংবাদ।";
  return (
    <ArticleList
      title="জনপ্রিয় সংবাদ"
      intro={intro}
      items={items}
      basePath="/popular"
      crumbs={[
        { name: "প্রচ্ছদ", path: "/" },
        { name: "জনপ্রিয়", path: "/popular" },
      ]}
    />
  );
}
