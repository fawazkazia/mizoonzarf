"use client";

import Link from "next/link";
import { ShoppingBag, Truck, Gift } from "lucide-react";
import { useSettings } from "@/components/SettingsContext";
import { Img } from "@/components/ui/ArtImage";

const ICONS = { bag: ShoppingBag, truck: Truck, gift: Gift };

/** Full-bleed promo strip below the header, linking to the all-brands listing. Fully admin-editable via Settings > Promo Banners. */
export function FavouriteBrandsStrip() {
  const settings = useSettings();
  const { brandsBanner } = settings.promoStrips;

  if (!brandsBanner.enabled) return null;

  return (
    <Link
      href={brandsBanner.link}
      className="group relative block w-full overflow-hidden py-5 transition-opacity duration-[var(--dur-2)] hover:opacity-95 sm:py-6"
      style={
        brandsBanner.imageUrl
          ? undefined
          : { backgroundImage: `linear-gradient(to right, ${brandsBanner.gradientFrom}, ${brandsBanner.gradientVia}, ${brandsBanner.gradientTo})` }
      }
    >
      {brandsBanner.imageUrl && (
        <>
          <div className="absolute inset-0">
            <Img src={brandsBanner.imageUrl} alt="" />
          </div>
          <div
            className="absolute inset-0 opacity-80"
            style={{ backgroundImage: `linear-gradient(to right, ${brandsBanner.gradientFrom}, ${brandsBanner.gradientVia}, ${brandsBanner.gradientTo})` }}
            aria-hidden="true"
          />
        </>
      )}
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col items-center gap-5 px-4 text-paper sm:flex-row sm:justify-between sm:gap-6 sm:px-6 lg:px-10">
        <p className="text-center font-display text-lg sm:text-left sm:text-xl lg:text-2xl">{brandsBanner.tagline}</p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:flex-nowrap sm:justify-end sm:gap-8">
          {brandsBanner.features.map((f, i) => {
            const Icon = ICONS[f.icon] ?? ShoppingBag;
            return (
              <div key={i} className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper/15 transition-colors duration-[var(--dur-2)] group-hover:bg-paper/20 sm:h-11 sm:w-11">
                  <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="text-xs leading-snug sm:text-sm">
                  {f.lines.map((line, j) => (
                    <span key={j} className={j === 0 ? "block text-paper/90" : "block font-semibold"}>
                      {line}
                    </span>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
}
