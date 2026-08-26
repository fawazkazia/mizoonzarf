import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning";
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">{label}</p>
      <p className={cn("mt-2 font-display text-3xl", tone === "warning" && "text-sale")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </>
  );

  const className = cn(
    "border border-line bg-paper p-5",
    tone === "warning" && "border-sale/40",
    href && "block transition-colors hover:border-ink hover:bg-paper-dim cursor-pointer"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
