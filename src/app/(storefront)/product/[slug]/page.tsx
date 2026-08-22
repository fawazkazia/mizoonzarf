import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { getProductBySlug } from "@/lib/data/product-detail";
import { getRelatedProducts } from "@/lib/data/products";
import { getSettings } from "@/lib/settings";
import { auth } from "@/lib/auth";
import { Container } from "@/components/ui/Container";
import { Gallery } from "@/components/product/Gallery";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { ProductAttributes } from "@/components/product/ProductAttributes";
import { CompleteTheLook } from "@/components/product/CompleteTheLook";
import { ReviewList } from "@/components/product/ReviewList";
import { ReviewForm } from "@/components/product/ReviewForm";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { discountPercent } from "@/components/ui/Price";
import { ProductRail } from "@/components/home/ProductRail";
import { RecentlyViewedRail } from "@/components/product/RecentlyViewedRail";
import { ProductPageTracking } from "@/components/product/ProductPageTracking";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const [product, session, settings] = await Promise.all([getProductBySlug(slug), auth(), getSettings()]);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id, 4);
  const primaryImage = product.images[0]?.url ?? null;
  const minPrice = Math.min(...product.variants.map((v) => Number(v.salePrice ?? v.price)));
  const maxCompareAt = Math.max(...product.variants.map((v) => Number(v.price)));
  const off = discountPercent(minPrice, product.variants.some((v) => v.salePrice) ? maxCompareAt : null);
  const attributes = (product.attributes as Record<string, string | number> | null) ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: settings.currency,
      price: minPrice,
      availability: product.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating:
      product.reviewCount > 0
        ? { "@type": "AggregateRating", ratingValue: product.avgRating, reviewCount: product.reviewCount }
        : undefined,
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductPageTracking
        productId={product.id}
        entry={{ id: product.id, slug: product.slug, name: product.name, price: minPrice, image: primaryImage }}
      />

      <Container className="py-6">
        <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">
          <Link href="/">Home</Link> / <Link href={`/${product.category.slug}`}>{product.category.name}</Link> / {product.name}
        </p>
      </Container>

      <Container className="grid gap-10 pb-16 lg:grid-cols-2 lg:gap-16">
        <Gallery images={product.images.map((i) => ({ url: i.url, altText: i.altText }))} productName={product.name} />

        <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:h-fit">
          {product.brand && (
            <Link href={`/search?q=${encodeURIComponent(product.brand.name)}`} className="link-reveal w-fit text-xs uppercase tracking-[0.14em] text-ink-soft">
              {product.brand.name}
            </Link>
          )}
          <h1 className="font-display text-3xl sm:text-4xl">{product.name}</h1>
          <div className="flex items-center gap-3">
            {product.reviewCount > 0 && (
              <a href="#reviews" className="link-reveal">
                <Rating value={product.avgRating} count={product.reviewCount} />
              </a>
            )}
            {off && <Badge tone="sale">-{off}%</Badge>}
          </div>

          <PurchasePanel
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            sizeGuideType={product.sizeGuideType}
            variants={product.variants.map((v) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex,
              price: Number(v.price),
              salePrice: v.salePrice ? Number(v.salePrice) : null,
              stock: v.stock,
            }))}
          />

          <div className="grid grid-cols-3 gap-2 border-y border-line py-4 text-center text-[11px] uppercase tracking-[0.06em] text-ink-soft">
            <div className="flex flex-col items-center gap-1.5">
              <Truck size={18} strokeWidth={1.5} />
              Free Delivery over {settings.currencySymbol} {settings.shipping.freeShippingThreshold}
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <RotateCcw size={18} strokeWidth={1.5} />
              14-Day Returns
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck size={18} strokeWidth={1.5} />
              Secure Payment
            </div>
          </div>

          <div className="mt-2">
            <ProductAttributes
              description={product.description}
              material={product.material}
              fitInfo={product.fitInfo}
              careInstructions={product.careInstructions}
              sizeGuideType={product.sizeGuideType}
              fragranceFamily={product.fragranceFamily}
              fragranceNotes={product.fragranceNotes as never}
              concentration={product.concentration}
              attributes={attributes}
              tags={product.tags}
              freeShippingThreshold={settings.shipping.freeShippingThreshold}
              currencySymbol={settings.currencySymbol}
            />
          </div>
        </div>
      </Container>

      <Container id="reviews" className="border-t border-line py-16">
        <h2 className="mb-8 font-display text-2xl">Customer Reviews</h2>
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <ReviewList
            avgRating={product.avgRating}
            reviewCount={product.reviewCount}
            reviews={product.reviews.map((r) => ({
              id: r.id,
              customerName: r.customerName,
              rating: r.rating,
              title: r.title,
              comment: r.comment,
              isVerifiedPurchase: r.isVerifiedPurchase,
              createdAt: r.createdAt,
            }))}
          />
          <ReviewForm productId={product.id} isSignedIn={Boolean(session?.user)} />
        </div>
      </Container>

      <CompleteTheLook
        source={{ id: product.id, categorySlug: product.category.slug, gender: product.gender, tags: product.tags, brandId: product.brandId }}
        sourceImage={primaryImage}
        sourceName={product.name}
      />

      <ProductRail title="You May Also Like" products={related} />
      <RecentlyViewedRail excludeId={product.id} />
    </div>
  );
}
