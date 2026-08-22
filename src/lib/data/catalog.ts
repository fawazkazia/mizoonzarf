import { db } from "@/lib/db";
import { toProductCard, cardInclude, type ProductCard } from "@/lib/data/products";
import type { Prisma } from "@/generated/prisma/client";

export type SortOption = "recommended" | "newest" | "price_asc" | "price_desc" | "best_selling" | "rating";

export interface CatalogQuery {
  categorySlug?: string;
  subCategorySlug?: string;
  saleOnly?: boolean;
  onSale?: boolean;
  inStockOnly?: boolean;
  collectionSlug?: string;
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

export async function queryProducts(query: CatalogQuery): Promise<CatalogResult> {
  const { ids: categoryIds, title } = await resolveCategoryIds(query.categorySlug, query.subCategorySlug);
  const page = Math.max(query.page ?? 1, 1);

  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (categoryIds) where.categoryId = { in: categoryIds };
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
  if (query.brands?.length) where.brand = { name: { in: query.brands } };
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.basePrice = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }
  if (query.minRating) where.avgRating = { gte: query.minRating };

  // All variant-level conditions accumulate into a single `some` clause.
  // Previously saleOnly and sizes/colors each assigned where.variants
  // independently, so combining them (e.g. /sale?size=M) silently dropped
  // whichever condition was assigned first.
  const variantSome: Prisma.ProductVariantWhereInput = {};
  if (query.saleOnly || query.onSale) variantSome.salePrice = { not: null };
  if (query.inStockOnly) variantSome.stock = { gt: 0 };
  if (query.sizes?.length) variantSome.size = { in: query.sizes };
  if (query.colors?.length) variantSome.color = { in: query.colors };
  if (Object.keys(variantSome).length > 0) where.variants = { some: variantSome };

  const [items, total, facets] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: SORT_ORDER[query.sort ?? "recommended"],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: cardInclude,
    }),
    db.product.count({ where }),
    getFacets(categoryIds),
  ]);

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

async function getFacets(categoryIds: string[] | null): Promise<CatalogFacets> {
  const productWhere: Prisma.ProductWhereInput = { status: "ACTIVE", ...(categoryIds ? { categoryId: { in: categoryIds } } : {}) };

  const [variants, brands, priceAgg] = await Promise.all([
    db.productVariant.findMany({ where: { product: productWhere }, select: { size: true, color: true, colorHex: true } }),
    db.product.findMany({ where: productWhere, select: { brand: { select: { name: true } } }, distinct: ["brandId"] }),
    db.product.aggregate({ where: productWhere, _min: { basePrice: true }, _max: { basePrice: true } }),
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
  };
}
