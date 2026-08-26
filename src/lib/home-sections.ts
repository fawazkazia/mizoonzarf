import { z } from "zod";
import type { HomepageSection } from "@/generated/prisma/client";

export interface HomepageSectionDef {
  key: string;
  label: string;
}

/** Canonical section catalogue + default order. Both the storefront (fallback
 * order for keys missing from the DB) and the admin homepage editor (the list
 * of togglable/reorderable sections) read this — it's the single source of
 * truth for "what sections exist," since HomepageSection rows are optional
 * per-key overrides, not the definition of what a key even means. */
export const HOMEPAGE_SECTION_DEFS: HomepageSectionDef[] = [
  { key: "hero", label: "Hero Slider" },
  { key: "shopByCategoryRail", label: "Shop By Category (Scroll Rail)" },
  { key: "genderTriptych", label: "Shop Men | Women | Kids" },
  { key: "newArrivals", label: "New Arrivals" },
  { key: "trending", label: "Trending Now" },
  { key: "mensFeature", label: "Men's Collection" },
  { key: "womensFeature", label: "Women's Collection" },
  { key: "kidsFeature", label: "Kids Collection" },
  { key: "promoBanner", label: "Promotional Banner" },
  { key: "bestSellers", label: "Best Sellers" },
  { key: "perfumeFeature", label: "Perfume Collection" },
  { key: "jewelleryFeature", label: "Jewellery Collection" },
  { key: "recommendedProducts", label: "Recommended For You" },
  { key: "featuredCollections", label: "Featured Collections" },
  { key: "styleFinder", label: "Style Finder" },
  { key: "flashSale", label: "Sale" },
  { key: "socialGallery", label: "Social Gallery" },
  { key: "newsletter", label: "Newsletter" },
];

export const DEFAULT_SECTION_ORDER = HOMEPAGE_SECTION_DEFS.map((d) => d.key);

export interface ResolvedSection {
  key: string;
  label: string;
  isVisible: boolean;
  sortOrder: number;
  title: string | null;
  config: Record<string, unknown> | null;
}

const configShape = z.record(z.string(), z.unknown());

function parseConfig(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const result = configShape.safeParse(raw);
  return result.success ? result.data : null;
}

/**
 * Merges HomepageSection DB rows with the canonical default order. A key
 * absent from the DB defaults to visible at its position in
 * DEFAULT_SECTION_ORDER, so shipping a brand-new section never requires a
 * data migration for it to render. A key present in the DB always uses the
 * DB's sortOrder/isVisible, so admin edits are authoritative once made.
 */
export function resolveHomepageSections(rows: HomepageSection[]): ResolvedSection[] {
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const labelByKey = new Map(HOMEPAGE_SECTION_DEFS.map((d) => [d.key, d.label]));

  const known = DEFAULT_SECTION_ORDER.map((key, index) => {
    const row = byKey.get(key);
    return {
      key,
      label: labelByKey.get(key) ?? key,
      isVisible: row ? row.isVisible : true,
      sortOrder: row ? row.sortOrder : index,
      title: row?.title ?? null,
      config: parseConfig(row?.config),
    };
  });

  // A DB row for a key no longer in DEFAULT_SECTION_ORDER (e.g. removed from
  // a future code change) still renders if visible, so content is never
  // silently lost — it just sorts wherever its stored sortOrder places it.
  const extra = rows
    .filter((r) => !DEFAULT_SECTION_ORDER.includes(r.key))
    .map((r) => ({
      key: r.key,
      label: r.key,
      isVisible: r.isVisible,
      sortOrder: r.sortOrder,
      title: r.title,
      config: parseConfig(r.config),
    }));

  return [...known, ...extra].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function visibleSectionKeys(rows: HomepageSection[]): string[] {
  return resolveHomepageSections(rows)
    .filter((s) => s.isVisible)
    .map((s) => s.key);
}

export function sectionConfig(resolved: ResolvedSection[], key: string): Record<string, unknown> | null {
  return resolved.find((s) => s.key === key)?.config ?? null;
}
