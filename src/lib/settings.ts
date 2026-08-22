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
  /**
   * Display-only currency conversion: the store's real currency (`currency`
   * above) is the only one ever stored or charged — cart, checkout, and
   * orders always use it. This block only lets a shopper *view* approximate
   * prices in another currency while browsing; `rate` is "1 unit of the
   * base currency equals `rate` units of this one."
   */
  currencyDisplay: {
    enabled: boolean;
    options: { code: string; symbol: string; rate: number }[];
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
  currencyDisplay: {
    enabled: true,
    options: [
      { code: "USD", symbol: "$", rate: 0.2723 },
      { code: "EUR", symbol: "€", rate: 0.2517 },
      { code: "GBP", symbol: "£", rate: 0.2163 },
      { code: "SAR", symbol: "SAR", rate: 1.0225 },
    ],
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
    currencyDisplay: { ...DEFAULT_SETTINGS.currencyDisplay, ...(overrides.currencyDisplay as object) },
  } as SiteSettings;
});
