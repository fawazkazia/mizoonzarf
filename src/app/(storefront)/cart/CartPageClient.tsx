"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Img } from "@/components/ui/ArtImage";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cart-store";
import { useSettings } from "@/components/SettingsContext";
import { formatINR } from "@/lib/currency";
import { formatAttrs } from "@/lib/inventory/variant-attributes";

export function CartPageClient() {
  const cart = useCartStore();
  const settings = useSettings();
  const [code, setCode] = useState("");

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    await cart.applyCoupon(code.trim());
  }

  if (!cart.hasFetched) return null;

  if (cart.lines.length === 0) {
    return (
      <Container className="flex flex-col items-center gap-4 py-32 text-center">
        <ShoppingBag size={40} strokeWidth={1} className="text-ink-soft" />
        <h1 className="font-display text-3xl">Your bag is empty</h1>
        <p className="text-ink-soft">Looks like you haven&apos;t added anything yet.</p>
        <ButtonLink href="/men">Start Shopping</ButtonLink>
      </Container>
    );
  }

  return (
    <Container className="grid gap-12 py-12 lg:grid-cols-[1fr_380px]">
      <div>
        <h1 className="mb-8 font-display text-3xl">Your Bag ({cart.lines.length})</h1>
        <ul className="flex flex-col divide-y divide-line">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex gap-5 py-6">
              <Link href={`/product/${line.productSlug}`} className="h-32 w-24 shrink-0 bg-paper-dim">
                <Img src={line.image} alt={line.productName} seedFallback={line.variantId} />
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link href={`/product/${line.productSlug}`} className="font-medium hover:underline">
                      {line.productName}
                    </Link>
                    <p className="mt-1 text-sm text-ink-soft">{formatAttrs(line.attributes)}</p>
                  </div>
                  <button onClick={() => cart.removeItem(line.id)} aria-label="Remove item" className="text-ink-soft hover:text-ink">
                    <X size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-line">
                    <button className="px-3 py-1.5" onClick={() => cart.updateItem(line.id, line.quantity - 1)} aria-label="Decrease quantity">
                      <Minus size={13} />
                    </button>
                    <span className="w-8 text-center text-sm">{line.quantity}</span>
                    <button
                      className="px-3 py-1.5"
                      onClick={() => cart.updateItem(line.id, line.quantity + 1)}
                      disabled={line.quantity >= line.stock}
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="font-medium">{formatINR((line.salePrice ?? line.price) * line.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-fit border border-line p-6">
        <h2 className="mb-5 font-display text-xl">Order Summary</h2>

        <form onSubmit={applyCoupon} className="mb-5 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Coupon code"
            className="w-full border border-line px-3 py-2 text-sm uppercase"
          />
          <Button type="submit" size="sm" variant="secondary">
            Apply
          </Button>
        </form>
        {cart.couponCode && (
          <div className="mb-4 flex items-center justify-between bg-paper-dim px-3 py-2 text-sm">
            <span>
              Coupon <strong>{cart.couponCode}</strong> applied
            </span>
            <button onClick={() => cart.removeCoupon()} className="text-ink-soft hover:text-ink">
              <X size={14} />
            </button>
          </div>
        )}
        {cart.couponError && <p className="mb-4 text-xs text-sale">{cart.couponError}</p>}

        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-soft">Subtotal</span>
            <span>{formatINR(cart.subtotal)}</span>
          </div>
          {cart.discountAmount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount</span>
              <span>-{formatINR(cart.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-soft">Shipping</span>
            <span>{cart.freeShippingApplied ? "Free" : formatINR(cart.shippingFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">GST ({settings.taxPercent}%)</span>
            <span>{formatINR(cart.taxAmount)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-line pt-3 text-base font-medium">
            <span>Total</span>
            <span>{formatINR(cart.total)}</span>
          </div>
        </div>

        <ButtonLink href="/checkout" className="mt-6 w-full">
          Proceed to Checkout
        </ButtonLink>
        <ButtonLink href="/men" variant="secondary" className="mt-3 w-full">
          Continue Shopping
        </ButtonLink>
      </div>
    </Container>
  );
}
