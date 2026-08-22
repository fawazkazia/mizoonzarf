import { db } from "@/lib/db";
import { toProductCard, cardInclude, type ProductCard } from "@/lib/data/products";
import type { Gender } from "@/generated/prisma/client";

/**
 * Category-level merchandising hints, not per-product pairings — kept as a
 * small config rather than a schema addition. A category missing from this
 * map (e.g. one an admin adds later) still gets sensible suggestions via
 * resolveTargetSlugs' dynamic fallback below, so this never hard-fails on
 * new data.
 */
const COMPLEMENT_MAP: Record<string, string[]> = {
  "mens-shirts": ["mens-trousers", "mens-accessories", "perfumes-men"],
  "mens-tshirts": ["mens-jeans", "mens-accessories", "perfumes-men"],
  "mens-trousers": ["mens-shirts", "mens-accessories", "perfumes-men"],
  "mens-jeans": ["mens-tshirts", "mens-accessories", "perfumes-men"],
  "mens-traditional": ["mens-accessories", "perfumes-men", "jewellery-bracelets"],
  "mens-accessories": ["mens-shirts", "mens-trousers", "perfumes-men"],
  "womens-dresses": ["jewellery-necklaces", "womens-accessories", "perfumes-women"],
  "womens-tops": ["jewellery-earrings", "womens-accessories", "perfumes-women"],
  "womens-abayas": ["jewellery-bracelets", "womens-accessories", "perfumes-women"],
  "womens-traditional": ["jewellery-necklaces", "perfumes-women", "womens-accessories"],
  "womens-accessories": ["womens-dresses", "jewellery-rings", "perfumes-women"],
  "kids-boys": ["kids-girls"],
  "kids-girls": ["kids-boys"],
  "perfumes-men": ["mens-shirts", "mens-accessories", "jewellery-bracelets"],
  "perfumes-women": ["womens-dresses", "jewellery-necklaces", "womens-accessories"],
  "perfumes-unisex": ["mens-accessories", "womens-accessories"],
  "jewellery-necklaces": ["womens-dresses", "perfumes-women", "jewellery-earrings"],
  "jewellery-rings": ["womens-dresses", "perfumes-women"],
  "jewellery-bracelets": ["womens-dresses", "mens-traditional", "perfumes-women"],
  "jewellery-earrings": ["womens-dresses", "perfumes-women"],
};

export interface CompleteTheLookSlot {
  categoryName: string;
  product: ProductCard;
}

export interface CompleteTheLookSource {
  id: string;
  categorySlug: string;
  gender: Gender;
  tags: string[];
  brandId: string | null;
}

async function resolveTargetSlugs(categorySlug: string): Promise<string[]> {
  const mapped = COMPLEMENT_MAP[categorySlug];
  if (mapped) return mapped;

  // Dynamic fallback for a category the map doesn't know about: a sibling
  // under the same parent, then a gender-appropriate perfume/jewellery pick.
  const category = await db.category.findUnique({
    where: { slug: categorySlug },
    include: { parent: { include: { children: true } } },
  });
  if (!category) return [];

  const siblings = (category.parent?.children ?? []).map((c) => c.slug).filter((s) => s !== categorySlug);
  const topSlug = category.parent?.slug ?? categorySlug;
  const genderPicks =
    topSlug === "women" ? ["perfumes-women", "jewellery-necklaces"] : ["perfumes-men", "jewellery-bracelets"];

  return [...siblings, ...genderPicks].slice(0, 3);
}

function scoreCandidate(
  row: { tags: string[]; isFeatured: boolean; brandId: string | null; avgRating: number; purchaseCount: number },
  source: CompleteTheLookSource
) {
  const sharedTags = row.tags.filter((t) => source.tags.includes(t)).length;
  let score = sharedTags * 3;
  if (row.isFeatured) score += 2;
  if (row.brandId && row.brandId === source.brandId) score += 1;
  score += row.avgRating * 0.5;
  score += Math.min(row.purchaseCount, 20) * 0.05;
  return score;
}

/**
 * Resolves cross-category "complete the look" suggestions for a PDP.
 * Genuinely dynamic merchandising, not a hardcoded per-product list: each
 * target category is queried fresh and the best in-stock match is scored in
 * memory by shared tags/featured/brand/rating — no new API route needed
 * since the PDP is already server-rendered.
 */
export async function getCompleteTheLook(source: CompleteTheLookSource, limit = 3): Promise<CompleteTheLookSlot[]> {
  const targetSlugs = await resolveTargetSlugs(source.categorySlug);
  if (targetSlugs.length === 0) return [];

  const perSlug = await Promise.all(
    targetSlugs.map(async (slug) => {
      const [category, rows] = await Promise.all([
        db.category.findUnique({ where: { slug }, select: { name: true } }),
        db.product.findMany({
          where: {
            status: "ACTIVE",
            id: { not: source.id },
            category: { slug },
            gender: { in: [source.gender, "UNISEX"] },
            variants: { some: { stock: { gt: 0 } } },
          },
          include: cardInclude,
          take: 8,
        }),
      ]);
      return { slug, categoryName: category?.name ?? slug, rows };
    })
  );

  const seen = new Set<string>();
  const slots: CompleteTheLookSlot[] = [];

  for (const { categoryName, rows } of perSlug) {
    const best = rows
      .filter((r) => !seen.has(r.id))
      .map((row) => ({ row, score: scoreCandidate(row, source) }))
      .sort((a, b) => b.score - a.score)[0];
    if (!best) continue;
    seen.add(best.row.id);
    slots.push({ categoryName, product: toProductCard(best.row) });
    if (slots.length >= limit) break;
  }

  return slots;
}
