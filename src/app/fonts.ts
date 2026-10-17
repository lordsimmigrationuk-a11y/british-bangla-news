import localFont from "next/font/local";

// Self-hosted fonts (no third-party font requests). Hind Siliguri (400 and 700; semibold maps to 700) covers Bangla text and is
// preloaded so headlines render in the brand face quickly; Inter covers Latin text.
export const hindSiliguri = localFont({
  src: [
    { path: "../../node_modules/@fontsource/hind-siliguri/files/hind-siliguri-bengali-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/hind-siliguri/files/hind-siliguri-bengali-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-bn",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  declarations: [
    { prop: "unicode-range", value: "U+0951-0952, U+0964-0965, U+0980-09FE, U+1CD0-1CF9, U+200C-200D, U+20B9, U+25CC, U+A8F1" },
  ],
});

export const inter = localFont({
  src: [
    { path: "../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});
