import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { FadeIn } from "@/components/ui/FadeIn";
import { objectPositionClass, type ObjectPositionValue } from "@/lib/object-position";

export interface CategoryShowcaseItem {
  name: string;
  slug: string;
  imageUrl: string | null;
  imageObjectPosition?: ObjectPositionValue | null;
}

/**
 * Large, equal-sized "Shop By Category" cards — one per top-level department
 * (Men, Women, Kids, Perfumes, Jewellery). Distinct from `ShopByCategoryRail`
 * (a small horizontal scroll of subcategories) and `GenderTriptych` (a
 * 3-column banded layout limited to gendered categories) — this is the one
 * section that shows all five departments as consistent, premium tiles.
 */
export function CategoryShowcase({
  items,
  heading = "Shop By Category",
}: {
  items: CategoryShowcaseItem[];
  heading?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <FadeIn className="mb-8 text-center">
          <h2 className="hp-heading font-display text-2xl sm:text-3xl">{heading}</h2>
        </FadeIn>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {items.map((item) => (
            <Link key={item.slug} href={`/${item.slug}`} className="img-zoom group relative block aspect-[4/5] overflow-hidden bg-paper-dim">
              <Img
                src={item.imageUrl}
                alt={item.name}
                seedFallback={item.slug}
                className={objectPositionClass(item.imageObjectPosition)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-paper">
                <div className="hp-accent-bg mb-1.5 h-px w-8" />
                <h3 className="font-display text-lg sm:text-xl">{item.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
