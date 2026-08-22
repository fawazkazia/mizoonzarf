"use client";

import { useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { Img } from "@/components/ui/ArtImage";
import { GalleryLightbox } from "@/components/product/GalleryLightbox";
import { cn } from "@/lib/utils";

export function Gallery({ images, productName }: { images: { url: string; altText: string | null }[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const list = images.length > 0 ? images : [{ url: "", altText: productName }];

  function handleMobileScroll() {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  }

  return (
    <div>
      {/* Mobile: native scroll-snap swipe track */}
      <div className="sm:hidden">
        <div ref={trackRef} onScroll={handleMobileScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setLightboxOpen(true)}
              className="aspect-[4/5] w-full shrink-0 snap-center bg-paper-dim"
              aria-label={`Open image ${i + 1} full screen`}
            >
              <Img src={img.url} alt={img.altText ?? productName} seedFallback={`${productName}-${i}`} priority={i === 0} />
            </button>
          ))}
        </div>
        {list.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {list.map((_, i) => (
              <span key={i} className={cn("h-1 w-5", i === active ? "bg-ink" : "bg-line")} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: thumbnail rail + zoomable main image */}
      <div className="hidden gap-3 sm:flex">
        <div className="flex shrink-0 flex-col gap-3">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn("aspect-[4/5] h-24 w-20 overflow-hidden border transition-opacity", active === i ? "border-ink opacity-100" : "border-line opacity-60 hover:opacity-100")}
            >
              <Img src={img.url} alt={img.altText ?? productName} seedFallback={`${productName}-${i}`} />
            </button>
          ))}
        </div>

        <div
          className="relative flex-1 overflow-hidden bg-paper-dim [@media(hover:hover)]:cursor-zoom-in"
          onMouseMove={(e) => {
            if (!window.matchMedia("(hover: hover)").matches) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          <div className="aspect-[4/5]">
            <Img
              src={list[active].url}
              alt={list[active].altText ?? productName}
              seedFallback={`${productName}-${active}`}
              priority
              className={cn("transition-transform duration-200", zoom && "scale-[1.8]")}
              style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          </div>
          <button
            onClick={() => setLightboxOpen(true)}
            aria-label="View full screen"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center bg-paper/90 hover:bg-paper"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      <GalleryLightbox images={list} activeIndex={active} onIndexChange={setActive} productName={productName} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </div>
  );
}
