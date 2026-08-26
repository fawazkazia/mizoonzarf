import { db } from "@/lib/db";
import { toProductCard, cardInclude, type ProductCard } from "@/lib/data/products";
import type { Prisma } from "@/generated/prisma/client";

export type SortOption = "recommended" | "newest" | "price_asc" | "price_desc" | "best_selling" | "rating" | "highest_discount";

export interface CatalogQuery {
  categorySlug?: string;
  subCategorySlug?: string;
  saleOnly?: boolean;
  onSale?: boolean;
  inStockOnly?: boolean;
  newArrivals?: boolean;
  bestSellers?: boolean;
  collectionSlug?: string;
  minDiscountPercent?: number;
  searchTerm?: string;
  sizes?: string[];
  colors?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: SortOption;
  page?: number;
}

const NEW_ARRIVAL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export interface CatalogFacetColor {
  name: string;
  hex: string | null;
}

export interface CatalogFacets {
  sizes: string[];
  colors: CatalogFacetColor[];
  brands: string[];
  priceMin: number;
  priceMax: number;
  /**
   * Filter-aware counts: how many products match if every OTHER active
   * filter stays applied but this dimension's own filter is lifted. An
   * option present in `sizes`/`colors`/`brands` above but absent (or 0)
   * here means "exists for this category, but not under your current
   * filters" — the UI greys it out instead of hiding it outright.
   */
  sizeCounts: Record<string, number>;
  colorCounts: Record<string, number>;
  brandCounts: Record<string, number>;
}

export interface CatalogResult {
  products: ProductCard[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  facets: CatalogFacets;
  title: string;
}

const PER_PAGE = 24;

const SORT_ORDER: Record<SortOption, Prisma.ProductOrderByWithRelationInput[]> = {
  recommended: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  newest: [{ createdAt: "desc" }],
  price_asc: [{ basePrice: "asc" }],
  price_desc: [{ basePrice: "desc" }],
  best_selling: [{ purchaseCount: "desc" }],
  rating: [{ avgRating: "desc" }],
  // Unused by the Prisma orderBy path — highest_discount is computed via
  // getProductIdsSortedByDiscount instead. Kept here only so this map stays
  // exhaustive over SortOption.
  highest_discount: [{ createdAt: "desc" }],
};

async function resolveCategoryIds(categorySlug?: string, subCategorySlug?: string) {
  if (!categorySlug) return { ids: null as string[] | null, title: "Sale" };

  const top = await db.category.findUnique({
    where: { slug: categorySlug },
    include: { children: true },
  });
  if (!top) return { ids: [], title: categorySlug };

  if (subCategorySlug) {
    const sub = top.children.find((c) => c.slug === subCategorySlug);
    return { ids: sub ? [sub.id] : [top.id], title: sub?.name ?? top.name };
  }

  return { ids: [top.id, ...top.children.map((c) => c.id)], title: top.name };
}

type FacetDimension = "sizes" | "colors" | "brands";

/**
 * Single source of truth for turning a CatalogQuery into a Prisma where
 * clause — shared by queryProducts and getFacets so they can never diverge
 * (a prior bug had saleOnly and size/color filters independently assign
 * where.variants, silently dropping whichever was set first).
 *
 * `exclude` lifts one facet dimension's own filter — used by getFacets to
 * compute "how many products match every filter except this one," which is
 * what a filter-aware facet count needs.
 */
function buildProductWhere(
  query: CatalogQuery,
  categoryIds: string[] | null,
  productIds: string[] | null,
  exclude?: FacetDimension
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (categoryIds) where.categoryId = { in: categoryIds };
  if (productIds) where.id = { in: productIds };
  if (query.collectionSlug) where.collections = { some: { slug: query.collectionSlug } };
  if (query.searchTerm) {
    where.OR = [
      { name: { contains: query.searchTerm, mode: "insensitive" } },
      { sku: { contains: query.searchTerm, mode: "insensitive" } },
      { tags: { has: query.searchTerm.toLowerCase() } },
      { brand: { name: { contains: query.searchTerm, mode: "insensitive" } } },
      { category: { name: { contains: query.searchTerm, mode: "insensitive" } } },
    ];
  }
  if (exclude !== "brands" && query.brands?.length) where.brand = { name: { in: query.brands } };
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.basePrice = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }
  if (query.minRating) where.avgRating = { gte: query.minRating };
  if (query.newArrivals) where.createdAt = { gte: new Date(Date.now() - NEW_ARRIVAL_WINDOW_MS) };

