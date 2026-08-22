import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: { default: `${settings.brandName} — ${settings.brandTagline}`, template: `%s | ${settings.brandName}` },
    description: settings.footer.about,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`}>
      <body>
        <SettingsProvider value={settings}>
          <AppProviders>{children}</AppProviders>
        </SettingsProvider>
      </body>
    </html>
  );
}
