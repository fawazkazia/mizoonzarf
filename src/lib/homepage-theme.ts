/**
 * Curated font list for the homepage theme (Admin > Homepage > Theme). Kept
 * deliberately small and preloaded via next/font/google in src/app/layout.tsx
 * — no arbitrary/dynamic Google Font loading, for performance and CSP reasons.
 * Selecting an option only swaps a CSS variable; every font here is already
 * bundled regardless of which one is active.
 */

export const HOMEPAGE_HEADING_FONTS = ["cormorant", "playfair", "libreBaskerville", "dmSerif", "manrope", "poppins"] as const;
export type HomepageHeadingFont = (typeof HOMEPAGE_HEADING_FONTS)[number];

export const HOMEPAGE_BODY_FONTS = ["manrope", "inter"] as const;
export type HomepageBodyFont = (typeof HOMEPAGE_BODY_FONTS)[number];

export const HEADING_FONT_LABELS: Record<HomepageHeadingFont, string> = {
  cormorant: "Cormorant Garamond",
  playfair: "Playfair Display",
  libreBaskerville: "Libre Baskerville",
  dmSerif: "DM Serif Display",
  manrope: "Manrope (default)",
  poppins: "Poppins",
};

export const BODY_FONT_LABELS: Record<HomepageBodyFont, string> = {
  manrope: "Manrope (default)",
  inter: "Inter",
};

/** CSS variable each font key resolves to — declared by next/font/google in layout.tsx. */
export const HEADING_FONT_VARS: Record<HomepageHeadingFont, string> = {
  cormorant: "var(--font-display)",
  playfair: "var(--font-playfair)",
  libreBaskerville: "var(--font-libre-baskerville)",
  dmSerif: "var(--font-dm-serif)",
  manrope: "var(--font-sans)",
  poppins: "var(--font-promo)",
};

export const BODY_FONT_VARS: Record<HomepageBodyFont, string> = {
  manrope: "var(--font-sans)",
  inter: "var(--font-inter)",
};

export const HEADING_WEIGHTS = ["400", "500", "600", "700"] as const;
export const LETTER_SPACINGS = ["tight", "normal", "wide"] as const;
export const LINE_HEIGHTS = ["tight", "normal", "relaxed"] as const;

export type HomepageHeadingWeight = (typeof HEADING_WEIGHTS)[number];
export type HomepageLetterSpacing = (typeof LETTER_SPACINGS)[number];
export type HomepageLineHeight = (typeof LINE_HEIGHTS)[number];

export const LETTER_SPACING_VALUES: Record<HomepageLetterSpacing, string> = {
  tight: "-0.01em",
  normal: "normal",
  wide: "0.04em",
};

export const LINE_HEIGHT_VALUES: Record<HomepageLineHeight, string> = {
  tight: "1.1",
  normal: "1.25",
  relaxed: "1.45",
};
