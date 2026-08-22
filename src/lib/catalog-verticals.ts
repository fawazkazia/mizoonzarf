import type { SortOption } from "@/lib/data/catalog";

export type CardAspect = "3/4" | "1/1" | "4/5";

export interface CatalogVerticalConfig {
  eyebrow: string;
  cardAspect: CardAspect;
  accent: "ink" | "gold";
  defaultSort: SortOption;
  subNavStyle: "pill" | "image";
}

const DEFAULT_CONFIG: CatalogVerticalConfig = {
  eyebrow: "Shop",
  cardAspect: "3/4",
  accent: "ink",
  defaultSort: "recommended",
  subNavStyle: "pill",
};

/**
 * Presentation-only config, no schema/DB — keeps one generic PLP template
 * ([category]/page.tsx) feeling distinct per vertical (jewellery/perfume
 * merchandise differently than apparel) without forking into per-vertical
 * page files. Unknown slugs (a new admin-added category, /search) fall back
 * to DEFAULT_CONFIG so nothing ever breaks.
 */
export const CATALOG_VERTICALS: Record<string, CatalogVerticalConfig> = {
  men: { eyebrow: "Menswear", cardAspect: "3/4", accent: "ink", defaultSort: "recommended", subNavStyle: "pill" },
  women: { eyebrow: "Womenswear", cardAspect: "3/4", accent: "ink", defaultSort: "recommended", subNavStyle: "pill" },
  kids: { eyebrow: "Kids", cardAspect: "4/5", accent: "gold", defaultSort: "recommended", subNavStyle: "image" },
  perfumes: { eyebrow: "Fragrance", cardAspect: "1/1", accent: "gold", defaultSort: "recommended", subNavStyle: "image" },
  jewellery: { eyebrow: "Jewellery", cardAspect: "1/1", accent: "gold", defaultSort: "recommended", subNavStyle: "image" },
  sale: { eyebrow: "Sale", cardAspect: "3/4", accent: "ink", defaultSort: "newest", subNavStyle: "pill" },
};

export function getCatalogVerticalConfig(slug: string): CatalogVerticalConfig {
  return CATALOG_VERTICALS[slug] ?? DEFAULT_CONFIG;
}
