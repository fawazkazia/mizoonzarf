import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/data/product-detail";

/**
 * Single-product read backing the Quick View modal — a thin wrapper over
 * getProductBySlug (the same function the PDP uses), not a list/filter
 * endpoint, so there's exactly one product query in the codebase. Product
 * cards don't carry full variant data (would bloat every grid response), so
 * this is fetched on demand when a shopper opens Quick View.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(
    {
      id: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      brand: product.brand?.name ?? null,
      shortDescription: product.shortDescription,
      rating: product.avgRating,
      reviewCount: product.reviewCount,
      categoryName: product.category.name,
      categorySlug: product.category.slug,
      sizeGuideType: product.sizeGuideType,
      images: product.images.map((img) => ({ url: img.url, altText: img.altText })),
      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        colorHex: v.colorHex,
        price: Number(v.price),
        salePrice: v.salePrice ? Number(v.salePrice) : null,
        stock: v.stock,
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
