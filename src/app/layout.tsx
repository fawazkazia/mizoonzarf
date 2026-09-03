import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Poppins, Playfair_Display, Libre_Baskerville, DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { SettingsProvider } from "@/components/SettingsContext";
import { AppProviders } from "@/components/AppProviders";

// Every page reads live settings/cart/session data — the storefront is
// inherently dynamic (fresh pricing and stock, not a stale build-time cache).
export const dynamic = "force-dynamic";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Bold, rounded geometric sans used only for the "Extra % Off" promo banner —
// Manrope's own bold weight reads too narrow/technical for that banner's
// chunky poster-style headline.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-promo",
  display: "swap",
});

// Curated extra options for Admin > Homepage > Theme's font pickers (see
// src/lib/homepage-theme.ts). All preloaded regardless of which is active —
// selecting one only swaps a CSS variable, no dynamic font loading.
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-libre-baskerville", display: "swap" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-dm-serif", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: { default: `${settings.brandName} — ${settings.brandTagline}`, template: `%s | ${settings.brandName}` },
    description: settings.footer.about,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    // Falls back to the static /public/favicon.ico when no admin-uploaded favicon is set —
    // must live under public/, not app/, since a literal app/favicon.ico always wins over
    // this field (see src/app/admin/settings/SettingsForm.tsx for the upload UI).
    icons: { icon: settings.branding.faviconUrl || "/favicon.ico" },
    // Some mobile browsers auto-link phone-number-looking text into a `tel:`
    // anchor after the initial paint — since that happens after React's
    // server-rendered HTML is already sent, it disagrees with what hydration
    // expects and throws a mismatch. Disabling auto-detection here (we link
    // phone numbers ourselves where it matters, e.g. UtilityBar) keeps
    // server and client markup identical.
    formatDetection: { telephone: false },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${manrope.variable} ${poppins.variable} ${playfair.variable} ${libreBaskerville.variable} ${dmSerif.variable} ${inter.variable}`}
    >
      <body>
        <SettingsProvider value={settings}>
          <AppProviders>{children}</AppProviders>
        </SettingsProvider>
      </body>
    </html>
  );
}
