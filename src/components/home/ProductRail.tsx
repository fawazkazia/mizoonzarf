import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ScrollRail } from "@/components/ui/ScrollRail";
import { FadeIn } from "@/components/ui/FadeIn";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCard as ProductCardData } from "@/lib/data/products";
import { cn } from "@/lib/utils";

export function ProductRail({
  title,
  subtitle,
  eyebrow,
  products,
  viewAllHref,
  surface = "paper",
  compactTop = false,
  compactBottom = false,
  layout = "rail",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  products: ProductCardData[];
  viewAllHref?: string;
  surface?: "paper" | "paper-dim";
  compactTop?: boolean;
  compactBottom?: boolean;
  /** "grid" renders a static, equal-width 2/4-column grid instead of a
   * horizontal scroll carousel — used where the spec calls for a fixed
   * grid (New Arrivals, Best Sellers) rather than a browsable rail. */
  layout?: "rail" | "grid";
}) {
  if (products.length === 0) return null;

  return (
    <section
      className={cn(
        compactTop ? "pt-4 sm:pt-6" : "pt-12 sm:pt-16",
        compactBottom ? "pb-4 sm:pb-6" : "pb-12 sm:pb-16",
        surface === "paper-dim" && "bg-paper-dim"
      )}
    >
      <Container>
        <FadeIn className="mb-8 flex items-end justify-between">
          <div>
            {eyebrow && <p className="mb-1.5 text-xs uppercase tracking-[0.2em] text-gold-deep">{eyebrow}</p>}
            <h2 className="hp-heading font-display text-2xl sm:text-3xl">{title}</h2>
            {subtitle && <p className="hp-body mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
          </div>
          {viewAllHref && (
            <Link href={viewAllHref} className="link-reveal hidden items-center gap-1.5 text-xs uppercase tracking-[0.12em] sm:flex">
              View All <ArrowRight size={14} />
            </Link>
          )}
        </FadeIn>

        {layout === "grid" ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <ScrollRail trackClassName="pb-2">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} className="w-44 shrink-0 snap-start sm:w-52 lg:w-60" />
            ))}
          </ScrollRail>
        )}

        {viewAllHref && (
          <div className="mt-8 flex justify-center sm:hidden">
            <Link href={viewAllHref} className="text-xs uppercase tracking-[0.12em] underline">
              View All
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
