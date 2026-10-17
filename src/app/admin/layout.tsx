import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "নিউজরুম", template: "%s · নিউজরুম · British Bangla News" },
  robots: { index: false, follow: false },
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface text-[15px]">{children}</div>;
}
