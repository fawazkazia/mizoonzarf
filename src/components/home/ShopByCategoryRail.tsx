import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";

export interface CategoryRailItem {
  name: string;
  href: string;
  imageUrl: string | null;
  seed: string;
}

/**
 * Horizontally-scrolling, 2-row "Shop By Category" rail — distinct from the
 * bento-style CategoryGrid section (top-level categories only). This one
 * shows subcategories as rounded cards with a gradient accent strip under
 * each image, matching each item to a specific shopping intent (e.g. "Shoes",
 * "Bags") rather than a whole department.
 *
 * `accentGradient` intentionally reuses the same 3 hex stops as the
 * Favourite Brands banner (Settings > Promo Banners) so the two stay visually
 * in sync — admins only ever edit the color in one place.
 */
export function ShopByCategoryRail({
  items,
  accentGradient,
}: {
  items: CategoryRailItem[];
  accentGradient: { from: string; via: string; to: string };
}) {
  if (items.length === 0) return null;

  return (
    <section className="py-8 sm:py-10">
      <Container>
        <h2 className="font-display text-xl sm:text-2xl">Shop By Category</h2>
        <div className="no-scrollbar mt-4 grid auto-cols-[6rem] grid-flow-col grid-rows-2 gap-x-3 gap-y-3 overflow-x-auto pb-2 sm:auto-cols-[7rem]">
          {items.map((item, i) => (
            <Link key={`${item.href}-${i}`} href={item.href} className="group block">
              <div className="overflow-hidden rounded-xl bg-paper-dim shadow-[var(--shadow-panel)] transition-all duration-[var(--dur-2)] group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-panel-lg,0_12px_28px_-14px_rgba(0,0,0,0.35))]">
                <div className="aspect-square w-full overflow-hidden">
                  <Img
                    src={item.imageUrl}
                    alt={item.name}
                    seedFallback={item.seed}
                    className="transition-transform duration-[var(--dur-3)] group-hover:scale-105"
                  />
                </div>
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundImage: `linear-gradient(to right, ${accentGradient.from}, ${accentGradient.via}, ${accentGradient.to})` }}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1.5 text-center text-xs text-ink transition-colors duration-[var(--dur-2)] group-hover:text-ink-soft">{item.name}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
