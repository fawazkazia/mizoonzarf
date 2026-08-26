import { cache } from "react";
import { db } from "@/lib/db";

export const getMenuCategories = cache(async () => {
  return db.category.findMany({
    where: { parentId: null, showInMenu: true, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
});

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: { children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } }, parent: true },
  });
}

export async function getAllCategorySlugs() {
  const categories = await db.category.findMany({ select: { slug: true } });
  return categories.map((c) => c.slug);
}

/** Brands with at least one product in this category or one of its children — powers the mega menu's "Shop by Brand" column. */
export async function getCategoryBrands(categoryId: string, childIds: string[] = []) {
  return db.brand.findMany({
    where: { products: { some: { categoryId: { in: [categoryId, ...childIds] } } } },
    orderBy: { name: "asc" },
    take: 10,
  });
}

/** Site-wide brand list — fallback for virtual nav items (e.g. Sale) that have no real category to scope brands to. */
export async function getTopBrands() {
  return db.brand.findMany({ orderBy: { name: "asc" }, take: 10 });
}

/**
 * Activates the otherwise-unused BannerPosition.CATEGORY value: a Banner
 * whose ctaLink starts with /{slug} is treated as that category's editorial
 * PLP/mega-menu-feature banner. No schema change (Banner has no category
 * FK) — the ctaLink-prefix match is a documented convention, not a real
 * relation, so this is an override the storefront falls back gracefully
 * without (see getCategoryBySlug's imageUrl for the always-available default).
 */
export async function getCategoryBanner(slug: string) {
  const now = new Date();
  return db.banner.findFirst({
    where: {
      position: "CATEGORY",
      isActive: true,
      ctaLink: { startsWith: `/${slug}` },
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { sortOrder: "asc" },
  });
}
