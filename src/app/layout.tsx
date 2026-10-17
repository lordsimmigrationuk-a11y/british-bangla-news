import type { Metadata, Viewport } from "next";
import "./globals.css";
import { hindSiliguri, inter } from "./fonts";
import { siteUrl } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
};

export const viewport: Viewport = {
  themeColor: "#D00000",
  width: "device-width",
  initialScale: 1,
};

// Every page reads live content from the database at request time.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
