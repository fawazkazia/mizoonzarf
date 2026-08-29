"use client";

import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCartStore, cartItemCount } from "@/stores/cart-store";
import { Img } from "@/components/ui/ArtImage";
import { ButtonLink } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useSettings } from "@/components/SettingsContext";
import { formatINR } from "@/lib/currency";
import { formatAttrs } from "@/lib/inventory/variant-attributes";

export function CartDrawer() {
  const state = useCartStore();
  const settings = useSettings();
  const count = cartItemCount(state);
  const threshold = settings.shipping.freeShippingThreshold;
  const remaining = Math.max(threshold - state.subtotal, 0);
  const progress = threshold > 0 ? Math.min(state.subtotal / threshold, 1) : 1;

  return (
    <Sheet open={state.drawerOpen} onClose={state.closeDrawer} side="right" ariaLabel="Shopping bag" panelClassName="max-w-[26rem]">
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <div>
          <h2 className="font-display text-2xl">Shopping Bag</h2>
          <p className="text-xs text-ink-mute">
            {count} {count === 1 ? "item" : "items"}
          </p>
        </div>
        <button onClick={state.closeDrawer} aria-label="Close bag" className="flex h-11 w-11 items-center justify-center">
          <X size={20} />
        </button>
      </div>

      {state.lines.length > 0 && threshold > 0 && (
        <div className="border-b border-line px-6 py-4">
          <p className="text-xs text-ink-soft">
            {remaining > 0 ? (
              <>
                Add{" "}
                <strong className="text-ink">{formatINR(remaining)}</strong>{" "}
                more for free delivery
              </>
            ) : (
              "Free delivery unlocked"
            )}
          </p>
          <div className="mt-2 h-0.5 w-full bg-line">
            <div
              className="h-full bg-gold transition-[width] duration-[var(--dur-3)] ease-[var(--ease-out-soft)]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {state.lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-ink-soft">
            <ShoppingBag size={36} strokeWidth={1} />
            <p className="font-display text-xl text-ink">Your bag is empty</p>
            <p className="text-sm">Discover pieces you&apos;ll love.</p>
            <div className="flex gap-3">
              <ButtonLink href="/" variant="secondary" size="sm" onClick={state.closeDrawer}>
                Shop Now
              </ButtonLink>
              <ButtonLink href="/sale" variant="outline" size="sm" onClick={state.closeDrawer}>
                View Sale
              </ButtonLink>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-5">
            {state.lines.map((line) => (
              <li key={line.id} className="flex gap-4">
                <Link
                  href={`/product/${line.productSlug}`}
                  onClick={state.closeDrawer}
                  className="img-zoom aspect-[3/4] w-[4.5rem] shrink-0 overflow-hidden bg-paper-dim"
                >
                  <Img src={line.image} alt={line.productName} seedFallback={line.variantId} />
                </Link>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex justify-between gap-2">
                    <Link href={`/product/${line.productSlug}`} onClick={state.closeDrawer} className="text-sm font-medium hover:underline">
                      {line.productName}
                    </Link>
                    <span className="text-sm">{formatINR((line.salePrice ?? line.price) * line.quantity)}</span>
                  </div>
                  <p className="text-xs text-ink-mute">{formatAttrs(line.attributes)}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex items-center border border-line">
                      <button
                        className="flex h-9 w-9 items-center justify-center hover:border-line-strong"
                        onClick={() => state.updateItem(line.id, line.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-xs">{line.quantity}</span>
                      <button
                        className="flex h-9 w-9 items-center justify-center hover:border-line-strong"
                        onClick={() => state.updateItem(line.id, line.quantity + 1)}
                        disabled={line.quantity >= line.stock}
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => state.removeItem(line.id)}
                      aria-label="Remove item"
                      className="flex h-9 w-9 items-center justify-center text-ink-mute hover:text-ink"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {state.lines.length > 0 && (
        <div className="border-t border-line px-6 py-5">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-ink-soft">Subtotal</span>
            <span className="font-medium">{formatINR(state.subtotal)}</span>
          </div>
          <p className="mb-4 text-xs text-ink-mute">Taxes and shipping calculated at checkout.</p>
          <ButtonLink href="/checkout" onClick={state.closeDrawer} className="w-full">
            Checkout
          </ButtonLink>
          <ButtonLink href="/cart" variant="link" onClick={state.closeDrawer} className="mt-3 block w-full text-center">
            View Bag
          </ButtonLink>
        </div>
      )}
    </Sheet>
  );
}
