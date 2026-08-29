"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, X, GripVertical, AlertTriangle } from "lucide-react";
import { Img } from "@/components/ui/ArtImage";
import { cn } from "@/lib/utils";

interface UploadResponse {
  url: string;
  width?: number;
  height?: number;
}

async function uploadFile(file: globalThis.File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed.");
  return data as UploadResponse;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** True when the uploaded aspect ratio differs from the expected one by more than ~10%. */
function isRatioMismatch(w: number, h: number, expected: { width: number; height: number }): boolean {
  const actual = w / h;
  const target = expected.width / expected.height;
  return Math.abs(actual - target) / target > 0.1;
}

export function ImageUploader({
  images,
  onChange,
  max = 8,
  expectedDimensions,
}: {
  images: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  /** When set, shows the uploaded dimensions under each thumbnail and warns if the aspect ratio is off by more than ~10%. */
  expectedDimensions?: { width: number; height: number };
}) {
  const [uploading, setUploading] = useState(false);
  const [dimensionsByUrl, setDimensionsByUrl] = useState<Record<string, { width: number; height: number }>>({});
  const dragIndex = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      const newDimensions: Record<string, { width: number; height: number }> = {};
      for (const file of Array.from(files).slice(0, max - images.length)) {
        const result = await uploadFile(file);
        uploaded.push(result.url);
        if (result.width && result.height) newDimensions[result.url] = { width: result.width, height: result.height };
      }
      onChange([...images, ...uploaded]);
      setDimensionsByUrl((prev) => ({ ...prev, ...newDimensions }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function reorder(from: number, to: number) {
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => {
          const dims = dimensionsByUrl[url];
          const mismatch = dims && expectedDimensions && isRatioMismatch(dims.width, dims.height, expectedDimensions);
          return (
            <div key={url + i} className="flex w-24 flex-col gap-1">
              <div
                draggable={max > 1}
                onDragStart={max > 1 ? () => (dragIndex.current = i) : undefined}
                onDragOver={max > 1 ? (e) => e.preventDefault() : undefined}
                onDrop={
                  max > 1
                    ? () => {
                        if (dragIndex.current !== null && dragIndex.current !== i) reorder(dragIndex.current, i);
                        dragIndex.current = null;
                      }
                    : undefined
                }
                className={cn("group relative h-24 w-24 overflow-hidden border border-line bg-paper-dim", max > 1 && "cursor-move")}
              >
                <Img src={url} alt="" />
                {max > 1 && (
                  <span className="absolute left-1 top-1 rounded bg-ink/60 p-0.5 text-paper opacity-0 group-hover:opacity-100">
                    <GripVertical size={12} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/80 text-paper opacity-0 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
                {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-ink/70 py-0.5 text-center text-[9px] uppercase text-paper">Primary</span>}
              </div>
              {dims && (
                <p className="text-[10px] text-ink-soft">
                  {dims.width}×{dims.height}
                  {mismatch && (
                    <span className="mt-0.5 flex items-center gap-0.5 text-sale">
                      <AlertTriangle size={10} /> expected ~{expectedDimensions!.width}×{expectedDimensions!.height}
                    </span>
                  )}
                </p>
              )}
            </div>
          );
        })}

        {images.length < max && (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line text-ink-soft hover:border-ink">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span className="text-[10px] uppercase">Upload</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple={max > 1}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        JPG, PNG, WEBP, GIF or SVG — up to 8MB.{max > 1 && " Drag to reorder; the first image is primary."}
      </p>
    </div>
  );
}

/** Single-image convenience wrapper for category/banner forms. */
export function SingleImageUploader({
  value,
  onChange,
  expectedDimensions,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  expectedDimensions?: { width: number; height: number };
}) {
  return (
    <ImageUploader
      images={value ? [value] : []}
      onChange={(urls) => onChange(urls[0] ?? null)}
      max={1}
      expectedDimensions={expectedDimensions}
    />
  );
}
