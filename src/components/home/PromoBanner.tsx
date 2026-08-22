import Link from "next/link";
import { Img } from "@/components/ui/ArtImage";

export function PromoBanner({
  title,
  subtitle,
  imageUrl,
  mobileImageUrl,
  ctaText,
  ctaLink,
}: {
  title: string;
  subtitle: string | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  ctaText: string | null;
  ctaLink: string | null;
}) {
  return (
    <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-ink">
      <Img src={mobileImageUrl || imageUrl} alt={title} className="lg:hidden" />
      <Img src={imageUrl} alt={title} className="hidden lg:block" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-ink/10 lg:via-transparent" />

      <div className="absolute inset-x-6 bottom-6 bg-paper p-8 text-center sm:inset-x-auto sm:bottom-12 sm:left-12 sm:max-w-md sm:text-left">
        {subtitle && <p className="text-xs uppercase tracking-[0.22em] text-gold-deep">{subtitle}</p>}
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">{title}</h2>
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
