import { z } from "zod";

export const settingsInputSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  brandTagline: z.string().min(1, "Tagline is required"),
  currency: z.string().min(1),
  currencySymbol: z.string().min(1),
  taxPercent: z.coerce.number().min(0).max(100),
  taxInclusive: z.boolean().default(false),
  whatsappNumber: z.string().min(1),
  supportEmail: z.string().email("Enter a valid email"),
  gst: z.object({
    sellerGstin: z
      .string()
      .trim()
      .toUpperCase()
      .refine((v) => v === "" || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v), "Enter a valid 15-character GSTIN"),
    sellerState: z.string(),
    sellerLegalName: z.string(),
    sellerAddress: z.string(),
  }),
  legal: z.object({
    cancellationPolicy: z.string(),
  }),
  promoStrips: z.object({
    codeBanner: z.object({
      enabled: z.boolean().default(true),
      headline: z.string().min(1),
      codeText: z.string().min(1),
      link: z.string().min(1),
      bgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color, e.g. #14130f"),
      accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color, e.g. #e3d94a"),
      imageUrl: z.string().optional().nullable(),
    }),
    brandsBanner: z.object({
      enabled: z.boolean().default(true),
      tagline: z.string().min(1),
      link: z.string().min(1),
      gradientFrom: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color"),
      gradientVia: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color"),
      gradientTo: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color"),
      imageUrl: z.string().optional().nullable(),
      features: z
        .array(
          z.object({
            icon: z.enum(["bag", "truck", "gift"]),
            lines: z.array(z.string()),
          })
        )
        .length(3),
    }),
  }),
  socialLinks: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    tiktok: z.string().optional(),
    x: z.string().optional(),
  }),
  shipping: z.object({
    standardFee: z.coerce.number().min(0),
    expressFee: z.coerce.number().min(0),
    freeShippingThreshold: z.coerce.number().min(0),
    standardDays: z.string().min(1),
    expressDays: z.string().min(1),
    processingDays: z.coerce.number().min(0),
  }),
  footer: z.object({
    about: z.string().min(1),
    contactAddress: z.string().min(1),
  }),
  header: z.object({
    promoMessages: z.array(z.string()).default([]),
    showFreeShipping: z.boolean().default(true),
    supportPhone: z.string().min(1),
    countryLabel: z.string().min(1),
    countryCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Use a 2-letter ISO country code, e.g. AE"),
  }),
  branding: z.object({
    logoUrl: z.string().optional().nullable(),
    mobileLogoUrl: z.string().optional().nullable(),
    faviconUrl: z.string().optional().nullable(),
  }),
  codRisk: z.object({
    maxCodOrderValue: z.coerce.number().min(0),
    maxCodOrdersPerCustomer: z.coerce.number().int().min(0),
    highValueCodThreshold: z.coerce.number().min(0),
    allowHighRiskCod: z.boolean(),
    requireConfirmOnHighRiskCod: z.boolean(),
  }),
  currencyDisplay: z.object({
    enabled: z.boolean().default(true),
    options: z
      .array(
        z.object({
          code: z.string().min(1).max(6),
          symbol: z.string().min(1).max(6),
          rate: z.coerce.number().positive(),
          country: z
            .string()
            .trim()
            .toUpperCase()
            .regex(/^[A-Z]{2}$/, "Use a 2-letter ISO country code, e.g. US"),
          countryLabel: z.string().min(1),
        })
      )
      .default([]),
  }),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
