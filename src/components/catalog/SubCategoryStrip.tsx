import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { cn } from "@/lib/utils";

interface SubCategoryStripProps {
  baseHref: string;
  items: { name: string; slug: string; imageUrl?: string | null }[];
  activeSlug?: string;
  variant?: "pill" | "image";
}

/** Sub-category quick-nav strip, server-rendered (no client JS needed since
 * it's just links with an active-state class from the already-awaited
 * search params). */
export function SubCategoryStrip({ baseHref, items, activeSlug, variant = "pill" }: SubCategoryStripProps) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-line bg-paper">
      <Container>
        <div className="no-scrollbar flex gap-3 overflow-x-auto py-4">
          <Link
            href={baseHref}
            className={cn(
              "shrink-0 whitespace-nowrap border px-4 py-2 text-xs uppercase tracking-[0.1em]",
              !activeSlug ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink"
            )}
          >
            All
          </Link>
          {items.map((c) => (
            <Link
              key={c.slug}
              href={`${baseHref}?category=${c.slug}`}
              className={cn(
                "flex shrink-0 items-center gap-2 whitespace-nowrap border px-4 py-2 text-xs uppercase tracking-[0.1em]",
                activeSlug === c.slug ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink"
              )}
            >
              {variant === "image" && (
                <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-paper-dim">
                  <Img src={c.imageUrl} alt="" seedFallback={c.slug} />
                </span>
              )}
              {c.name}
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
