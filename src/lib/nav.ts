import type { Category } from "@/generated/prisma/client";
import { MEGA_MENU_CONFIG, type MegaMenuVerticalConfig } from "@/config/mega-menu";

export interface MegaLink {
  label: string;
  href: string;
  tone?: "sale" | "new";
  imageUrl?: string | null;
}

export interface MegaColumn {
  title: string;
  links: MegaLink[];
}

export interface MegaFeature {
  imageUrl: string | null;
  seed: string;
  eyebrow?: string;
  title: string;
  href: string;
}

export interface NavItem {
  name: string;
  slug: string;
  href: string;
  tone?: "default" | "sale";
  isVirtual?: boolean;
  quickLinks: MegaLink[];
  columns: MegaColumn[];
  brands: MegaLink[];
  feature?: MegaFeature;
}

export type CategoryWithChildren = Category & { children: Category[] };

export interface CategoryBannerHit {
  imageUrl: string;
  title: string;
  subtitle: string | null;
  ctaLink: string | null;
}

type CategoryBannerLookup = (slug: string) => CategoryBannerHit | null;
type CategoryBrandsLookup = (slug: string) => { name: string; slug: string }[];

/**
 * Single source of truth for header nav, the mobile drawer, and the footer's
 * shop links — replaces three independently hardcoded link lists (which is
 * how the footer used to silently diverge from the header whenever a
 * category was added). "Sale" is appended as a virtual item since it's a
 * page (/sale), not a real Category row — see [category]/page.tsx's
 * category === "sale" special case. It still gets a real dropdown (empty
 * `columns` would mean no mega menu at all for it), built from the sort/
 * discount params the /sale route already supports, with an optional
 * feature banner sourced the same way a category's would be.
 */
function toBrandLinks(brands: { name: string; slug: string }[], categorySlug: string): MegaLink[] {
  return brands.map((b) => ({ label: b.name, href: `/${categorySlug}?brand=${encodeURIComponent(b.name)}` }));
}

export function buildNavItems(
  categories: CategoryWithChildren[],
  getCategoryBanner?: CategoryBannerLookup,
  saleFeature?: CategoryBannerHit | null,
  getCategoryBrands?: CategoryBrandsLookup,
  fallbackBrands: { name: string; slug: string }[] = []
): NavItem[] {
  const items = categories.map((category) => buildNavItem(category, getCategoryBanner, getCategoryBrands));

  items.push({
    name: "Sale",
    slug: "sale",
    href: "/sale",
    tone: "sale",
    isVirtual: true,
    quickLinks: [
      { label: "New Markdowns", href: "/sale?sort=newest" },
      { label: "20% Off or More", href: "/sale?discount=20" },
    ],
    columns: [
      {
        title: "Shop Sale",
        links: [
          { label: "All Sale", href: "/sale" },
          { label: "New Markdowns", href: "/sale?sort=newest", tone: "new" },
          { label: "20% Off or More", href: "/sale?discount=20" },
          { label: "30% Off or More", href: "/sale?discount=30" },
          { label: "50% Off or More", href: "/sale?discount=50" },
        ],
      },
    ],
    brands: toBrandLinks(fallbackBrands, "sale"),
    feature: saleFeature
      ? {
          imageUrl: saleFeature.imageUrl,
          seed: "sale",
          title: saleFeature.title,
          eyebrow: saleFeature.subtitle ?? undefined,
          href: saleFeature.ctaLink || "/sale",
        }
      : { imageUrl: null, seed: "sale", title: "Shop the Sale", href: "/sale" },
  });

  return items;
}

function buildNavItem(
  category: CategoryWithChildren,
  getCategoryBanner?: CategoryBannerLookup,
  getCategoryBrands?: CategoryBrandsLookup
): NavItem {
  const slug = category.slug;
  const config = MEGA_MENU_CONFIG[slug];
  const children = category.children;
  const childBySlug = new Map(children.map((c) => [c.slug, c]));

  const quickLinks: MegaLink[] = [
    { label: "New Arrivals", href: `/${slug}?sort=newest` },
    { label: "Best Sellers", href: `/${slug}?sort=best_selling` },
    { label: "Under 200", href: `/${slug}?maxPrice=200` },
  ];

  const columns = buildColumns(category, config, children, childBySlug);

  columns.push({
    title: "Featured",
    links: [
      { label: "Shop All", href: `/${slug}` },
      { label: "New Arrivals", href: `/${slug}?sort=newest` },
      { label: "Best Sellers", href: `/${slug}?sort=best_selling` },
      { label: "Top Rated", href: `/${slug}?sort=rating` },
      { label: "Sale", href: "/sale", tone: "sale" },
    ],
  });

  const feature = buildFeature(category, config, childBySlug, getCategoryBanner);
  const brands = toBrandLinks(getCategoryBrands?.(slug) ?? [], slug);

  return { name: category.name, slug, href: `/${slug}`, tone: "default", quickLinks, columns, brands, feature };
}

function buildColumns(
  category: CategoryWithChildren,
  config: MegaMenuVerticalConfig | undefined,
  children: Category[],
  childBySlug: Map<string, Category>
): MegaColumn[] {
  if (!config) {
    if (children.length === 0) return [];
    return [
      {
        title: `Shop ${category.name}`,
        links: children.map((c) => ({ label: c.name, href: `/${category.slug}?category=${c.slug}`, imageUrl: c.imageUrl })),
      },
    ];
  }

  const usedSlugs = new Set<string>();
  const columns: MegaColumn[] = config.columns
    .map((col) => {
      const links = col.childSlugs
        .map((childSlug): MegaLink | null => {
          const child = childBySlug.get(childSlug);
          if (!child) return null;
          usedSlugs.add(childSlug);
          return { label: child.name, href: `/${category.slug}?category=${child.slug}`, imageUrl: child.imageUrl };
        })
        .filter((l): l is MegaLink => l !== null);
      return { title: col.title, links };
    })
    .filter((col) => col.links.length > 0);

  const leftover = children.filter((c) => !usedSlugs.has(c.slug));
  if (leftover.length > 0) {
    columns.push({
      title: `More in ${category.name}`,
      links: leftover.map((c) => ({ label: c.name, href: `/${category.slug}?category=${c.slug}`, imageUrl: c.imageUrl })),
    });
  }

  return columns;
}

function buildFeature(
  category: CategoryWithChildren,
  config: MegaMenuVerticalConfig | undefined,
  childBySlug: Map<string, Category>,
  getCategoryBanner?: CategoryBannerLookup
): MegaFeature {
  const banner = getCategoryBanner?.(category.slug);
  if (banner) {
    return {
      imageUrl: banner.imageUrl,
      seed: category.slug,
      title: banner.title,
      eyebrow: banner.subtitle ?? undefined,
      href: banner.ctaLink || `/${category.slug}`,
    };
  }

  const featureChild = config?.featureChildSlug ? childBySlug.get(config.featureChildSlug) : undefined;
  if (featureChild) {
    return {
      imageUrl: featureChild.imageUrl,
      seed: featureChild.slug,
      title: config?.feature?.title ?? featureChild.name,
      eyebrow: config?.feature?.eyebrow,
      href: `/${category.slug}?category=${featureChild.slug}`,
    };
  }

  return {
    imageUrl: category.imageUrl,
    seed: category.slug,
    title: category.name,
    href: `/${category.slug}`,
  };
}
