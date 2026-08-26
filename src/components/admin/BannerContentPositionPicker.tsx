"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Img } from "@/components/ui/ArtImage";

export interface ContentPosition {
  x: number;
  y: number;
}

/** Click-or-drag picker for where the title/subtitle/button block sits over
 * a banner's desktop image. Percentage-based (0-100) so it survives any
 * actual image size; `null` means "use the component's built-in layout". */
export function BannerContentPositionPicker({
  value,
  onChange,
  imageUrl,
  aspectRatio,
}: {
  value: ContentPosition | null;
  onChange: (pos: ContentPosition | null) => void;
  imageUrl: string | null;
  aspectRatio: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
      onChange({ x: Math.round(x), y: Math.round(y) });
    },
    [onChange]
  );

  useEffect(() => {
    if (!dragging) return;
    function move(e: PointerEvent) {
      updateFromPoint(e.clientX, e.clientY);
    }
    function up() {
      setDragging(false);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, updateFromPoint]);

  return (
    <div>
      <div
        ref={containerRef}
        onPointerDown={(e) => {
          setDragging(true);
          updateFromPoint(e.clientX, e.clientY);
        }}
        className="relative w-full cursor-crosshair touch-none select-none overflow-hidden border border-line bg-paper-dim"
        style={{ aspectRatio }}
      >
        {imageUrl ? (
          <Img src={imageUrl} alt="" className="pointer-events-none" />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-ink-soft">
            Upload a desktop image above to preview here.
          </div>
        )}
        {value && (
          <div
            className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gold bg-ink/70 text-gold shadow-lg"
            style={{ left: `${value.x}%`, top: `${value.y}%` }}
          >
            <MapPin size={16} />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-soft">
          {value ? `Position: ${value.x}%, ${value.y}% — click or drag to adjust.` : "Default position. Click or drag anywhere on the preview to place the title, subtitle and button there."}
        </p>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="shrink-0 text-xs text-ink-soft underline">
            Use default
          </button>
        )}
      </div>
    </div>
  );
}
