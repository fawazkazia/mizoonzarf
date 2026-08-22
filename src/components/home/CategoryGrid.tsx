import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { FadeIn } from "@/components/ui/FadeIn";
import { cn } from "@/lib/utils";

export interface CategoryTile {
  name: string;
  slug: string;
  imageUrl: string | null;
  childCount?: number;
}

export function CategoryGrid({
  categories,
  title = "Shop By Category",
  subtitle = "Curated edits across fashion, fragrance and fine accessories.",
}: {
  categories: CategoryTile[];
  title?: string;
  subtitle?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <FadeIn className="mb-10 text-center">
          <h2 className="font-display text-3xl sm:text-4xl">{title}</h2>
          <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>
        </FadeIn>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:auto-rows-[14rem]">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className={cn(
                "img-zoom group relative aspect-[4/5] overflow-hidden bg-paper-dim lg:aspect-auto",
                i === 0 ? "lg:col-span-2 lg:row-span-2" : "lg:col-span-2"
              )}
            >
              <Img src={cat.imageUrl} alt={cat.name} seedFallback={cat.slug} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/5 to-transparent transition-colors duration-[var(--dur-2)] group-hover:from-ink/80" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-paper sm:p-5">
                <p className="font-display text-xl sm:text-2xl">{cat.name}</p>
                {typeof cat.childCount === "number" && cat.childCount > 0 && (
                  <p className="text-[11px] uppercase tracking-[0.1em] text-paper/70">{cat.childCount} categories</p>
                )}
                <span className="link-reveal mt-2 inline-block translate-y-1 text-[11px] uppercase tracking-[0.12em] opacity-0 transition-all duration-[var(--dur-2)] group-hover:translate-y-0 group-hover:opacity-100">
                  Shop Now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
