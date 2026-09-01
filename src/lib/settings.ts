import { cache } from "react";
import { db } from "@/lib/db";
import type { HomepageHeadingFont, HomepageBodyFont } from "@/lib/homepage-theme";

export interface SiteSettings {
  brandName: string;
  brandTagline: string;
  currency: string;
  currencySymbol: string;
  /** Default GST % used when a product has no gstRate override. */
  taxPercent: number;
  taxInclusive: boolean;
  whatsappNumber: string;
  supportEmail: string;
  gst: {
    sellerGstin: string;
    /** Business's registered state — compared to the shipping address state to decide CGST+SGST vs IGST. */
    sellerState: string;
    sellerLegalName: string;
    sellerAddress: string;
  };
  /** Admin-editable legal copy for pages that have no other content source. */
  legal: {
    cancellationPolicy: string;
    returnPolicy: string;
    shippingPolicy: string;
    termsAndConditions: string;
    privacyPolicy: string;
    /** Body copy on /about, below the intro line (which stays footer.about, shared with the site footer/meta description). */
    aboutStory: string;
    /** Body copy on /careers, above the "email us" line. */
    careersInfo: string;
  };
  /** The two full-width promo strips rendered site-wide just below the header. */
  promoStrips: {
    codeBanner: {
      enabled: boolean;
      headline: string;
      codeText: string;
      link: string;
      bgColor: string;
      accentColor: string;
      /** Optional photo behind the banner — falls back to bgColor when unset. */
      imageUrl: string | null;
    };
    brandsBanner: {
      enabled: boolean;
      tagline: string;
      link: string;
      gradientFrom: string;
      gradientVia: string;
      gradientTo: string;
      /** Optional photo behind the banner — falls back to the gradient when unset. */
      imageUrl: string | null;
      features: { icon: "bag" | "truck" | "gift"; lines: string[] }[];
    };
  };
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
    processingDays: number;
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
    /** ISO 3166-1 alpha-2 code (e.g. "AE") used to look up the flag icon. */
    countryCode: string;
  };
  branding: {
    logoUrl: string;
    /** Falls back to `logoUrl` when unset — most stores don't need a separate mobile mark. */
    mobileLogoUrl: string | null;
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
    /** `country` is the ISO 3166-1 alpha-2 code (or "EU") used to look up that option's flag icon. */
    options: { code: string; symbol: string; rate: number; country: string; countryLabel: string }[];
  };
  /**
   * Sitewide "homepage theme" — a single global color/typography layer for
   * homepage-exclusive chrome (section headings, eyebrows, accent dividers),
   * applied via dedicated `--hp-*` CSS variables so it never re-themes shared
   * components (ProductCard etc.) that also render outside the homepage.
   * Deliberately one global set, not per-section — see src/app/admin/homepage/theme.
   */
  homepageTheme: {
    colors: {
      accent: string;
      accentSoft: string;
      surface: string;
      surfaceDim: string;
      ink: string;
    };
    typography: {
      headingFont: HomepageHeadingFont;
      bodyFont: HomepageBodyFont;
      headingWeight: "400" | "500" | "600" | "700";
      letterSpacing: "tight" | "normal" | "wide";
      lineHeight: "tight" | "normal" | "relaxed";
    };
  };
  /**
   * Admin-editable branding for transactional emails (order confirmation, status
   * updates, tracking). `fromEmailOverride` only takes effect if it's on a domain
   * verified with the email provider (Resend) — otherwise sends fall back to
   * RESEND_FROM_EMAIL. Logo/support email/phone/address come from `branding`/
   * `header`/`supportEmail`/`footer` above and aren't duplicated here.
   */
  email: {
    senderName: string;
    fromEmailOverride: string;
    replyToEmail: string;
    footerNote: string;
  };
  /** Admin-configurable COD availability + fraud-risk gating — enforced server-side in /api/checkout. */
  codRisk: {
    /** COD is refused above this order total regardless of risk level. */
    maxCodOrderValue: number;
    /** Once a customer has this many COD orders (last 90 days), further orders must be prepaid. */
    maxCodOrdersPerCustomer: number;
    /** Feeds the "high-value COD, thin delivery history" risk signal. */
    highValueCodThreshold: number;
    /** If false, HIGH risk customers can't select COD at all. */
    allowHighRiskCod: boolean;
    /** If true (and allowHighRiskCod is true), HIGH risk COD orders require a COD-confirmation OTP before they're accepted. */
    requireConfirmOnHighRiskCod: boolean;
  };
}

