import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";

export interface BrandStripBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

/** Slim full-bleed dark strip showing a handful of carried brands' logos. */
export function BrandStrip({ brands }: { brands: BrandStripBrand[] }) {
  if (brands.length === 0) return null;

  return (
    <section className="bg-ink my-2 sm:my-3">
      <Container className="flex h-14 items-center justify-center gap-x-14 overflow-x-auto sm:h-16 sm:gap-x-24">
        {brands.map((b) => (
          <div key={b.id} className="flex h-full shrink-0 items-center gap-2.5">
            <span className="aspect-square h-full shrink-0 overflow-hidden rounded-full">
              <Img src={b.logoUrl} alt={b.name} seedFallback={b.slug} className="h-full w-full object-cover" />
            </span>
            <span className="whitespace-nowrap text-xs uppercase tracking-[0.15em] text-paper/80">{b.name}</span>
          </div>
        ))}
      </Container>
    </section>
  );
}
