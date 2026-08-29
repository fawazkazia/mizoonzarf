"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Share2, MessageCircle, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useSettings } from "@/components/SettingsContext";
import { SizeGuideModal } from "@/components/product/SizeGuideModal";
import { SIZE_GUIDES } from "@/lib/size-guides";
import type { VariantAttr } from "@/lib/inventory/variant-attributes";

export interface VariantOption {
  id: string;
  attributes: VariantAttr[];
  price: number;
  salePrice: number | null;
  stock: number;
}

export function PurchasePanel({
  productId,
  productName,
  productSlug,
  variants,
  compact = false,
  sizeGuideType,
  /** Display order for attribute axes, e.g. from ProductVariantAttribute.position. Falls back to
   * first-seen order across variants if omitted. */
  axisOrder,
}: {
  productId: string;
  productName: string;
  productSlug: string;
  variants: VariantOption[];
  /** Hides Buy Now and the WhatsApp-enquire row — used inside Quick View,
   * where a full purchase flow is out of place. */
  compact?: boolean;
  sizeGuideType?: string | null;
  axisOrder?: string[];
}) {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const sizeGuide = sizeGuideType ? SIZE_GUIDES[sizeGuideType] : null;

  const axisNames = useMemo(() => {
    if (axisOrder && axisOrder.length > 0) return axisOrder;
    const seen: string[] = [];
    variants.forEach((v) => v.attributes.forEach((a) => { if (!seen.includes(a.name)) seen.push(a.name); }));
    return seen;
  }, [variants, axisOrder]);

  const axisValues = useMemo(() => {
    const map = new Map<string, { value: string; hex?: string }[]>();
    axisNames.forEach((name) => {
      const seen = new Map<string, string | undefined>();
      variants.forEach((v) => {
        const attr = v.attributes.find((a) => a.name === name);
        if (attr && !seen.has(attr.value)) seen.set(attr.value, attr.hex);
      });
      map.set(name, [...seen.entries()].map(([value, hex]) => ({ value, hex })));
    });
    return map;
  }, [variants, axisNames]);

  // Seed selection from the first variant's own combination (not each axis's first value
  // independently) so the initial state is always a real, purchasable combo — even when
  // availability is asymmetric across axes (e.g. size S only comes in Black/White).
  const [selected, setSelected] = useState<Record<string, string | null>>(() => {
    const first = variants[0];
    const init: Record<string, string | null> = {};
    axisNames.forEach((n) => {
      init[n] = first?.attributes.find((a) => a.name === n)?.value ?? null;
    });
    return init;
  });
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const settings = useSettings();
  const addItem = useCartStore((s) => s.addItem);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(productId));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  function matches(v: VariantOption, sel: Record<string, string | null>) {
    return axisNames.every((n) => !sel[n] || v.attributes.find((a) => a.name === n)?.value === sel[n]);
  }

  function isValueAvailable(axisName: string, value: string) {
    return variants.some((v) => {
      if (v.attributes.find((a) => a.name === axisName)?.value !== value) return false;
      return axisNames.every((n) => n === axisName || !selected[n] || v.attributes.find((a) => a.name === n)?.value === selected[n]);
    });
  }

  function selectValue(axisName: string, value: string) {
    setSelected((prev) => {
      const next = { ...prev, [axisName]: value };
      if (variants.some((v) => matches(v, next))) return next;
      // No variant honors this exact combo — snap to a real variant that at least matches the
      // axis just clicked, rather than silently falling back to an unrelated variant's price/stock.
      const fallback = variants.find((v) => v.attributes.find((a) => a.name === axisName)?.value === value);
      if (!fallback) return next;
      const snapped: Record<string, string | null> = {};
      axisNames.forEach((n) => {
        snapped[n] = fallback.attributes.find((a) => a.name === n)?.value ?? null;
      });
      return snapped;
    });
  }

  const variant = variants.find((v) => matches(v, selected)) ?? variants[0];

  async function handleAdd(buyNow: boolean) {
    if (!variant) return;
    const ok = await addItem(variant.id, quantity, !buyNow);
    if (ok && buyNow) router.push("/checkout");
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: productName, url }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard.");
    }
  }

  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/product/${productSlug}`;
  const whatsappHref = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
    `Hi, I'd like to ask about "${productName}" — ${productUrl}`
  )}`;

  return (
    <div className="flex flex-col gap-2.5">
      <Price price={variant.salePrice ?? variant.price} compareAt={variant.salePrice ? variant.price : null} currency={settings.currency} size="md" />

      {axisNames.map((axisName) => {
        const values = axisValues.get(axisName) ?? [];
        if (values.length === 0) return null;
        const isColorAxis = values.every((v) => v.hex);
        const isSizeAxis = /^size$/i.test(axisName);

        return (
          <div key={axisName}>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.12em] text-ink-soft">
                {axisName}
                {isColorAxis && selected[axisName] && ` — ${selected[axisName]}`}
              </p>
              {isSizeAxis && sizeGuide && (
                <button onClick={() => setSizeGuideOpen(true)} className="link-reveal text-xs uppercase tracking-[0.1em] text-ink-soft">
                  Size Guide
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {values.map(({ value, hex }) => {
                const available = isValueAvailable(axisName, value);
                const active = selected[axisName] === value;
                if (isColorAxis) {
                  return (
                    <button
                      key={value}
                      onClick={() => selectValue(axisName, value)}
                      disabled={!available}
                      title={value}
                      style={{ backgroundColor: hex }}
                      className={`h-7 w-7 rounded-full border-2 disabled:cursor-not-allowed disabled:opacity-30 ${active ? "border-ink" : "border-transparent"}`}
                    >
                      <span className="sr-only">{value}</span>
                    </button>
                  );
                }
                return (
                  <button
                    key={value}
                    onClick={() => selectValue(axisName, value)}
                    disabled={!available}
                    className={`h-8 min-w-8 border px-2 text-sm disabled:cursor-not-allowed disabled:opacity-30 ${
                      active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div>
        <p className="mb-1 text-xs uppercase tracking-[0.12em] text-ink-soft">Quantity</p>
        <div className="flex w-fit items-center border border-line">
          <button className="px-2 py-1" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
            <Minus size={13} />
          </button>
          <span className="w-6 text-center text-sm">{quantity}</span>
          <button
            className="px-2 py-1"
            onClick={() => setQuantity((q) => Math.min(variant.stock, q + 1))}
            disabled={quantity >= variant.stock}
            aria-label="Increase quantity"
          >
            <Plus size={13} />
          </button>
        </div>
        <p className="mt-1 text-xs text-ink-soft">
          {variant.stock === 0 ? "Out of stock" : variant.stock <= 5 ? `Only ${variant.stock} left in stock` : "In stock"}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Button size="md" className="py-2.5" disabled={variant.stock === 0} onClick={() => handleAdd(false)}>
          Add to Cart
        </Button>
        {!compact && (
          <Button size="md" className="py-2.5" variant="secondary" disabled={variant.stock === 0} onClick={() => handleAdd(true)}>
            Buy Now
          </Button>
        )}
      </div>

      <div className="flex items-center gap-5 text-xs uppercase tracking-[0.1em] text-ink-soft">
        <button onClick={() => toggleWishlist(productId)} className="flex items-center gap-1.5 hover:text-ink">
          <Heart size={15} className={isWishlisted ? "fill-sale text-sale" : ""} /> Wishlist
        </button>
        <button onClick={handleShare} className="flex items-center gap-1.5 hover:text-ink">
          <Share2 size={15} /> Share
        </button>
        {!compact && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-ink">
            <MessageCircle size={15} /> Enquire
          </a>
        )}
      </div>

      {sizeGuide && <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} guide={sizeGuide} />}
    </div>
  );
}
