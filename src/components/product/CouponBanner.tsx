"use client";

import { useState } from "react";
import { Copy, Check, Tag } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart-store";

export function CouponBanner({
  code,
  description,
  discountType,
  discountValue,
}: {
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING" | "BUY_X_GET_Y";
  discountValue: number;
}) {
  const [copied, setCopied] = useState(false);
  const applyCoupon = useCartStore((s) => s.applyCoupon);

  const fallbackCopy =
    discountType === "PERCENTAGE"
      ? `Extra ${discountValue}% off your order`
      : discountType === "FIXED"
        ? `${discountValue} off your order`
        : discountType === "FREE_SHIPPING"
          ? "Free shipping on your order"
          : "Special offer on this order";

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Coupon code copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/60 bg-paper-raise px-3 py-2 text-xs shadow-[var(--shadow-panel)]">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold-deep">
          <Tag size={13} />
        </span>
        <span className="font-medium text-ink">{description ?? fallbackCopy}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-full border border-dashed border-line-strong bg-paper-dim px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors hover:border-ink"
        >
          {code} {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
        <button
          type="button"
          onClick={() => applyCoupon(code)}
          className="rounded-full bg-ink px-3 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-paper transition-colors hover:bg-ink-soft"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
