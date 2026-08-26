import Link from "next/link";
import { Img } from "@/components/ui/ArtImage";
import { cn } from "@/lib/utils";
import type { BannerTextSize } from "./Hero";

const TITLE_SIZE_CLASS: Record<BannerTextSize, string> = {
  SMALL: "text-2xl sm:text-3xl",
  MEDIUM: "text-3xl sm:text-4xl",
  LARGE: "text-4xl sm:text-5xl",
};

const SUBTITLE_SIZE_CLASS: Record<BannerTextSize, string> = {
  SMALL: "text-[10px]",
  MEDIUM: "text-xs",
  LARGE: "text-sm",
};

export function PromoBanner({
  title,
  subtitle,
  titleColor,
  subtitleColor,
  titleSize,
  contentPositionX,
  contentPositionY,
  imageUrl,
  mobileImageUrl,
  ctaText,
  ctaLink,
}: {
  title: string;
  subtitle: string | null;
  titleColor?: string | null;
  subtitleColor?: string | null;
  titleSize?: BannerTextSize;
  /** Percentage (0-100) placement of the title/subtitle/button card, set via
   * the admin drag-to-position picker. Desktop (sm+) only. */
  contentPositionX?: number | null;
  contentPositionY?: number | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  ctaText: string | null;
  ctaLink: string | null;
}) {
  const customPos = contentPositionX != null && contentPositionY != null;
  return (
    <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-ink">
      <Img src={mobileImageUrl || imageUrl} alt={title} className="lg:hidden" />
      <Img src={imageUrl} alt={title} className="hidden lg:block" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-ink/10 lg:via-transparent" />

      <div
        className={cn(
          "absolute inset-x-6 bottom-6 bg-paper p-8 text-center",
          customPos
            ? "sm:inset-auto sm:left-[var(--cx)] sm:top-[var(--cy)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:text-center"
            : "sm:inset-x-auto sm:bottom-12 sm:left-12 sm:max-w-md sm:text-left"
        )}
        style={customPos ? ({ "--cx": `${contentPositionX}%`, "--cy": `${contentPositionY}%` } as React.CSSProperties) : undefined}
      >
        {subtitle && (
          <p
            className={cn("uppercase tracking-[0.22em]", SUBTITLE_SIZE_CLASS[titleSize ?? "MEDIUM"], !subtitleColor && "text-gold-deep")}
            style={subtitleColor ? { color: subtitleColor } : undefined}
          >
            {subtitle}
          </p>
        )}
        <h2 className={cn("mt-2 font-display", TITLE_SIZE_CLASS[titleSize ?? "MEDIUM"])} style={titleColor ? { color: titleColor } : undefined}>
          {title}
        </h2>
        {ctaLink && (
          <Link
            href={ctaLink}
            className="mt-6 inline-flex items-center gap-2 bg-ink px-7 py-3 text-xs uppercase tracking-[0.14em] text-paper transition-colors duration-[var(--dur-1)] hover:bg-gold"
          >
            {ctaText ?? "Shop Now"}
          </Link>
        )}
      </div>
    </section>
  );
}
