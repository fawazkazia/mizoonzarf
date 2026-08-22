import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getProductsByCollectionSlug } from "@/lib/data/products";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { ProductCard } from "@/components/product/ProductCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await db.collection.findUnique({ where: { slug } });
  return collection ? { title: collection.name, description: collection.description ?? undefined } : {};
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const collection = await db.collection.findUnique({ where: { slug } });
  if (!collection) notFound();

  const products = await getProductsByCollectionSlug(slug, 40);

  return (
    <div>
      <div className="relative h-[36vh] min-h-[260px] w-full overflow-hidden bg-ink">
        <Img src={collection.imageUrl} alt={collection.name} seedFallback={collection.slug} className="brightness-[0.65]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-paper">
          <h1 className="font-display text-4xl sm:text-5xl">{collection.name}</h1>
          {collection.description && <p className="mt-3 max-w-xl text-paper/80">{collection.description}</p>}
        </div>
      </div>

      <Container className="py-14">
        {products.length === 0 ? (
          <p className="py-16 text-center text-ink-soft">No products in this collection yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
