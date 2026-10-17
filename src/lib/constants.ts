export const ROLES = ["ADMIN", "EDITOR", "REPORTER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "অ্যাডমিনিস্ট্রেটর",
  EDITOR: "সম্পাদক",
  REPORTER: "প্রতিবেদক",
};

export const ARTICLE_STATUSES = ["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "খসড়া",
  REVIEW: "পর্যালোচনায়",
  SCHEDULED: "নির্ধারিত",
  PUBLISHED: "প্রকাশিত",
  ARCHIVED: "আর্কাইভ",
};

export const VIDEO_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const SECTION_KINDS = ["CATEGORY", "CATEGORY_PAIR", "VIDEO", "POPULAR", "EDITORS_PICK"] as const;
export const SECTION_KIND_LABELS: Record<(typeof SECTION_KINDS)[number], string> = {
  CATEGORY: "একটি বিভাগ",
  CATEGORY_PAIR: "দুটি বিভাগ পাশাপাশি",
  VIDEO: "ভিডিও সংবাদ",
  POPULAR: "জনপ্রিয় সংবাদ",
  EDITORS_PICK: "সম্পাদকীয় নির্বাচন",
};
export type SectionKind = (typeof SECTION_KINDS)[number];

export const MESSAGE_KINDS = ["GENERAL", "CORRECTION", "ADVERTISING"] as const;
export const MESSAGE_KIND_LABELS: Record<(typeof MESSAGE_KINDS)[number], string> = {
  GENERAL: "সাধারণ যোগাযোগ",
  CORRECTION: "সংশোধনের অনুরোধ",
  ADVERTISING: "বিজ্ঞাপন",
};

export const SITE_NAME_BN = "ব্রিটিশ বাংলা নিউজ";
export const SITE_NAME_EN = "British Bangla News";
export const PAGE_SIZE = 12;
