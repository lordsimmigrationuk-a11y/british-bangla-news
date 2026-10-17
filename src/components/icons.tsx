import { siFacebook, siYoutube, siX, siInstagram, siTiktok, siWhatsapp } from "simple-icons";
import type { SocialKey } from "@/lib/settings";

const BRAND_PATHS: Record<SocialKey, string> = {
  facebook: siFacebook.path,
  youtube: siYoutube.path,
  x: siX.path,
  instagram: siInstagram.path,
  tiktok: siTiktok.path,
  whatsapp: siWhatsapp.path,
};

export function SocialIcon({ name, className = "h-4 w-4" }: { name: SocialKey; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d={BRAND_PATHS[name]} />
    </svg>
  );
}

type P = { className?: string };
const base = (className = "h-5 w-5") => ({
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export const SearchIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const MenuIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
export const CloseIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const PlayIcon = ({ className }: P) => (
  <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);
export const PauseIcon = ({ className }: P) => (
  <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
  </svg>
);
export const LinkIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
    <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
  </svg>
);
export const MailIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="3" y="5" width="18" height="14" rx="1" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);
export const ShareIcon = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);
export const ChevronRight = ({ className }: P) => (
  <svg {...base(className ?? "h-4 w-4")}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
