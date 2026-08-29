import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Img } from "@/components/ui/ArtImage";
import { objectPositionClass, type ObjectPositionValue } from "@/lib/object-position";
import { cn } from "@/lib/utils";

/** Slim full-bleed advertisement strip — a continuously slow-panning background
 * image behind a shimmering eyebrow badge, sized well below Hero/PromoBanner
 * height so it reads as a compact ad slot rather than a full section. */
export function AdBanner({
  eyebrow = "Limited Time",
  heading = "Elevate Your Wardrobe",
  subheading = "Up to 40% off selected styles",
  ctaText = "Shop the Offer",
  ctaLink = "/women",
  imageUrl,
  objectPosition,
}: {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string | null;
  objectPosition?: ObjectPositionValue | null;
}) {
  return (
    <section className="relative isolate h-32 overflow-hidden bg-ink sm:h-36 lg:h-40">
      <Img
        src={imageUrl}
        alt=""
        seedFallback="ad-banner"
        className={cn("absolute inset-0 animate-ad-pan motion-reduce:animate-none", objectPositionClass(objectPosition))}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-ink/15" aria-hidden="true" />

      <Link href={ctaLink} className="group relative flex h-full items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-1 text-paper">
          {eyebrow && (
            <span
              className="w-fit animate-shimmer bg-clip-text text-[11px] font-semibold uppercase tracking-[0.2em] text-transparent motion-reduce:animate-none motion-reduce:text-gold motion-reduce:bg-clip-border"
              style={{
                backgroundImage: "linear-gradient(110deg, var(--color-gold) 40%, #fff 50%, var(--color-gold) 60%)",
                backgroundSize: "200% 100%",
              }}
            >
              {eyebrow}
            </span>
          )}
          <span className="font-display text-lg sm:text-2xl lg:text-3xl">{heading}</span>
          {subheading && <span className="hidden text-xs text-paper/70 sm:block sm:text-sm">{subheading}</span>}
        </div>

        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border border-paper/40 px-4 py-2 text-xs uppercase tracking-[0.12em] text-paper transition-colors duration-[var(--dur-2)] group-hover:bg-paper group-hover:text-ink">
          {ctaText}
          <ArrowRight size={14} className="transition-transform duration-[var(--dur-2)] group-hover:translate-x-0.5" />
        </span>
      </Link>
    </section>
  );
}
