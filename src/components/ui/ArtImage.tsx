import { artUrl } from "@/lib/art-url";
import { cn } from "@/lib/utils";

interface ImgProps {
  src?: string | null;
  alt: string;
  seedFallback?: string;
  className?: string;
  priority?: boolean;
  style?: React.CSSProperties;
}

/**
 * Renders a product/category/banner image. `src` is expected to already be a
 * full URL (our generated placeholder art today, a real storage URL once
 * Phase 2's media uploads land). Plain <img> on purpose — same-origin SVG art
 * needs no image-optimizer pass, and this stays a drop-in swap either way.
 */
export function Img({ src, alt, seedFallback, className, priority, style }: ImgProps) {
  const finalSrc = src || artUrl({ seed: seedFallback ?? alt, kind: "square", label: alt });
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={finalSrc}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      style={style}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
