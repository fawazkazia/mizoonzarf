/**
 * Recommended dimensions for every homepage image slot, derived from the
 * actual rendered Tailwind sizes of each component. Shown as a `Field` hint
 * next to the relevant upload control — same pattern as `BANNER_DIMENSIONS`
 * in src/app/admin/banners/BannerForm.tsx (kept separate since Banner
 * dimensions vary per `position` and already have their own table there).
 */
export interface ImageDimensionHint {
  label: string;
  desktop: { width: number; height: number };
  mobile?: { width: number; height: number };
  usage: "Desktop" | "Mobile" | "Both";
  note?: string;
}

const HOMEPAGE_IMAGE_DIMENSIONS_RAW = {
  shopByCategoryRailItem: {
    label: "Shop By Category tile",
    desktop: { width: 280, height: 280 },
    usage: "Both",
    note: "Square tile, ~7rem in the scroll rail.",
  },
  genderTriptychTile: {
    label: "Shop Men / Women / Kids tile",
    desktop: { width: 1280, height: 576 },
    mobile: { width: 750, height: 448 },
    usage: "Both",
  },
  featuredCollectionTile: {
    label: "Featured Collection tile",
    desktop: { width: 1000, height: 450 },
    mobile: { width: 750, height: 450 },
    usage: "Both",
    note: "The first collection renders wider — see the \"wide\" variant.",
  },
  featuredCollectionTileWide: {
    label: "Featured Collection tile (first / wide)",
    desktop: { width: 2000, height: 450 },
    mobile: { width: 750, height: 450 },
    usage: "Both",
  },
  verticalFeature: {
    label: "Collection Feature image (Menswear, Womenswear, etc.)",
    desktop: { width: 1400, height: 1056 },
    mobile: { width: 750, height: 448 },
    usage: "Both",
  },
  socialGalleryTile: {
    label: "Social Gallery tile",
    desktop: { width: 600, height: 600 },
    usage: "Both",
    note: "The 1st and 6th images render wider — see the \"wide\" variant.",
  },
  socialGalleryTileWide: {
    label: "Social Gallery tile (1st / 6th image)",
    desktop: { width: 1200, height: 600 },
    usage: "Both",
  },
  newsletterImage: {
    label: "Newsletter panel image",
    desktop: { width: 1000, height: 1200 },
    usage: "Desktop",
    note: "Hidden on mobile — no mobile asset needed.",
  },
  brandLogo: {
    label: "Brand logo",
    desktop: { width: 256, height: 256 },
    usage: "Both",
  },
} as const satisfies Record<string, ImageDimensionHint>;

export const HOMEPAGE_IMAGE_DIMENSIONS: Record<keyof typeof HOMEPAGE_IMAGE_DIMENSIONS_RAW, ImageDimensionHint> =
  HOMEPAGE_IMAGE_DIMENSIONS_RAW;

export type HomepageImageSlot = keyof typeof HOMEPAGE_IMAGE_DIMENSIONS_RAW;

function ratioLabel(width: number, height: number): string {
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Builds the `hint` string passed to `Field`, e.g. "Recommended: 1280×576px (Desktop) — Ratio 20:9". */
export function dimensionHint(slot: HomepageImageSlot): string {
  const d = HOMEPAGE_IMAGE_DIMENSIONS[slot];
  const desktop = `${d.desktop.width}×${d.desktop.height}px`;
  const parts = [`Recommended: ${desktop} (Desktop, Ratio ${ratioLabel(d.desktop.width, d.desktop.height)})`];
  if (d.mobile) {
    parts.push(`Mobile: ${d.mobile.width}×${d.mobile.height}px (Ratio ${ratioLabel(d.mobile.width, d.mobile.height)})`);
  } else if (d.usage !== "Desktop") {
    parts.push("Same image used on mobile");
  }
  if (d.note) parts.push(d.note);
  return parts.join(" — ");
}
