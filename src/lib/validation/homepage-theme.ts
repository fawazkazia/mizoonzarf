import { z } from "zod";
import { HOMEPAGE_HEADING_FONTS, HOMEPAGE_BODY_FONTS, HEADING_WEIGHTS, LETTER_SPACINGS, LINE_HEIGHTS } from "@/lib/homepage-theme";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color, e.g. #a9803f");

export const homepageThemeInputSchema = z.object({
  colors: z.object({
    accent: hex,
    accentSoft: hex,
    surface: hex,
    surfaceDim: hex,
    ink: hex,
  }),
  typography: z.object({
    headingFont: z.enum(HOMEPAGE_HEADING_FONTS),
    bodyFont: z.enum(HOMEPAGE_BODY_FONTS),
    headingWeight: z.enum(HEADING_WEIGHTS),
    letterSpacing: z.enum(LETTER_SPACINGS),
    lineHeight: z.enum(LINE_HEIGHTS),
  }),
});

export type HomepageThemeInput = z.infer<typeof homepageThemeInputSchema>;
