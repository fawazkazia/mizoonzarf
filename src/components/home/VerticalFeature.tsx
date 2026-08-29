import Link from "next/link";
import { Img } from "@/components/ui/ArtImage";
import { ScrollRail } from "@/components/ui/ScrollRail";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCard as ProductCardData } from "@/lib/data/products";
import { objectPositionClass, type ObjectPositionValue } from "@/lib/object-position";
import { cn } from "@/lib/utils";

export interface VerticalFeatureCategory {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imageObjectPosition?: ObjectPositionValue | null;
}

/** Backs the Perfume/Jewellery Collection homepage sections — one component,
 * differentiated per vertical via `eyebrow`/`accent` and whatever data is
 * passed, rather than forking a component per vertical. */
export function VerticalFeature({
  category,
  products,
  eyebrow = "The Edit",
  accent = "gold",
  spacing = "both",
}: {
  category: VerticalFeatureCategory;
  products: ProductCardData[];
  eyebrow?: string;
  accent?: "gold" | "ink";
  spacing?: "both" | "top" | "bottom" | "none";
}) {
  if (products.length === 0) return null;

  return (
    <section
      className={cn(
        "overflow-hidden bg-paper-dim",
        spacing === "both" && "my-12 sm:my-16",
        spacing === "top" && "mt-12 sm:mt-16",
        spacing === "bottom" && "mb-12 sm:mb-16"
      )}
    >
      <div className="grid lg:h-[33rem] lg:grid-cols-[1.1fr_1fr]">
        <div className="img-zoom relative h-56 overflow-hidden sm:h-64 lg:h-full">
          <Img
            src={category.imageUrl}
            alt={category.name}
            seedFallback={category.slug}
            className={objectPositionClass(category.imageObjectPosition)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent lg:bg-gradient-to-r" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-paper lg:max-w-md">
            <p className={cn("text-xs uppercase tracking-[0.2em]", accent === "gold" ? "hp-accent-soft-text" : "text-paper/70")}>{eyebrow}</p>
            <h2 className="hp-heading mt-1.5 font-display text-xl">{category.name}</h2>
            {category.description && <p className="hp-body mt-1.5 text-xs text-paper/75 line-clamp-1">{category.description}</p>}
            <Link href={`/${category.slug}`} className="link-reveal mt-2 inline-block text-xs uppercase tracking-[0.12em]">
              Shop {category.name} →
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-center bg-paper p-4 pt-6 lg:h-full lg:p-6 lg:pt-8">
          <ScrollRail trackClassName="justify-center">
            {products.slice(0, 2).map((p) => (
              <ProductCard key={p.id} product={p} className="w-44 shrink-0 snap-start sm:w-52 lg:w-60" />
            ))}
          </ScrollRail>
        </div>
      </div>
    </section>
  );
}
