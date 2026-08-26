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
    <div className="flex flex-wrap items-center justify-between gap-2 border border-success/20 bg-success/10 px-4 py-3 text-sm">
      <div className="flex items-center gap-2.5">
        <Tag size={16} className="shrink-0 text-success" />
        <span className="font-medium text-ink">{description ?? fallbackCopy}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 border border-line bg-paper px-3 py-1.5 text-xs font-medium uppercase tracking-[0.06em] hover:border-ink"
        >
          {code} {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
        <button
          type="button"
          onClick={() => applyCoupon(code)}
          className="link-reveal text-xs uppercase tracking-[0.1em] text-ink-soft"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