const DEFAULT_SETTINGS: SiteSettings = {
  brandName: "MIZOON ZARF",
  brandTagline: "Fashion for Every Moment",
  currency: "INR",
  currencySymbol: "₹",
  taxPercent: 18,
  taxInclusive: true,
  whatsappNumber: "919500000000",
  supportEmail: "info@mizoonzarf.in",
  gst: {
    sellerGstin: "",
    sellerState: "",
    sellerLegalName: "",
    sellerAddress: "",
  },
  legal: {
    cancellationPolicy:
      "[PLACEHOLDER — replace with your registered cancellation policy]\n\n" +
      "You can cancel an order for free any time before it has been packed for shipping — go to Order History and select Cancel Order, " +
      "or contact us and we'll cancel it for you. Once an order has shipped, it can no longer be cancelled; you're welcome to refuse " +
      "delivery or request a return instead. Refunds for cancelled orders are credited to the original payment method within 5-7 business days.",
    returnPolicy:
      "We want you to love what you ordered. If something isn't right, you can request a return within 14 days of delivery.\n\n" +
      "1. Sign in and open the order from your Order History.\n\n" +
      "2. Select the item(s) you'd like to return and the reason.\n\n" +
      "3. We'll confirm pickup or drop-off details by email/WhatsApp.\n\n" +
      "4. Once received and inspected, your refund is processed to your original payment method.\n\n" +
      "Items must be unworn, unwashed, and in their original packaging with tags attached. Final sale items are not eligible for return.",
    shippingPolicy:
      "Orders are processed within 1 business day. You'll receive a shipping confirmation with tracking details as soon as your " +
      "order leaves our warehouse. Delivery times may vary for remote areas.",
    termsAndConditions:
      "By using the MIZOON ZARF website, you agree to these terms. Prices are shown in INR and are inclusive/exclusive of GST as noted at checkout.\n\n" +
      "We reserve the right to cancel orders in cases of pricing errors, suspected fraud, or stock unavailability — you'll be notified and refunded in full.\n\n" +
      "All content on this site, including product images, text, and branding, is the property of MIZOON ZARF and may not be reproduced without permission.",
    privacyPolicy:
      "MIZOON ZARF collects the information you provide when creating an account, placing an order, or contacting us — including your " +
      "name, email, phone number, and delivery address — solely to process orders, provide customer support, and improve your shopping experience.\n\n" +
      "We never sell your personal information. Payment details are processed by our payment partners and are never stored on our servers.\n\n" +
      "You can request access to, correction of, or deletion of your personal data at any time by contacting info@mizoonzarf.in.",
    aboutStory:
      "MIZOON ZARF was built on a simple idea: premium fashion, fragrance and fine accessories should be effortless to discover and a " +
      "pleasure to shop. From everyday essentials to statement pieces for life's biggest moments, every collection is curated with care.\n\n" +
      "We work with trusted partners across the region to bring you an ever-evolving edit for men, women and children — backed by fast " +
      "delivery and a team that's always happy to help.",
    careersInfo: "We're always looking for passionate people to join our team. Send your resume and tell us what excites you about fashion retail.",
  },
  promoStrips: {
    codeBanner: {
      enabled: true,
      headline: "Extra 15% Off",
      codeText: "Use Code : WEB15",
      link: "/sale",
      bgColor: "#3a3a3a",
      accentColor: "#e3d94a",
      imageUrl: null,
    },
    brandsBanner: {
      enabled: true,
      tagline: "Your favourite brands, now at your fingertips",
      link: "/brands",
      gradientFrom: "#e8967d",
      gradientVia: "#9a4160",
      gradientTo: "#3c1626",
      imageUrl: null,
      features: [
        { icon: "bag", lines: ["100s of brands.", "100% genuine."] },
        { icon: "truck", lines: ["Price assurance", "and on-time delivery"] },
        { icon: "gift", lines: ["Welcome gift:", "15% off with APP15", "+ ₹15 wallet credit"] },
      ],
    },
  },
  socialLinks: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
    x: "https://x.com",
  },
  shipping: {
    standardFee: 99,
    expressFee: 249,
    freeShippingThreshold: 1999,
    standardDays: "3-5 business days",
    expressDays: "1-2 business days",
    processingDays: 1,
  },
  footer: {
    about: "MIZOON ZARF curates premium fashion, fragrance and jewellery for men, women and children across India.",
    contactAddress: "[PLACEHOLDER — add your registered business address]",
  },
  header: {
    promoMessages: ["New season arrivals are here", "Cash on Delivery available across India"],
    showFreeShipping: true,
    supportPhone: "+91 00000 00000",
    countryLabel: "India",
    countryCode: "IN",
  },
  branding: {
    logoUrl: "/images/logo.png",
    mobileLogoUrl: null,
    faviconUrl: "",
  },
  currencyDisplay: {
    enabled: true,
    options: [
      { code: "USD", symbol: "$", rate: 0.012, country: "US", countryLabel: "United States" },
      { code: "EUR", symbol: "€", rate: 0.011, country: "EU", countryLabel: "Eurozone" },
      { code: "GBP", symbol: "£", rate: 0.0095, country: "GB", countryLabel: "United Kingdom" },
      { code: "AED", symbol: "AED", rate: 0.044, country: "AE", countryLabel: "United Arab Emirates" },
    ],
  },
  email: {
    senderName: "MIZOON ZARF",
    fromEmailOverride: "",
    replyToEmail: "",
    footerNote: "",
  },
  codRisk: {
    maxCodOrderValue: 15000,
    maxCodOrdersPerCustomer: 10,
    highValueCodThreshold: 3000,
    allowHighRiskCod: true,
    requireConfirmOnHighRiskCod: true,
  },
  homepageTheme: {
    colors: {
      accent: "#a9803f",
      accentSoft: "#d8c39a",
      surface: "#faf7f2",
      surfaceDim: "#f1ece2",
      ink: "#14130f",
    },
    typography: {
      // Matches the current *rendered* default exactly: globals.css forces
      // `.font-display`/h1/h2 to `--font-sans` (Manrope) at weight 700,
      // overriding `--font-display` (Cormorant) sitewide — "cormorant" would
      // visually change the homepage before any admin edit.
      headingFont: "manrope",
      bodyFont: "manrope",
      headingWeight: "700",
      letterSpacing: "normal",
      lineHeight: "normal",
    },
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
    gst: { ...DEFAULT_SETTINGS.gst, ...(overrides.gst as object) },
    legal: { ...DEFAULT_SETTINGS.legal, ...(overrides.legal as object) },
    promoStrips: {
      codeBanner: { ...DEFAULT_SETTINGS.promoStrips.codeBanner, ...((overrides.promoStrips as { codeBanner?: object })?.codeBanner ?? {}) },
      brandsBanner: { ...DEFAULT_SETTINGS.promoStrips.brandsBanner, ...((overrides.promoStrips as { brandsBanner?: object })?.brandsBanner ?? {}) },
    },
    socialLinks: { ...DEFAULT_SETTINGS.socialLinks, ...(overrides.socialLinks as object) },
    shipping: { ...DEFAULT_SETTINGS.shipping, ...(overrides.shipping as object) },
    footer: { ...DEFAULT_SETTINGS.footer, ...(overrides.footer as object) },
    header: { ...DEFAULT_SETTINGS.header, ...(overrides.header as object) },
    branding: { ...DEFAULT_SETTINGS.branding, ...(overrides.branding as object) },
    currencyDisplay: { ...DEFAULT_SETTINGS.currencyDisplay, ...(overrides.currencyDisplay as object) },
    email: { ...DEFAULT_SETTINGS.email, ...(overrides.email as object) },
    codRisk: { ...DEFAULT_SETTINGS.codRisk, ...(overrides.codRisk as object) },
    homepageTheme: {
      colors: { ...DEFAULT_SETTINGS.homepageTheme.colors, ...((overrides.homepageTheme as { colors?: object })?.colors ?? {}) },
      typography: { ...DEFAULT_SETTINGS.homepageTheme.typography, ...((overrides.homepageTheme as { typography?: object })?.typography ?? {}) },
    },
  } as SiteSettings;
});
