import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { ThemeForm } from "./ThemeForm";

export const metadata = { title: "Homepage Theme" };

export default async function HomepageThemePage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/homepage" className="text-xs uppercase tracking-[0.12em] text-ink-soft hover:text-ink">
          ← Homepage
        </Link>
        <h1 className="mt-2 font-display text-3xl">Homepage Theme</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          One global color and typography set for the homepage&apos;s section headings, eyebrows and accent dividers.
          These changes apply sitewide-consistently across the homepage — not per section — and never affect
          product cards, cart, checkout or other pages.
        </p>
      </div>
      <ThemeForm initial={settings.homepageTheme} />
    </div>
  );
}
