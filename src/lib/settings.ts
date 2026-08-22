import { cache } from "react";
import { db } from "@/lib/db";

export interface SiteSettings {
  brandName: string;
  brandTagline: string;
  currency: string;
  currencySymbol: string;
  taxPercent: number;
  taxInclusive: boolean;
  whatsappNumber: string;
  supportEmail: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    x?: string;
  };
  shipping: {
    standardFee: number;
    expressFee: number;
    freeShippingThreshold: number;
    standardDays: string;
    expressDays: string;
  };
  footer: {
    about: string;
    contactAddress: string;
  };
  header: {
    promoMessages: string[];
    showFreeShipping: boolean;
    supportPhone: string;
    countryLabel: string;
    countryFlag: string;
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
  };
}

const DEFAULT_SETTINGS: SiteSettings = {
  brandName: "MAISON LUXE",
  brandTagline: "Fashion for Every Moment",
  currency: "AED",
  currencySymbol: "AED",
  taxPercent: 5,
  taxInclusive: false,
  whatsappNumber: "971500000000",
  supportEmail: "care@maisonluxe.com",
  socialLinks: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
    x: "https://x.com",
  },
  shipping: {
    standardFee: 15,
    expressFee: 35,
    freeShippingThreshold: 250,
    standardDays: "3-5 business days",
    expressDays: "1-2 business days",
  },
  footer: {
    about:
      "Maison Luxe curates premium fashion, fragrance and jewellery for men, women and children across the region.",
    contactAddress: "Sheikh Zayed Road, Dubai, United Arab Emirates",
  },
  header: {
    promoMessages: ["Free delivery on orders over {threshold}", "New season arrivals are here"],
    showFreeShipping: true,
    supportPhone: "+971 4 000 0000",
    countryLabel: "United Arab Emirates",
    countryFlag: "🇦🇪",
  },
  branding: {
    logoUrl: "",
    faviconUrl: "",
  },
};

/**
 * Reads CMS-configurable settings from the Setting table, falling back to
 * DEFAULT_SETTINGS for any key that hasn't been configured yet. Cached per
 * request so pages that render many sections don't re-query repeatedly.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await db.setting.findMany();
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    ...DEFAULT_SETTINGS,
    ...overrides,
    socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...(overrides.socialLinks as object) },
    shipping: { ...DEFAULT_SETTINGS.shipping, ...(overrides.shipping as object) },
    footer: { ...DEFAULT_SETTINGS.footer, ...(overrides.footer as object) },
    header: { ...DEFAULT_SETTINGS.header, ...(overrides.header as object) },
    branding: { ...DEFAULT_SETTINGS.branding, ...(overrides.branding as object) },
  } as SiteSettings;
});
