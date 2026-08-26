"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Img } from "@/components/ui/ArtImage";
import { useHeroVisibilityStore } from "@/stores/hero-visibility-store";
import { cn } from "@/lib/utils";

export type BannerTextSize = "SMALL" | "MEDIUM" | "LARGE";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  titleColor?: string | null;
  subtitleColor?: string | null;
  titleSize?: BannerTextSize;
  /** Percentage (0-100) placement of the title/subtitle/button block, set via
   * the admin drag-to-position picker. Desktop (lg+) only — mobile always
   * keeps the fixed bottom-stacked layout below. */
  contentPositionX?: number | null;
  contentPositionY?: number | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  ctaText: string | null;
  ctaLink: string | null;
}

const TITLE_SIZE_CLASS: Record<BannerTextSize, string> = {
  SMALL: "text-2xl sm:text-3xl lg:text-4xl",
  MEDIUM: "text-3xl sm:text-4xl lg:text-5xl",
  LARGE: "text-4xl sm:text-5xl lg:text-6xl",
};

const SUBTITLE_SIZE_CLASS: Record<BannerTextSize, string> = {
  SMALL: "text-[10px]",
  MEDIUM: "text-xs",
  LARGE: "text-sm",
};

const DWELL_MS = 3000;

function isVideoUrl(url: string) {
  return /\.(mp4|webm)$/i.test(url);
}

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const setHeroInView = useHeroVisibilityStore((s) => s.setHeroInView);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    // Fires when the Hero's lower ~25% is on screen — the band where its
    // bottom-anchored slide text overlaps the fixed floating buttons.
    const observer = new IntersectionObserver(([entry]) => setHeroInView(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(el);
    return () => {
      observer.disconnect();
      setHeroInView(false);
    };
  }, [setHeroInView]);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), DWELL_MS);
    return () => clearInterval(timer);
    // `index` is intentionally a dependency: a manual nav (click/swipe) resets
    // the interval instead of letting a stale timer fire right after.
  }, [slides.length, paused, index]);

  if (slides.length === 0) return null;

  function goTo(next: number) {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) goTo(index + (delta < 0 ? 1 : -1));
    touchStartX.current = null;
  }

  return (
    <section
      ref={sectionRef}
      className="relative h-[58svh] max-h-[620px] min-h-[420px] w-full overflow-hidden bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((s, i) => {
        const customPos = s.contentPositionX != null && s.contentPositionY != null;
        return (
        <div
          key={s.id}
          className={cn("absolute inset-0 transition-opacity duration-700", i === index ? "opacity-100" : "pointer-events-none opacity-0")}
          aria-hidden={i !== index}
        >
          {isVideoUrl(s.imageUrl) ? (
            <video autoPlay muted loop playsInline poster={s.mobileImageUrl ?? undefined} className="h-full w-full object-cover">
              <source src={s.imageUrl} />
            </video>
          ) : (
            // Keyed on active/idle (not the raw slide index) so the key changes
            // — and the Ken Burns zoom restarts — every time this slide comes
            // back around, even though the index it's active at repeats each loop.
            <>
              <Img
                key={i === index ? "mobile-active" : "mobile-idle"}
                src={s.mobileImageUrl || s.imageUrl}
                alt={s.title}
                priority={i === 0}
                className={cn("lg:hidden", i === index && "animate-hero-zoom")}
              />
              <Img
                key={i === index ? "desktop-active" : "desktop-idle"}
                src={s.imageUrl}
                alt={s.title}
                priority={i === 0}
                className={cn("hidden lg:block", i === index && "animate-hero-zoom")}
              />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent lg:bg-gradient-to-r lg:from-ink/70 lg:via-ink/25 lg:to-transparent" />

          <div
            className={cn(
              "absolute inset-x-0 bottom-10 flex flex-col items-center px-6 text-center text-paper sm:bottom-14",
              customPos
                ? "lg:inset-auto lg:left-[var(--cx)] lg:top-[var(--cy)] lg:max-w-xl lg:-translate-x-1/2 lg:-translate-y-1/2 lg:items-center lg:px-10 lg:text-center"
                : "lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:max-w-xl lg:items-start lg:justify-end lg:px-16 lg:pb-14 lg:text-left"
            )}
            style={customPos ? ({ "--cx": `${s.contentPositionX}%`, "--cy": `${s.contentPositionY}%` } as React.CSSProperties) : undefined}
          >
            {s.subtitle && (
              <p
                className={cn("animate-fade-up uppercase tracking-[0.3em]", SUBTITLE_SIZE_CLASS[s.titleSize ?? "MEDIUM"], !s.subtitleColor && "text-gold-soft")}
                style={s.subtitleColor ? { color: s.subtitleColor } : undefined}
              >
                {s.subtitle}
              </p>
            )}
            <h1
              className={cn("animate-fade-up mt-3 max-w-3xl font-display leading-[1.05]", TITLE_SIZE_CLASS[s.titleSize ?? "MEDIUM"])}
              style={s.titleColor ? { color: s.titleColor } : undefined}
            >
              {s.title}
            </h1>
            {s.ctaLink && (
              <Link
                href={s.ctaLink}
                className="animate-fade-up mt-6 inline-flex items-center gap-2 bg-paper px-8 py-3.5 text-xs uppercase tracking-[0.14em] text-ink transition-colors duration-[var(--dur-1)] hover:bg-gold hover:text-paper"
              >
                {s.ctaText ?? "Shop Now"}
              </Link>
            )}
          </div>
        </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo(index - 1)}
            className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-paper/40 text-paper/80 transition-colors duration-[var(--dur-1)] hover:bg-paper hover:text-ink sm:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center border border-paper/40 text-paper/80 transition-colors duration-[var(--dur-1)] hover:bg-paper hover:text-ink sm:flex"
            aria-label="Next slide"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>

          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 text-paper">
            <span className="font-display text-xs tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            <div className="flex gap-1.5">
              {slides.map((s, i) => (
                <button key={s.id} onClick={() => goTo(i)} aria-label={`Go to slide ${i + 1}`} className="relative h-0.5 w-10 overflow-hidden bg-paper/25">
                  {i === index && (
                    <span
                      key={`${index}-${paused}`}
                      className={cn("absolute inset-y-0 left-0 bg-paper", paused ? "w-full" : "w-0 animate-hero-progress")}
                    />
                  )}
                </button>
              ))}
            </div>
            <span className="font-display text-xs tabular-nums">{String(slides.length).padStart(2, "0")}</span>
          </div>
        </>
      )}
    </section>
  );
}
