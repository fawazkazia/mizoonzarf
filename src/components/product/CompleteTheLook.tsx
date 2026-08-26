import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { Price } from "@/components/ui/Price";
import { getCompleteTheLook, type CompleteTheLookSource } from "@/lib/data/complete-the-look";
import { getSettings } from "@/lib/settings";
import { CompleteTheLookAddButton } from "@/components/product/CompleteTheLookAddButton";

export async function CompleteTheLook({
  source,
  sourceImage,
  sourceName,
}: {
  source: CompleteTheLookSource;
  sourceImage: string | null;
  sourceName: string;
}) {
  const [slots, settings] = await Promise.all([getCompleteTheLook(source), getSettings()]);
  if (slots.length === 0) return null;

  return (
    <section className="border-t border-line py-16">
      <Container>
        <h2 className="mb-8 font-display text-2xl">Complete the Look</h2>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="aspect-[4/5] overflow-hidden bg-paper-dim lg:aspect-auto">
            <Img src={sourceImage} alt={sourceName} seedFallback={source.id} />
          </div>
          <div className="flex flex-col gap-4">
            {slots.map((slot) => (
              <div key={slot.product.id} className="flex gap-4 border border-line p-4">
                <Link href={`/product/${slot.product.slug}`} className="aspect-[3/4] w-20 shrink-0 overflow-hidden bg-paper-dim">
                  <Img src={slot.product.image} alt={slot.product.name} seedFallback={slot.product.id} />
                </Link>
                <div className="flex flex-1 flex-col justify-center gap-1">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-ink-soft">{slot.categoryName}</p>
                  <Link href={`/product/${slot.product.slug}`} className="text-sm font-medium hover:underline">
                    {slot.product.name}
                  </Link>
                  <Price price={slot.product.price} compareAt={slot.product.compareAtPrice} currency={settings.currency} size="sm" />
                </div>
                <CompleteTheLookAddButton
                  slug={slot.product.slug}
                  defaultVariantId={slot.product.defaultVariantId}
                  variantCount={slot.product.variantCount}
                />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
