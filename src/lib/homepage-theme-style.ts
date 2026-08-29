import type { CSSProperties } from "react";
import type { SiteSettings } from "@/lib/settings";
import { HEADING_FONT_VARS, BODY_FONT_VARS, LETTER_SPACING_VALUES, LINE_HEIGHT_VALUES } from "@/lib/homepage-theme";

/**
 * Builds the inline `--hp-*` var overrides for the homepage wrapper, from
 * `settings.homepageTheme`. Kept as inline `style` (not a CSS class) since
 * values are admin-editable data, not design-time constants — see the
 * `.hp-*` utilities in globals.css that consume these variables.
 */
export function homepageThemeStyle(theme: SiteSettings["homepageTheme"]): CSSProperties {
  return {
    "--hp-accent": theme.colors.accent,
    "--hp-accent-soft": theme.colors.accentSoft,
    "--hp-surface": theme.colors.surface,
    "--hp-surface-dim": theme.colors.surfaceDim,
    "--hp-ink": theme.colors.ink,
    "--hp-heading-font": HEADING_FONT_VARS[theme.typography.headingFont],
    "--hp-heading-weight": theme.typography.headingWeight,
    "--hp-letter-spacing": LETTER_SPACING_VALUES[theme.typography.letterSpacing],
    "--hp-line-height": LINE_HEIGHT_VALUES[theme.typography.lineHeight],
    "--hp-body-font": BODY_FONT_VARS[theme.typography.bodyFont],
  } as CSSProperties;
}
