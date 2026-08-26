import type { CatalogQuery } from "@/lib/data/catalog";

// Keys are what a customer would type; values match the DB's stored casing
// (ProductVariant.color) — the catalog filter does an exact case-sensitive
// match, so this mapping matters, not just cosmetic capitalization.
const COLOR_WORD_MAP: Record<string, string> = {
  black: "Black",
  white: "White",
  red: "Red",
  blue: "Blue",
  navy: "Navy",
  gold: "Gold",
  silver: "Silver",
  beige: "Beige",
  pink: "Pink",
  emerald: "Emerald",
  sage: "Sage",
  grey: "Grey",
  gray: "Grey",
  brown: "Brown",
  cream: "Cream",
  ivory: "Ivory",
  khaki: "Khaki",
  olive: "Olive",
  yellow: "Yellow",
  teal: "Teal",
  rose: "Rose",
  champagne: "Champagne",
  charcoal: "Charcoal",
  camel: "Camel",
};

const OCCASION_WORDS = ["wedding", "casual", "classic", "evening", "office", "resort", "romantic", "bold", "minimal", "summer", "party"];

const GENDER_PATTERNS: { slug: string; label: string; pattern: RegExp }[] = [
  { slug: "kids", label: "Kids", pattern: /\bkids?\b|\bchildren'?s?\b/ },
  { slug: "women", label: "Women's", pattern: /\bwomen'?s?\b|\bladies'?\b|\bladies\b/ },
  { slug: "men", label: "Men's", pattern: /\bmen'?s?\b/ },
];

// Garment/keyword fallbacks when no explicit gender word is present.
const GENDER_HINT_WORDS: { slug: string; label: string; words: string[] }[] = [
  { slug: "women", label: "Women's", words: ["dress", "dresses", "gown", "gowns", "skirt", "skirts"] },
  { slug: "men", label: "Men's", words: ["kurta", "kandura", "kanduras"] },
];

const NON_GENDERED_CATEGORY_HINTS: { slug: string; label: string; words: string[] }[] = [
  { slug: "perfumes", label: "Perfumes", words: ["perfume", "perfumes", "fragrance", "fragrances", "cologne"] },
  { slug: "jewellery", label: "Jewellery", words: ["jewellery", "jewelry", "necklace", "necklaces", "earring", "earrings", "bracelet", "bracelets", "ring", "rings"] },
];

export interface ParsedQuery {
  filters: Partial<CatalogQuery>;
  summary: string | null;
}

function extractPrice(text: string): { minPrice?: number; maxPrice?: number; summary: string[] } {
  const summary: string[] = [];
  let minPrice: number | undefined;
  let maxPrice: number | undefined;

  const between = text.match(/between\s+([\d,]+)\s+(?:and|to|-)\s+([\d,]+)/);
  if (between) {
    minPrice = Number(between[1].replace(/,/g, ""));
    maxPrice = Number(between[2].replace(/,/g, ""));
    summary.push(`${minPrice}–${maxPrice}`);
    return { minPrice, maxPrice, summary };
  }

  const under = text.match(/(?:under|below|less than)\s*[a-z]{0,4}\s*([\d,]+)/);
  if (under) {
    maxPrice = Number(under[1].replace(/,/g, ""));
    summary.push(`under ${maxPrice}`);
  }

  const over = text.match(/(?:over|above|more than)\s*[a-z]{0,4}\s*([\d,]+)/);
  if (over) {
    minPrice = Number(over[1].replace(/,/g, ""));
    summary.push(`over ${minPrice}`);
  }

  return { minPrice, maxPrice, summary };
}

function extractSize(text: string): { size?: string; summary: string[] } {
  const match = text.match(/\bsize\s+([a-z0-9]+)\b/i);
  if (!match) return { summary: [] };
  const size = match[1].toUpperCase();
  return { size, summary: [`size ${size}`] };
}

/**
 * Real rule-based understanding for queries like "black shirts under AED 300"
 * or "I need a wedding outfit under AED 500" — no LLM involved. Returns a
 * Partial<CatalogQuery> so the caller can feed it straight into
 * queryProducts() (src/lib/data/catalog.ts), the same engine every other
 * catalog view already uses.
 */
export function parseNaturalLanguageQuery(rawText: string): ParsedQuery {
  const text = rawText.toLowerCase();
  const summaryParts: string[] = [];
  const filters: Partial<CatalogQuery> = {};

  const { minPrice, maxPrice, summary: priceSummary } = extractPrice(text);
  if (minPrice !== undefined) filters.minPrice = minPrice;
  if (maxPrice !== undefined) filters.maxPrice = maxPrice;
  summaryParts.push(...priceSummary);

  const matchedColorWords = Object.keys(COLOR_WORD_MAP).filter((c) => new RegExp(`\\b${c}\\b`).test(text));
  if (matchedColorWords.length > 0) {
    filters.colors = [...new Set(matchedColorWords.map((c) => COLOR_WORD_MAP[c]))];
    summaryParts.unshift(matchedColorWords.join("/"));
  }

  const { size, summary: sizeSummary } = extractSize(text);
  if (size) {
    filters.sizes = [size];
    summaryParts.push(...sizeSummary);
  }

  let categorySlug: string | undefined;
  let categoryLabel: string | undefined;
  for (const g of GENDER_PATTERNS) {
    if (g.pattern.test(text)) {
      categorySlug = g.slug;
      categoryLabel = g.label;
      break;
    }
  }
  if (!categorySlug) {
    for (const hint of GENDER_HINT_WORDS) {
      if (hint.words.some((w) => new RegExp(`\\b${w}\\b`).test(text))) {
        categorySlug = hint.slug;
        categoryLabel = hint.label;
        break;
      }
    }
  }
  if (!categorySlug) {
    for (const hint of NON_GENDERED_CATEGORY_HINTS) {
      if (hint.words.some((w) => new RegExp(`\\b${w}\\b`).test(text))) {
        categorySlug = hint.slug;
        categoryLabel = hint.label;
        break;
      }
    }
  }
  if (categorySlug) {
    filters.categorySlug = categorySlug;
    summaryParts.unshift(categoryLabel!);
  }

  const matchedOccasion = OCCASION_WORDS.find((o) => new RegExp(`\\b${o}\\b`).test(text));
  if (matchedOccasion) {
    filters.searchTerm = matchedOccasion;
    summaryParts.push(matchedOccasion);
  }

  const hasStructuredFilters = Object.keys(filters).length > 0;
  return {
    filters,
    summary: hasStructuredFilters ? summaryParts.filter(Boolean).join(", ") : null,
  };
}
