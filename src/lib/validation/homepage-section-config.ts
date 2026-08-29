import { z } from "zod";
import { objectPositionSchema } from "@/lib/object-position";

/**
 * Per-section `HomepageSection.config` shapes. Only keys listed in
 * `homepageSectionConfigSchemas` get an "Edit content" panel in
 * `/admin/homepage` — every other section's content is already owned by a
 * dedicated admin page (Banners, Categories, Collections, Settings) and is
 * cross-linked from there instead of duplicated here.
 *
 * Every field has a `.default()` matching today's hardcoded literal, so an
 * empty/missing/malformed config always resolves to the current design —
 * nothing changes on the storefront until an admin actually edits a field.
 */

export const shopByCategoryRailConfigSchema = z.object({
  heading: z.string().trim().min(1).default("Shop By Category"),
});
export type ShopByCategoryRailConfig = z.infer<typeof shopByCategoryRailConfigSchema>;

export const featuredCollectionsConfigSchema = z.object({
  heading: z.string().trim().min(1).default("Featured Collections"),
  ctaText: z.string().trim().min(1).default("Explore the Edit"),
});
export type FeaturedCollectionsConfig = z.infer<typeof featuredCollectionsConfigSchema>;

/** Shared by newArrivals / trending / bestSellers / recommendedProducts (all ProductRail). */
export const productRailConfigSchema = z.object({
  eyebrow: z.string().trim().default(""),
  title: z.string().trim().min(1).default("Featured"),
  subtitle: z.string().trim().default(""),
});
export type ProductRailConfig = z.infer<typeof productRailConfigSchema>;

export const PRODUCT_RAIL_DEFAULTS: Record<string, ProductRailConfig> = {
  newArrivals: { eyebrow: "Just In", title: "New Arrivals", subtitle: "The latest additions to the edit" },
  trending: { eyebrow: "Trending", title: "Trending Now", subtitle: "What everyone is loving right now" },
  bestSellers: { eyebrow: "Best Sellers", title: "Best Sellers", subtitle: "Our most-loved pieces" },
  recommendedProducts: { eyebrow: "For You", title: "Recommended For You", subtitle: "Hand-picked pieces from across the edit" },
};

/** Shared by perfumeFeature / jewelleryFeature / mensFeature / womensFeature / kidsFeature (all VerticalFeature). */
export const verticalFeatureConfigSchema = z.object({
  eyebrow: z.string().trim().min(1).default("The Edit"),
});
export type VerticalFeatureConfig = z.infer<typeof verticalFeatureConfigSchema>;

export const VERTICAL_FEATURE_DEFAULTS: Record<string, VerticalFeatureConfig> = {
  perfumeFeature: { eyebrow: "The Edit" },
  jewelleryFeature: { eyebrow: "The Edit" },
  mensFeature: { eyebrow: "Menswear" },
  womensFeature: { eyebrow: "Womenswear" },
  kidsFeature: { eyebrow: "Little Ones" },
};

const socialGalleryImageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().trim().default("Style inspiration"),
  link: z.string().trim().optional().nullable(),
  objectPosition: objectPositionSchema,
});

const DEFAULT_SOCIAL_IMAGES = [
  "/images/banners/social-0.jpg",
  "/images/banners/social-1.jpg",
  "/images/banners/social-2.jpg",
  "/images/banners/social-3.jpg",
  "/images/banners/social-4.jpg",
  "/images/banners/social-5.jpg",
].map((url) => ({ url, alt: "Style inspiration", link: null, objectPosition: null }));

export const socialGalleryConfigSchema = z.object({
  heading: z.string().trim().min(1).default("Style For Every Generation"),
  subtitle: z.string().trim().default("Follow us for daily style inspiration."),
  images: z.array(socialGalleryImageSchema).min(2).max(8).default(DEFAULT_SOCIAL_IMAGES),
});
export type SocialGalleryConfig = z.infer<typeof socialGalleryConfigSchema>;

export const newsletterConfigSchema = z.object({
  heading: z.string().trim().min(1).default("Join the List"),
  subtitle: z.string().trim().default("Exclusive drops. No spam. Unsubscribe anytime."),
  placeholder: z.string().trim().default("Your email address"),
  imageUrl: z.string().trim().optional().nullable(),
  objectPosition: objectPositionSchema,
});
export type NewsletterConfig = z.infer<typeof newsletterConfigSchema>;

