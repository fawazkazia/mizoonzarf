export interface MegaMenuColumnConfig {
  title: string;
  childSlugs: string[];
}

export interface MegaMenuVerticalConfig {
  columns: MegaMenuColumnConfig[];
  featureChildSlug?: string;
  feature?: { eyebrow?: string; title?: string };
}

/**
 * Column GROUPING LABELS only — the one thing the Category tree can't
 * express without an admin field for it. This is additive over the real DB
 * tree, never authoritative: buildNavItems() (src/lib/nav.ts) drops any
 * listed slug that's missing from the DB and sweeps any DB child not listed
 * here into an auto "More in {name}" column, so adding/removing a category
 * in the database can never break or silently vanish from the menu — this
 * file only affects how existing children get labelled and grouped.
 */
export const MEGA_MENU_CONFIG: Record<string, MegaMenuVerticalConfig> = {
  men: {
    columns: [
      { title: "Clothing", childSlugs: ["mens-shirts", "mens-tshirts", "mens-trousers", "mens-jeans", "mens-traditional"] },
      { title: "Accessories", childSlugs: ["mens-accessories"] },
    ],
    featureChildSlug: "mens-traditional",
    feature: { eyebrow: "The Edit", title: "Traditional Wear" },
  },
  women: {
    columns: [
      { title: "Clothing", childSlugs: ["womens-dresses", "womens-tops", "womens-abayas", "womens-traditional"] },
      { title: "Accessories", childSlugs: ["womens-accessories"] },
    ],
    featureChildSlug: "womens-dresses",
    feature: { eyebrow: "The Edit", title: "New Season Dresses" },
  },
  kids: {
    columns: [{ title: "Shop by", childSlugs: ["kids-boys", "kids-girls"] }],
  },
  perfumes: {
    columns: [{ title: "Shop by", childSlugs: ["perfumes-men", "perfumes-women", "perfumes-unisex"] }],
    featureChildSlug: "perfumes-women",
    feature: { eyebrow: "The Edit", title: "Signature Scents" },
  },
  jewellery: {
    columns: [
      { title: "Shop by", childSlugs: ["jewellery-necklaces", "jewellery-rings", "jewellery-bracelets", "jewellery-earrings"] },
    ],
    featureChildSlug: "jewellery-necklaces",
    feature: { eyebrow: "The Edit", title: "Statement Necklaces" },
  },
};
