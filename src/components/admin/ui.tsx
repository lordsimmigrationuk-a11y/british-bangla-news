import Link from "next/link";
import { STATUS_LABELS, type ArticleStatus } from "@/lib/constants";

export const inputCls = "mt-1 block w-full rounded border border-[#9ca3af] bg-white px-3 py-2 text-base focus:border-ink";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <div className="mt-1 text-xs leading-relaxed text-muted">{hint}</div>}
    </div>
  );
}

export function Check({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 h-4 w-4 accent-[#D00000]" />
      <span>
        <span className="font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function PageHeader({ title, actions, children }: { title: string; actions?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const cls =
    variant === "primary" ? "bg-brand text-white hover:bg-brand-dark" : "border border-[#9ca3af] bg-white text-ink hover:border-ink";
  return (
    <Link href={href} className={`inline-flex items-center rounded px-4 py-2 text-sm font-semibold ${cls}`}>
      {children}
    </Link>
  );
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  REVIEW: "bg-amber-100 text-amber-900",
  SCHEDULED: "bg-blue-100 text-blue-900",
  PUBLISHED: "bg-green-100 text-green-900",
  ARCHIVED: "bg-gray-200 text-gray-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? ""}`}>
      {STATUS_LABELS[status as ArticleStatus] ?? status}
    </span>
  );
}

export function Notice({ children, tone = "ok" }: { children: React.ReactNode; tone?: "ok" | "warn" | "error" }) {
  const cls = {
    ok: "border-green-700 bg-green-50 text-green-900",
    warn: "border-amber-500 bg-amber-50 text-amber-950",
    error: "border-brand bg-red-50 text-brand-dark",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`mb-4 border-l-4 px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded border border-line bg-white p-5 ${className}`}>
      {title && <h2 className="mb-4 text-lg font-bold">{title}</h2>}
      {children}
    </section>
  );
}
