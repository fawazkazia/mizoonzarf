"use client";

import Link from "next/link";
import { useSettings } from "@/components/SettingsContext";
import { Img } from "@/components/ui/ArtImage";

/** Full-bleed promo strip below the header, linking to the sale/promotional listing. Fully admin-editable via Settings > Promo Banners. */
export function PromoCodeBanner() {
  const settings = useSettings();
  const { codeBanner } = settings.promoStrips;

  if (!codeBanner.enabled) return null;

  return (
    <Link
      href={codeBanner.link}
      className="group relative block w-full overflow-hidden py-5 transition-opacity duration-[var(--dur-2)] hover:opacity-95 sm:py-6"
      style={codeBanner.imageUrl ? undefined : { backgroundColor: codeBanner.bgColor }}
    >
      {codeBanner.imageUrl ? (
        <>
          <div className="absolute inset-0">
            <Img src={codeBanner.imageUrl} alt="" />
          </div>
          <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
        </>
      ) : (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 2px, transparent 2px, transparent 9px), " +
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px), " +
              "linear-gradient(100deg, rgba(0,0,0,0.25) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.25) 100%)",
          }}
          aria-hidden="true"
        />
      )}
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col items-center justify-center gap-2 px-4 text-center sm:flex-row sm:justify-between sm:gap-6 sm:px-6 sm:text-left lg:px-10">
        <span
          className="text-2xl uppercase tracking-tight text-paper sm:text-3xl lg:text-[2.5rem]"
          style={{ fontFamily: "var(--font-promo)", fontWeight: 800 }}
        >
          {codeBanner.headline}
        </span>
        <span
          className="text-sm uppercase tracking-[0.02em] transition-transform duration-[var(--dur-2)] group-hover:translate-x-0.5 sm:text-xl lg:text-2xl"
          style={{ color: codeBanner.accentColor, fontFamily: "var(--font-promo)", fontWeight: 800 }}
        >
          {codeBanner.codeText}
        </span>
      </div>
    </Link>
  );
}
