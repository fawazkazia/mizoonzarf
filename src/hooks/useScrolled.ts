"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether the page has scrolled past a 1px sentinel rendered just
 * above the header. IntersectionObserver-based rather than a scroll
 * listener, so it costs nothing per frame and never janks.
 */
export function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return { scrolled, sentinelRef };
}
