import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { FadeIn } from "@/components/ui/FadeIn";
import { cn } from "@/lib/utils";

export interface CollectionTile {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  endDate?: string | null;
}

export function FeaturedCollections({ collections }: { collections: CollectionTile[] }) {
  if (collections.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <Container>
        <FadeIn className="mb-8 text-center">
          <h2 className="font-display text-2xl sm:text-3xl">Featured Collections</h2>
        </FadeIn>
        <div className="grid gap-4 lg:grid-cols-4">
          {collections.slice(0, 3).map((c, i) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className={cn(
                "img-zoom group relative h-56 overflow-hidden bg-paper-dim sm:h-64 lg:h-72",
                i === 0 && "lg:col-span-2"
              )}
            >
              <Img src={c.imageUrl} alt={c.name} seedFallback={c.slug} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              {c.endDate && (
                <span className="absolute right-3 top-3 border border-paper/40 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-paper">
                  Until {new Date(c.endDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4 text-paper">
                <div className="mb-1.5 h-px w-8 bg-gold" />
                <h3 className="font-display text-xl">{c.name}</h3>
                {c.description && <p className="mt-1 text-xs text-paper/80 line-clamp-1">{c.description}</p>}
                <span className="link-reveal mt-1.5 inline-block text-xs uppercase tracking-[0.1em]">Explore the Edit →</span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
