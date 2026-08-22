import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";

interface CategoryHeroProps {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  /** Omitted deliberately when the caller wants the hero to render before
   * the product query resolves (streaming) — showing a stale/zero count
   * would be worse than omitting it. */
  productCount?: number;
  accent?: "ink" | "sale";
}

/** Per-vertical PLP banner. Callers resolve the image via a priority chain
 * (Banner(CATEGORY) override -> Category.imageUrl -> this component's own
 * typographic fallback when imageUrl is null), so every vertical gets a
 * real hero on day one with no content entry required. */
export function CategoryHero({ name, description, imageUrl, productCount, accent = "ink" }: CategoryHeroProps) {
  if (!imageUrl) {
    return (
      <div className={accent === "sale" ? "border-b border-line bg-sale text-paper" : "border-b border-line bg-ink text-paper"}>
        <Container className="py-14">
          <p className="text-xs uppercase tracking-[0.14em] opacity-70">
            <Link href="/">Home</Link> / {name}
          </p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">{name}</h1>
          {description && <p className="mt-3 max-w-xl text-sm opacity-80">{description}</p>}
          {typeof productCount === "number" && <p className="mt-4 text-xs uppercase tracking-[0.1em] opacity-60">{productCount} products</p>}
        </Container>
      </div>
    );
  }

  return (
    <div className="relative h-[42vh] min-h-[320px] w-full overflow-hidden bg-ink">
      <Img src={imageUrl} alt={name} className="brightness-90" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
      <Container className="absolute inset-0 flex flex-col justify-end pb-8 text-paper">
        <p className="text-xs uppercase tracking-[0.14em] opacity-80">
          <Link href="/">Home</Link> / {name}
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">{name}</h1>
        {description && <p className="mt-3 max-w-xl text-sm opacity-85 line-clamp-2">{description}</p>}
        {typeof productCount === "number" && <p className="mt-3 text-xs uppercase tracking-[0.1em] opacity-70">{productCount} products</p>}
      </Container>
    </div>
  );
}
