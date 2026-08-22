import Link from "next/link";
import { Img } from "@/components/ui/ArtImage";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCard as ProductCardData } from "@/lib/data/products";
import { cn } from "@/lib/utils";

export interface VerticalFeatureCategory {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

/** Backs the Perfume/Jewellery Collection homepage sections — one component,
 * differentiated per vertical via `eyebrow`/`accent` and whatever data is
 * passed, rather than forking a component per vertical. */
export function VerticalFeature({
  category,
  products,
  eyebrow = "The Edit",
  accent = "gold",
}: {
  category: VerticalFeatureCategory;
  products: ProductCardData[];
  eyebrow?: string;
  accent?: "gold" | "ink";
}) {
  if (products.length === 0) return null;

  return (
    <section className="bg-paper-dim">
      <div className="grid lg:grid-cols-[1.1fr_1fr]">
        <div className="img-zoom relative aspect-[4/3] overflow-hidden lg:aspect-auto">
          <Img src={category.imageUrl} alt={category.name} seedFallback={category.slug} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent lg:bg-gradient-to-r" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-paper lg:max-w-md">
            <p className={cn("text-xs uppercase tracking-[0.2em]", accent === "gold" ? "text-gold-soft" : "text-paper/70")}>{eyebrow}</p>
            <h2 className="mt-2 font-display text-4xl">{category.name}</h2>
            {category.description && <p className="mt-3 text-sm text-paper/75 line-clamp-2">{category.description}</p>}
            <Link href={`/${category.slug}`} className="link-reveal mt-5 inline-block text-xs uppercase tracking-[0.12em]">
              Shop {category.name} →
            </Link>
          </div>
        </div>

        <div className="bg-paper p-8 lg:p-10">
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
