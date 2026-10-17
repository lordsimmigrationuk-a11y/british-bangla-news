import { getSettings, adsActive, type Settings } from "@/lib/settings";
import { AdUnit } from "./AdUnit";

type Placement = "homeBanner" | "category" | "articleSidebar" | "inArticle" | "mobile";

const CONFIG: Record<Placement, { key: keyof Settings; minH: string; className: string }> = {
  homeBanner: { key: "adSlotHomeBanner", minH: "min-h-[100px] md:min-h-[90px]", className: "" },
  category: { key: "adSlotCategory", minH: "min-h-[250px]", className: "" },
  articleSidebar: { key: "adSlotArticleSidebar", minH: "min-h-[250px]", className: "" },
  inArticle: { key: "adSlotInArticle", minH: "min-h-[250px]", className: "my-8" },
  mobile: { key: "adSlotMobile", minH: "min-h-[100px]", className: "md:hidden" },
};

/**
 * Advertising slot. Renders nothing until an administrator enables ads and enters a
 * valid AdSense publisher id and slot id. When active, the space is reserved up front
 * (no layout shift) and clearly labelled as an advertisement.
 */
export async function AdSlot({ placement }: { placement: Placement }) {
  const s = await getSettings();
  const cfg = CONFIG[placement];
  const slot = s[cfg.key];
  if (!adsActive(s) || !/^\d+$/.test(slot)) return null;
  return (
    <aside aria-label="বিজ্ঞাপন" className={`border-y border-line bg-surface py-2 ${cfg.className}`}>
      <p className="mb-1 text-center text-xs uppercase tracking-wider text-muted">বিজ্ঞাপন</p>
      <div className={`${cfg.minH} flex items-center justify-center`}>
        <AdUnit client={s.adsenseClientId} slot={slot} />
      </div>
    </aside>
  );
}