  const variantSome: Prisma.ProductVariantWhereInput = {};
  if (query.saleOnly || query.onSale) variantSome.salePrice = { not: null };
  if (query.inStockOnly) variantSome.stock = { gt: 0 };
  if (exclude !== "sizes" && query.sizes?.length) variantSome.size = { in: query.sizes };
  if (exclude !== "colors" && query.colors?.length) variantSome.color = { in: query.colors };
  if (Object.keys(variantSome).length > 0) where.variants = { some: variantSome };

  return where;
}

/**
 * True percentage-discount filtering can't be expressed as a Prisma field
 * comparison (it needs arithmetic between two columns on the same row), so
 * this resolves the matching product IDs via one raw query up front and
 * folds them into the normal where clause — total/totalPages stay accurate
 * because everything downstream just sees a normal `id IN (...)` filter,
 * not a post-fetch filter that would silently under-report counts.
 */
async function getProductIdsWithMinDiscount(minPercent: number): Promise<string[]> {
  const rows = await db.$queryRaw<{ productId: string }[]>`
    SELECT DISTINCT pv."productId" AS "productId"
    FROM "product_variants" pv
    WHERE pv."salePrice" IS NOT NULL
      AND pv."price" > 0
      AND ((pv."price" - pv."salePrice") / pv."price") * 100 >= ${minPercent}
  `;
  return rows.map((r) => r.productId);
}

/**
 * "Best Sellers" isn't a stored flag — it's derived as the top quartile by
 * purchaseCount among ACTIVE products in the current category scope, so the
 * filter stays honest (data-driven) without a schema/admin-config addition.
 */
async function getBestSellerProductIds(categoryIds: string[] | null): Promise<string[]> {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE", purchaseCount: { gt: 0 } };
  if (categoryIds) where.categoryId = { in: categoryIds };

  const products = await db.product.findMany({ where, select: { id: true }, orderBy: { purchaseCount: "desc" } });
  if (products.length === 0) return [];

  const topCount = Math.max(1, Math.ceil(products.length * 0.25));
  return products.slice(0, topCount).map((p) => p.id);
}

function intersectIds(a: string[] | null, b: string[] | null): string[] | null {
  if (!a) return b;
  if (!b) return a;
  const set = new Set(b);
  return a.filter((id) => set.has(id));
}

/**
 * Percentage discount is computed across variant rows, so it can't be a
 * Prisma `orderBy`. Mirrors getProductIdsWithMinDiscount's raw-query
 * approach, but returns a full ranked ID list (undiscounted products sort
 * last) instead of a min-percent cutoff.
 */
async function getProductIdsSortedByDiscount(where: Prisma.ProductWhereInput): Promise<string[]> {
  const allIds = (await db.product.findMany({ where, select: { id: true } })).map((p) => p.id);
  if (allIds.length === 0) return [];

  const ranked = await db.$queryRaw<{ productId: string }[]>`
    SELECT pv."productId" AS "productId", MAX(((pv.price - pv."salePrice") / pv.price) * 100) AS "maxDiscount"
    FROM "product_variants" pv
    WHERE pv."salePrice" IS NOT NULL AND pv.price > 0 AND pv."productId" = ANY(${allIds})
    GROUP BY pv."productId"
    ORDER BY "maxDiscount" DESC
  `;

  const rankedIds = ranked.map((r) => r.productId);
  const rankedSet = new Set(rankedIds);
  return [...rankedIds, ...allIds.filter((id) => !rankedSet.has(id))];
}

