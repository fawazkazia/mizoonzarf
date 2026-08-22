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
    countryFlag: z.string().min(1),
  }),
  branding: z.object({
    logoUrl: z.string().optional().nullable(),
    faviconUrl: z.string().optional().nullable(),
  }),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
