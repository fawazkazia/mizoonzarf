import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

const cardInclude = {
  brand: { select: { name: true } },
  images: { orderBy: { sortOrder: "asc" as const }, take: 2 },
  variants: {
    select: { id: true, isDefault: true, size: true, color: true, colorHex: true, price: true, salePrice: true, stock: true },
  },
};

type ProductWithCard = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export interface ProductCardColor {
  name: string;
  hex: string | null;
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  gender: string;
  price: number;
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  image: string;
  hoverImage: string | null;
  colors: ProductCardColor[];
  sizes: string[];
  sizesInStock: string[];
  inStock: boolean;
  isNew: boolean;
  createdAt: Date;
  defaultVariantId: string | null;
  variantCount: number;
}

export function toProductCard(p: ProductWithCard): ProductCard {
  const prices = p.variants.map((v) => Number(v.salePrice ?? v.price));
  const compareAtPrices = p.variants.map((v) => Number(v.price));
  const minPrice = prices.length ? Math.min(...prices) : Number(p.basePrice);
  const hasSale = p.variants.some((v) => v.salePrice);
  const maxCompare = hasSale ? Math.max(...compareAtPrices) : p.compareAtPrice ? Number(p.compareAtPrice) : null;

  const colorMap = new Map<string, string | null>();
  for (const v of p.variants) {
    if (!v.color) continue;
    if (!colorMap.has(v.color) || (colorMap.get(v.color) === null && v.colorHex)) {
      colorMap.set(v.color, v.colorHex ?? null);
    }
  }

  const defaultVariant = p.variants.find((v) => v.isDefault) ?? p.variants[0] ?? null;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand?.name ?? null,
    gender: p.gender,
    price: minPrice,
    compareAtPrice: maxCompare,
    rating: p.avgRating,
    reviewCount: p.reviewCount,
    image: p.images[0]?.url ?? "",
    hoverImage: p.images[1]?.url ?? null,
    colors: [...colorMap.entries()].map(([name, hex]) => ({ name, hex })),
    sizes: [...new Set(p.variants.map((v) => v.size).filter(Boolean))] as string[],
    sizesInStock: [...new Set(p.variants.filter((v) => v.stock > 0).map((v) => v.size).filter(Boolean))] as string[],
    inStock: p.variants.some((v) => v.stock > 0),
    isNew: Date.now() - p.createdAt.getTime() < 1000 * 60 * 60 * 24 * 30,
    createdAt: p.createdAt,
    defaultVariantId: defaultVariant?.id ?? null,
    variantCount: p.variants.length,
  };
}

export async function getNewArrivals(limit = 8): Promise<ProductCard[]> {
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: cardInclude,
  });
  return products.map(toProductCard);
}

export async function getTrending(limit = 8): Promise<ProductCard[]> {
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ viewCount: "desc" }, { purchaseCount: "desc" }],
    take: limit,
    include: cardInclude,
  });
  return products.map(toProductCard);
}

export async function getBestSellers(limit = 8): Promise<ProductCard[]> {
  const products = await db.product.findMany({
    where: { status: "ACTIVE", purchaseCount: { gt: 0 } },
    orderBy: { purchaseCount: "desc" },
    take: limit,
    include: cardInclude,
  });
  if (products.length >= limit) return products.map(toProductCard);

  const fallback = await db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { avgRating: "desc" },
    take: limit,
    include: cardInclude,
  });
  return fallback.map(toProductCard);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCard[]> {
  const products = await db.product.findMany({
    where: { status: "ACTIVE", isFeatured: true },
    take: limit,
    include: cardInclude,
  });
  return products.map(toProductCard);
}

export async function getProductsByCollectionSlug(slug: string, limit = 8): Promise<ProductCard[]> {
  const products = await db.product.findMany({
    where: { status: "ACTIVE", collections: { some: { slug } } },
    take: limit,
    include: cardInclude,
  });
  return products.map(toProductCard);
}

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 4): Promise<ProductCard[]> {
  const products = await db.product.findMany({
    where: { status: "ACTIVE", categoryId, id: { not: excludeId } },
    take: limit,
    include: cardInclude,
  });
  return products.map(toProductCard);
}

export { cardInclude };