export async function queryProducts(query: CatalogQuery): Promise<CatalogResult> {
  const { ids: categoryIds, title } = await resolveCategoryIds(query.categorySlug, query.subCategorySlug);
  const page = Math.max(query.page ?? 1, 1);

  const [discountProductIds, bestSellerProductIds] = await Promise.all([
    query.minDiscountPercent ? getProductIdsWithMinDiscount(query.minDiscountPercent) : Promise.resolve(null),
    query.bestSellers ? getBestSellerProductIds(categoryIds) : Promise.resolve(null),
  ]);
  const combinedIds = intersectIds(discountProductIds, bestSellerProductIds);
  const where = buildProductWhere(query, categoryIds, combinedIds);

  let items;
  let total;
  if (query.sort === "highest_discount") {
    const orderedIds = await getProductIdsSortedByDiscount(where);
    total = orderedIds.length;
    const pageIds = orderedIds.slice((page - 1) * PER_PAGE, (page - 1) * PER_PAGE + PER_PAGE);
    const rows = await db.product.findMany({ where: { id: { in: pageIds } }, include: cardInclude });
    const byId = new Map(rows.map((r) => [r.id, r]));
    items = pageIds.map((id) => byId.get(id)!).filter(Boolean);
  } else {
    [items, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: SORT_ORDER[query.sort ?? "recommended"],
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
        include: cardInclude,
      }),
      db.product.count({ where }),
    ]);
  }

  const facets = await getFacets(query, categoryIds, combinedIds);

  return {
    products: items.map(toProductCard),
    total,
    page,
    perPage: PER_PAGE,
    totalPages: Math.max(Math.ceil(total / PER_PAGE), 1),
    facets,
    title,
  };
}

async function getDistinctVariantDimension(
  where: Prisma.ProductWhereInput,
  dimension: "size" | "color"
): Promise<Record<string, number>> {
  const rows = await db.productVariant.findMany({
    where: { [dimension]: { not: null }, product: where },
    select: { productId: true, [dimension]: true },
    distinct: ["productId", dimension],
  });
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const value = (row as Record<string, unknown>)[dimension] as string | null;
    if (value) counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

async function getBrandCounts(where: Prisma.ProductWhereInput): Promise<Record<string, number>> {
  const rows = await db.product.findMany({ where, select: { brand: { select: { name: true } } } });
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.brand?.name) counts[row.brand.name] = (counts[row.brand.name] ?? 0) + 1;
  }
  return counts;
}

async function getFacets(query: CatalogQuery, categoryIds: string[] | null, productIds: string[] | null): Promise<CatalogFacets> {
  const productWhere = buildProductWhere({}, categoryIds, productIds);

  const [variants, brands, priceAgg, sizeCounts, colorCounts, brandCounts] = await Promise.all([
    db.productVariant.findMany({ where: { product: productWhere }, select: { size: true, color: true, colorHex: true } }),
    db.product.findMany({ where: productWhere, select: { brand: { select: { name: true } } }, distinct: ["brandId"] }),
    db.product.aggregate({ where: productWhere, _min: { basePrice: true }, _max: { basePrice: true } }),
    getDistinctVariantDimension(buildProductWhere(query, categoryIds, productIds, "sizes"), "size"),
    getDistinctVariantDimension(buildProductWhere(query, categoryIds, productIds, "colors"), "color"),
    getBrandCounts(buildProductWhere(query, categoryIds, productIds, "brands")),
  ]);

  const colorMap = new Map<string, string | null>();
  for (const v of variants) {
    if (!v.color) continue;
    if (!colorMap.has(v.color) || (colorMap.get(v.color) === null && v.colorHex)) {
      colorMap.set(v.color, v.colorHex ?? null);
    }
  }

  return {
    sizes: [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[],
    colors: [...colorMap.entries()].map(([name, hex]) => ({ name, hex })),
    brands: [...new Set(brands.map((b) => b.brand?.name).filter(Boolean))].sort() as string[],
    priceMin: Math.floor(Number(priceAgg._min.basePrice ?? 0)),
    priceMax: Math.ceil(Number(priceAgg._max.basePrice ?? 1000)),
    sizeCounts,
    colorCounts,
    brandCounts,
  };
}
