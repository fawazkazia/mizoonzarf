"use client";

import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

/** Scroll-triggered fade-up wrapper. Defaults to visible before JS runs
 * (see .fade-in-section in globals.css), so a failed script or a crawler
 * never leaves content invisible. */
export function FadeIn({ children, className, delayMs }: FadeInProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-observe
      className={cn("fade-in-section", inView && "is-visible", className)}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