export const styleFinderConfigSchema = z.object({
  eyebrow: z.string().trim().min(1).default("Style Finder"),
  heading: z.string().trim().min(1).default("Find Your Style"),
});
export type StyleFinderConfig = z.infer<typeof styleFinderConfigSchema>;

export const adBannerConfigSchema = z.object({
  eyebrow: z.string().trim().default("Limited Time"),
  heading: z.string().trim().min(1).default("Elevate Your Wardrobe"),
  subheading: z.string().trim().default("Up to 40% off selected styles"),
  ctaText: z.string().trim().min(1).default("Shop the Offer"),
  ctaLink: z.string().trim().min(1).default("/women"),
  imageUrl: z.string().trim().optional().nullable(),
  objectPosition: objectPositionSchema,
});
export type AdBannerConfig = z.infer<typeof adBannerConfigSchema>;

/** Same slim animated banner, reused at multiple homepage slots (`adBanner`,
 * `adBanner2`, ...) — each slot keeps its own config row, so defaults differ
 * per key even though the schema is shared. */
export const AD_BANNER_DEFAULTS: Record<string, AdBannerConfig> = {
  adBanner: {
    eyebrow: "Limited Time",
    heading: "Elevate Your Wardrobe",
    subheading: "Up to 40% off selected styles",
    ctaText: "Shop the Offer",
    ctaLink: "/women",
    imageUrl: null,
    objectPosition: null,
  },
  adBanner2: {
    eyebrow: "New Season",
    heading: "Dress The Little Ones",
    subheading: "Fresh kids' styles, all sizes",
    ctaText: "Shop Kids",
    ctaLink: "/kids",
    imageUrl: null,
    objectPosition: null,
  },
};

/** Section keys with an editable config, and the schema each one validates against.
 * Keys not present here (hero, promoBanner, genderTriptych, flashSale, brandStripTop/Bottom,
 * imageRunningBanner, runningBanner, styleFinder's taxonomy) have no config panel — their
 * content already lives on a dedicated admin page, or is explicitly out of scope. */
export const homepageSectionConfigSchemas = {
  shopByCategoryRail: shopByCategoryRailConfigSchema,
  featuredCollections: featuredCollectionsConfigSchema,
  newArrivals: productRailConfigSchema,
  trending: productRailConfigSchema,
  bestSellers: productRailConfigSchema,
  recommendedProducts: productRailConfigSchema,
  perfumeFeature: verticalFeatureConfigSchema,
  jewelleryFeature: verticalFeatureConfigSchema,
  mensFeature: verticalFeatureConfigSchema,
  womensFeature: verticalFeatureConfigSchema,
  kidsFeature: verticalFeatureConfigSchema,
  socialGallery: socialGalleryConfigSchema,
  newsletter: newsletterConfigSchema,
  styleFinder: styleFinderConfigSchema,
  adBanner: adBannerConfigSchema,
  adBanner2: adBannerConfigSchema,
} satisfies Record<string, z.ZodType>;

export type HomepageSectionConfigKey = keyof typeof homepageSectionConfigSchemas;

export function isConfigurableSection(key: string): key is HomepageSectionConfigKey {
  return key in homepageSectionConfigSchemas;
}

/** Safely resolves a section's config: validates `raw` against its schema, falling back to
 * the schema's own defaults (via ProductRail/VerticalFeature per-key overrides where relevant)
 * on any parse failure — untyped DB JSON must never be trusted blindly. */
export function resolveSectionConfig<K extends HomepageSectionConfigKey>(
  key: K,
  raw: unknown
): z.infer<(typeof homepageSectionConfigSchemas)[K]> {
  type Config = z.infer<(typeof homepageSectionConfigSchemas)[K]>;
  const schema = homepageSectionConfigSchemas[key];
  if (raw) {
    const parsed = schema.safeParse(raw);
    if (parsed.success) return parsed.data as Config;
  }
  const perKeyDefault: unknown = PRODUCT_RAIL_DEFAULTS[key] ?? VERTICAL_FEATURE_DEFAULTS[key] ?? AD_BANNER_DEFAULTS[key] ?? {};
  return schema.parse(perKeyDefault) as Config;
}
