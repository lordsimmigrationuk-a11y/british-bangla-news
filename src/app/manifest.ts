import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "British Bangla News",
    short_name: "BBN",
    lang: "bn",
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#D00000",
    icons: [
      { src: "/brand/logo-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/logo-160.png", sizes: "160x160", type: "image/png" },
    ],
  };
}
