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

export interface VariantOption {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
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
}: {
  productId: string;
  productName: string;
  productSlug: string;
  variants: VariantOption[];
  /** Hides Buy Now and the WhatsApp-enquire row — used inside Quick View,
   * where a full purchase flow is out of place. */
  compact?: boolean;
  sizeGuideType?: string | null;
}) {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const sizeGuide = sizeGuideType ? SIZE_GUIDES[sizeGuideType] : null;
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[], [variants]);
  const colors = useMemo(() => {
    const seen = new Map<string, string | null>();
    variants.forEach((v) => v.color && seen.set(v.color, v.colorHex));
    return [...seen.entries()];
  }, [variants]);

  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(colors[0]?.[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const settings = useSettings();
  const addItem = useCartStore((s) => s.addItem);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(productId));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const variant = variants.find((v) => (sizes.length === 0 || v.size === size) && (colors.length === 0 || v.color === color)) ?? variants[0];

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
    <div className="flex flex-col gap-6">
      <Price price={variant.salePrice ?? variant.price} compareAt={variant.salePrice ? variant.price : null} currency={settings.currencySymbol} size="lg" />

      {sizes.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.12em] text-ink-soft">Size</p>
            {sizeGuide && (
              <button onClick={() => setSizeGuideOpen(true)} className="link-reveal text-xs uppercase tracking-[0.1em] text-ink-soft">
                Size Guide
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`h-10 min-w-10 border px-3 text-sm ${size === s ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-ink-soft">Colour {color && `— ${color}`}</p>
          <div className="flex flex-wrap gap-2">
            {colors.map(([name, hex]) => (
              <button
                key={name}
                onClick={() => setColor(name)}
                title={name}
                style={{ backgroundColor: hex ?? undefined }}
                className={`h-9 w-9 rounded-full border-2 ${color === name ? "border-ink" : "border-transparent"}`}
              >
                {!hex && <span className="sr-only">{name}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.12em] text-ink-soft">Quantity</p>
        <div className="flex w-fit items-center border border-line">
          <button className="px-3 py-2" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
            <Minus size={14} />
          </button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <button
            className="px-3 py-2"
            onClick={() => setQuantity((q) => Math.min(variant.stock, q + 1))}
            disabled={quantity >= variant.stock}
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          {variant.stock === 0 ? "Out of stock" : variant.stock <= 5 ? `Only ${variant.stock} left in stock` : "In stock"}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button size="lg" disabled={variant.stock === 0} onClick={() => handleAdd(false)}>
          Add to Cart
        </Button>
        {!compact && (
          <Button size="lg" variant="secondary" disabled={variant.stock === 0} onClick={() => handleAdd(true)}>
            Buy Now
          </Button>
        )}
      </div>

      <div className="flex items-center gap-6 text-xs uppercase tracking-[0.1em] text-ink-soft">
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
