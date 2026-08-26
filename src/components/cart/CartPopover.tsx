"use client";

import Link from "next/link";
import { Trash2, Truck } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { Img } from "@/components/ui/ArtImage";
import { useSettings } from "@/components/SettingsContext";
import { formatINR } from "@/lib/currency";
import { estimateDeliveryRange } from "@/lib/delivery";

function deliveryEstimateLabel(processingDays: number, rangeText: string): string {
  const { max } = estimateDeliveryRange({ processingDays, rangeText, from: new Date() });
  return max.toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" });
}

/** Compact "mini cart" dropdown shown right under the header's bag icon — distinct from the full CartDrawer sheet still used after "Add to Bag". */
export function CartPopover({ onClose }: { onClose: () => void }) {
  const state = useCartStore();
  const settings = useSettings();
  const { gradientFrom, gradientVia, gradientTo } = settings.promoStrips.brandsBanner;
  const deliveryBy = deliveryEstimateLabel(settings.shipping.processingDays, settings.shipping.standardDays);

  return (
    <div className="fixed inset-x-4 top-20 z-[var(--z-panel)] border border-line bg-paper-raise shadow-[var(--shadow-panel)] sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[400px]">
      <div className="border-b border-line px-6 py-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em]">My Basket</h2>
      </div>

      {state.lines.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="font-display text-lg">Your bag is empty</p>
          <Link href="/" onClick={onClose} className="mt-3 inline-block text-sm underline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="flex max-h-[360px] flex-col gap-4 overflow-y-auto px-6 py-4">
            {state.lines.map((line) => {
              const unitPrice = line.salePrice ?? line.price;
              const discountPercent = line.salePrice ? Math.round(((line.price - line.salePrice) / line.price) * 100) : 0;

              return (
                <li key={line.id} className="flex gap-3">
                  <Link
                    href={`/product/${line.productSlug}`}
                    onClick={onClose}
                    className="h-20 w-16 shrink-0 overflow-hidden bg-paper-dim"
                  >
                    <Img src={line.image} alt={line.productName} seedFallback={line.variantId} />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${line.productSlug}`} onClick={onClose} className="text-sm font-semibold uppercase hover:underline">
                        {line.productName}
                      </Link>
                      <select
                        value={line.quantity}
                        onChange={(e) => state.updateItem(line.id, Number(e.target.value))}
                        className="h-8 border border-line px-1.5 text-xs outline-none"
                        aria-label="Quantity"
                      >
                        {Array.from({ length: Math.max(line.stock, line.quantity) }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {line.color && <>Color: {line.color}</>}
                      {line.color && line.size && "  |  "}
                      {line.size && <>Size: {line.size}</>}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className="font-medium">{formatINR(unitPrice)}</span>
                      {line.salePrice && (
                        <>
                          <span className="text-ink-mute line-through">{formatINR(line.price)}</span>
                          <span className="text-sale">-{discountPercent}%</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 bg-paper-dim px-2 py-1.5 text-[11px] text-ink-soft">
                        <Truck size={13} strokeWidth={1.5} />
                        Get it by <strong className="text-ink">{deliveryBy}</strong>
                      </span>
                      <button
                        onClick={() => state.removeItem(line.id)}
                        aria-label="Remove item"
                        className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-mute hover:text-ink"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-line px-6 py-4">
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-ink-soft">Subtotal</span>
              <span className="font-semibold">{formatINR(state.subtotal)}</span>
            </div>
            <Link
              href="/cart"
              onClick={onClose}
              className="flex h-12 w-full items-center justify-center rounded-[var(--radius-pill)] text-sm font-semibold uppercase tracking-[0.06em] text-paper transition-opacity duration-[var(--dur-1)] hover:opacity-90"
              style={{ backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientVia}, ${gradientTo})` }}
            >
              View Bag
            </Link>
            <p className="mt-3 text-center text-xs text-ink-soft">
              Free delivery*. <Link href="/shipping" onClick={onClose} className="underline">More info here.</Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
