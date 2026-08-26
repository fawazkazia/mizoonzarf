"use client";

import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import { Img } from "@/components/ui/ArtImage";
import { Price, discountPercent } from "@/components/ui/Price";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCartStore } from "@/stores/cart-store";
import { useQuickViewStore } from "@/stores/quick-view-store";
import { useDisplayPrice } from "@/hooks/useDisplayPrice";
import type { ProductCard as ProductCardData } from "@/lib/data/products";
import { cn } from "@/lib/utils";

export function ProductCard({ product, className }: { product: ProductCardData; className?: string }) {
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);
  const openQuickView = useQuickViewStore((s) => s.open);
  const display = useDisplayPrice(product.price, product.compareAtPrice);
  const off = discountPercent(product.price, product.compareAtPrice);
  const singleVariant = product.variantCount <= 1 && product.defaultVariantId;

  function handlePrimaryAction(e: React.MouseEvent) {
    e.preventDefault();
    if (singleVariant && product.defaultVariantId) {
      addItem(product.defaultVariantId, 1, true);
    } else {
      openQuickView(product.slug);
    }
  }

  return (
    <div className={cn("group flex flex-col", className)}>
      <div className="img-zoom relative aspect-[4/5] overflow-hidden bg-paper-dim">
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          <Img
            src={product.image}
            alt={product.name}
            seedFallback={product.id}
            className={cn(product.hoverImage && "transition-opacity duration-500 lg:group-hover:opacity-0")}
          />
          {product.hoverImage && (
            <Img
              src={product.hoverImage}
              alt=""
              seedFallback={product.id}
              className="absolute inset-0 opacity-0 transition-opacity duration-500 lg:group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {off && <Badge tone="sale">-{off}%</Badge>}
          {product.isNew && !off && <Badge tone="ink">New</Badge>}
          {!product.inStock && (
            <Badge tone="outline" className="bg-paper">
              Sold Out
            </Badge>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          aria-label="Toggle wishlist"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 opacity-100 transition-opacity duration-[var(--dur-1)] lg:opacity-0 lg:group-hover:opacity-100"
        >
          <Heart size={15} className={isWishlisted ? "fill-sale text-sale" : "text-ink"} />
        </button>

        <div className="absolute inset-x-0 bottom-0 hidden gap-px lg:flex lg:translate-y-full lg:opacity-0 lg:transition-all lg:duration-[var(--dur-2)] lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              openQuickView(product.slug);
            }}
            className="flex flex-1 items-center justify-center gap-1.5 bg-paper/95 py-2.5 text-[10px] uppercase tracking-[0.1em] hover:bg-paper"
          >
            <Eye size={13} /> Quick View
          </button>
          {product.inStock && (
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="flex flex-1 items-center justify-center gap-1.5 bg-ink py-2.5 text-[10px] uppercase tracking-[0.1em] text-paper hover:bg-ink-soft"
            >
              {singleVariant ? "Add to Bag" : "Select Options"}
            </button>
          )}
        </div>
      </div>

      <Link href={`/product/${product.slug}`} className="mt-3 flex flex-col gap-1.5">
        <p className="flex h-4 items-center text-[11px] uppercase tracking-[0.1em] text-ink-soft/70">{product.brand || " "}</p>
        <p className="line-clamp-2 h-10 text-sm leading-snug">{product.name}</p>
        <span className="inline-flex items-center gap-1">
          {display.isConverted && <span className="text-ink-soft/60">≈</span>}
          <Price price={display.price} compareAt={display.compareAt} currency={display.symbol} size="sm" />
        </span>
        <div className="flex h-4 items-center">
          {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} size={11} />}
        </div>

        <div className="mt-1 flex h-4 items-center gap-1.5">
          {product.colors.slice(0, 4).map((c) =>
            c.hex ? (
              <span key={c.name} title={c.name} className="h-3 w-3 shrink-0 rounded-full ring-1 ring-ink/15" style={{ backgroundColor: c.hex }} />
            ) : (
              <span
                key={c.name}
                title={c.name}
                className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-paper-dim text-[6px] uppercase leading-none text-ink-soft ring-1 ring-ink/15"
              >
                {c.name[0]}
              </span>
            )
          )}
          {product.colors.length > 4 && <span className="text-[10px] text-ink-soft">+{product.colors.length - 4}</span>}
        </div>

        <div className="hidden h-4 flex-wrap items-center gap-1.5 lg:flex lg:opacity-0 lg:transition-opacity lg:duration-[var(--dur-1)] lg:group-hover:opacity-100">
          {product.sizes.map((s) => (
            <span
              key={s}
              className={cn(
                "text-[10px] uppercase text-ink-soft",
                !product.sizesInStock.includes(s) && "text-ink-soft/30 line-through"
              )}
            >
              {s}
            </span>
          ))}
        </div>
      </Link>
    </div>
  );
}
