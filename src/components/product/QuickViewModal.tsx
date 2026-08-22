"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Img } from "@/components/ui/ArtImage";
import { Modal } from "@/components/ui/Modal";
import { Rating } from "@/components/ui/Rating";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { useQuickViewStore } from "@/stores/quick-view-store";

interface QuickViewVariant {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
}

interface QuickViewData {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  rating: number;
  reviewCount: number;
  images: { url: string; altText: string | null }[];
  variants: QuickViewVariant[];
}

const quickViewCache = new Map<string, QuickViewData>();

/** Single mounted instance (see AppProviders) driven by quick-view-store —
 * product cards dispatch a slug rather than each owning their own modal. */
export function QuickViewModal() {
  const slug = useQuickViewStore((s) => s.slug);
  const close = useQuickViewStore((s) => s.close);
  const [fetched, setFetched] = useState<QuickViewData | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const data = (slug ? quickViewCache.get(slug) : undefined) ?? fetched;

  useEffect(() => {
    if (!slug || quickViewCache.has(slug)) return;
    let cancelled = false;

    // Deferred a microtask so the reset isn't a synchronous setState at the
    // top of the effect body; still resolves before paint.
    Promise.resolve().then(() => {
      if (cancelled) return;
      setFetched(null);
      setStatus("loading");
    });

    fetch(`/api/products/${slug}/quick-view`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((json: QuickViewData) => {
        if (cancelled) return;
        quickViewCache.set(slug, json);
        setFetched(json);
        setStatus("idle");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <Modal open={Boolean(slug)} onClose={close} ariaLabel="Quick view" panelClassName="max-w-4xl">
      <button
        onClick={close}
        aria-label="Close quick view"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center bg-paper-raise"
      >
        <X size={18} />
      </button>

      {!data && status === "loading" && (
        <div className="flex h-96 items-center justify-center text-sm text-ink-soft">Loading...</div>
      )}

      {!data && status === "error" && (
        <div className="flex h-96 flex-col items-center justify-center gap-3 text-sm text-ink-soft">
          <p>Couldn&apos;t load this product.</p>
          <button onClick={close} className="underline">
            Close
          </button>
        </div>
      )}

      {data && (
        <div className="grid gap-8 p-6 lg:grid-cols-2 lg:p-10">
          <div className="flex flex-col gap-3">
            <div className="aspect-[3/4] overflow-hidden bg-paper-dim">
              <Img src={data.images[0]?.url ?? null} alt={data.name} seedFallback={data.id} />
            </div>
            {data.images.length > 1 && (
              <div className="flex gap-2">
                {data.images.slice(1, 5).map((img, i) => (
                  <div key={img.url + i} className="aspect-[3/4] w-16 overflow-hidden bg-paper-dim">
                    <Img src={img.url} alt="" seedFallback={`${data.id}-${i}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {data.brand && <p className="text-xs uppercase tracking-[0.12em] text-ink-soft">{data.brand}</p>}
            <h2 className="font-display text-2xl">{data.name}</h2>
            {data.reviewCount > 0 && <Rating value={data.rating} count={data.reviewCount} size={13} />}
            <PurchasePanel
              productId={data.id}
              productName={data.name}
              productSlug={data.slug}
              variants={data.variants}
              compact
            />
            <Link href={`/product/${data.slug}`} onClick={close} className="link-reveal self-start text-xs uppercase tracking-[0.12em]">
              View Full Details →
            </Link>
          </div>
        </div>
      )}
    </Modal>
  );
}
