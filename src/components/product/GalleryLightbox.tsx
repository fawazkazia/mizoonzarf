"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Img } from "@/components/ui/ArtImage";
import { Modal } from "@/components/ui/Modal";

interface GalleryImage {
  url: string;
  altText: string | null;
}

export function GalleryLightbox({
  images,
  activeIndex,
  onIndexChange,
  productName,
  open,
  onClose,
}: {
  images: GalleryImage[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  productName: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") onIndexChange((activeIndex + 1) % images.length);
      if (e.key === "ArrowLeft") onIndexChange((activeIndex - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, activeIndex, images.length, onIndexChange]);

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Product images" panelClassName="max-w-5xl bg-ink">
      <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-paper">
        <X size={22} />
      </button>

      <div className="relative flex aspect-[4/5] items-center justify-center sm:aspect-[16/10]">
        <Img src={images[activeIndex]?.url ?? null} alt={images[activeIndex]?.altText ?? productName} className="object-contain" priority />

        {images.length > 1 && (
          <>
            <button
              onClick={() => onIndexChange((activeIndex - 1 + images.length) % images.length)}
              aria-label="Previous image"
              className="absolute left-4 flex h-10 w-10 items-center justify-center text-paper/80 hover:text-paper"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => onIndexChange((activeIndex + 1) % images.length)}
              aria-label="Next image"
              className="absolute right-4 flex h-10 w-10 items-center justify-center text-paper/80 hover:text-paper"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-2 pb-4">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => onIndexChange(i)}
              className={`h-1 w-6 ${i === activeIndex ? "bg-paper" : "bg-paper/30"}`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
