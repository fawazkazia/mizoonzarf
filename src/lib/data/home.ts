import { db } from "@/lib/db";
import { toProductCard, cardInclude, type ProductCard } from "@/lib/data/products";
import type { ObjectPosition } from "@/generated/prisma/client";

export async function getHeroSlides() {
  const now = new Date();
  return db.banner.findMany({
    where: {
      position: "HERO",
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPromoBanner() {
  const now = new Date();
  return db.banner.findFirst({
    where: {
      position: "PROMO",
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getActiveFlashSale() {
  const now = new Date();
  const promo = await db.promotion.findFirst({
    where: { type: "FLASH_SALE", isActive: true, startDate: { lte: now }, endDate: { gte: now } },
  });
  if (!promo) return null;

  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      ...(promo.categorySlugs.length > 0 ? { category: { slug: { in: promo.categorySlugs } } } : {}),
      variants: { some: { salePrice: { not: null } } },
    },
    take: 8,
    include: cardInclude,
  });

  return { promo, products: products.map(toProductCard) };
}

export async function getFeaturedCollections(limit = 3) {
  return db.collection.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: limit });
}

export async function getFeaturedBrands(limit = 5) {
  return db.brand.findMany({ orderBy: { name: "asc" }, take: limit });
}

/** Returns every HomepageSection row, visible or not — the page (via
 * resolveHomepageSections/visibleSectionKeys in lib/home-sections.ts)
 * decides what's visible, so "no row for this key" and "row explicitly
 * hidden" stay distinguishable instead of both filtering to nothing. */
export async function getHomepageSections() {
  return db.homepageSection.findMany();
}

export interface VerticalFeatureResult {
  category: {
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    imageObjectPosition: ObjectPosition | null;
  };
  products: ProductCard[];
}

/** Backs homepage sections like "Perfume Collection" / "Jewellery
 * Collection" — a top-level category plus its best products, scoped to that
 * category and its children. Returns null if the slug doesn't resolve to a
 * category, so the section simply doesn't render rather than erroring. */
export async function getVerticalFeature(slug: string, limit = 4): Promise<VerticalFeatureResult | null> {
  const category = await db.category.findUnique({
    where: { slug },
    include: { children: { select: { id: true } } },
  });
  if (!category) return null;

  const categoryIds = [category.id, ...category.children.map((c) => c.id)];
  const products = await db.product.findMany({
    where: { status: "ACTIVE", categoryId: { in: categoryIds } },
    orderBy: [{ isFeatured: "desc" }, { avgRating: "desc" }],
    take: limit,
    include: cardInclude,
  });

  return {
    category: {
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      imageObjectPosition: category.imageObjectPosition,
    },
    products: products.map(toProductCard),
  };
}
