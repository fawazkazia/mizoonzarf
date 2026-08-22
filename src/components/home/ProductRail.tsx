import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ScrollRail } from "@/components/ui/ScrollRail";
import { FadeIn } from "@/components/ui/FadeIn";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCard as ProductCardData } from "@/lib/data/products";

export function ProductRail({
  title,
  subtitle,
  eyebrow,
  products,
  viewAllHref,
  surface = "paper",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  products: ProductCardData[];
  viewAllHref?: string;
  surface?: "paper" | "paper-dim";
}) {
  if (products.length === 0) return null;

  return (
    <section className={surface === "paper-dim" ? "bg-paper-dim py-20 sm:py-28" : "py-20 sm:py-28"}>
      <Container>
        <FadeIn className="mb-10 flex items-end justify-between">
          <div>
            {eyebrow && <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gold-deep">{eyebrow}</p>}
            <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>}
          </div>
          {viewAllHref && (
            <Link href={viewAllHref} className="link-reveal hidden items-center gap-1.5 text-xs uppercase tracking-[0.12em] sm:flex">
              View All <ArrowRight size={14} />
            </Link>
          )}
        </FadeIn>

        <ScrollRail trackClassName="pb-2">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} className="w-[62%] shrink-0 snap-start sm:w-[38%] lg:w-[23%]" />
          ))}
        </ScrollRail>

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
