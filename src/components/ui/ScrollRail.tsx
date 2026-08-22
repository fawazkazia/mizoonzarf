"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/IconButton";

interface ScrollRailProps {
  children: React.ReactNode;
  className?: string;
  trackClassName?: string;
  showArrows?: boolean;
}

/** Native scroll-snap horizontal rail with edge-aware arrow buttons — shared
 * by product rails, the sub-category strip, gallery thumbnails, and
 * Complete the Look. No carousel dependency: CSS scroll-snap plus
 * `scrollBy` covers everything this app needs. */
export function ScrollRail({ children, className, trackClassName, showArrows = true }: ScrollRailProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  function scrollByAmount(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className={cn("relative", className)}>
      <div ref={trackRef} className={cn("no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth", trackClassName)}>
        {children}
      </div>
      {showArrows && (
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between lg:flex">
          <IconButton
            label="Scroll back"
            onClick={() => scrollByAmount(-1)}
            disabled={atStart}
            className="pointer-events-auto -translate-x-1/2 border border-line bg-paper-raise shadow-[var(--shadow-lift)] disabled:opacity-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Scroll forward"
            onClick={() => scrollByAmount(1)}
            disabled={atEnd}
            className="pointer-events-auto translate-x-1/2 border border-line bg-paper-raise shadow-[var(--shadow-lift)] disabled:opacity-0"
          >
            <ChevronRight className="h-4 w-4" />
          </IconButton>
        </div>
      )}
    </div>
  );
}
