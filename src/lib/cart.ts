import type { SiteSettings } from "@/lib/settings";

export interface PricedLine {
  price: number;
  salePrice: number | null;
  quantity: number;
}

export interface AppliedCoupon {
  discountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING" | "BUY_X_GET_Y";
  discountValue: number;
  minOrderValue: number | null;
  maxDiscountAmount: number | null;
}

export function lineUnitPrice(line: PricedLine): number {
  return line.salePrice ?? line.price;
}

export function lineSubtotal(line: PricedLine): number {
  return lineUnitPrice(line) * line.quantity;
}

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  freeShippingApplied: boolean;
  couponError?: string;
}

export function calculateTotals(
  lines: PricedLine[],
  settings: SiteSettings,
  coupon: AppliedCoupon | null,
  deliveryMethod: "standard" | "express" = "standard"
): CartTotals {
  const subtotal = round2(lines.reduce((sum, l) => sum + lineSubtotal(l), 0));

  let discountAmount = 0;
  let freeShippingFromCoupon = false;
  let couponError: string | undefined;

  if (coupon) {
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      couponError = `Add ${settings.currencySymbol} ${(coupon.minOrderValue - subtotal).toFixed(2)} more to use this coupon.`;
    } else if (coupon.discountType === "PERCENTAGE") {
      discountAmount = subtotal * (coupon.discountValue / 100);
      if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    } else if (coupon.discountType === "FIXED") {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    } else if (coupon.discountType === "FREE_SHIPPING") {
      freeShippingFromCoupon = true;
    }
  }

  discountAmount = round2(discountAmount);

  const shippingFee = freeShippingFromCoupon ? 0 : shippingFeeFor(subtotal, settings, deliveryMethod);
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const taxAmount = taxFor(taxableAmount, settings);
  const total = round2(settings.taxInclusive ? taxableAmount + shippingFee : taxableAmount + shippingFee + taxAmount);

  return {
    subtotal,
    discountAmount,
    shippingFee,
    taxAmount,
    total,
    freeShippingApplied: shippingFee === 0,
    couponError,
  };
}

function shippingFeeFor(subtotal: number, settings: SiteSettings, deliveryMethod: "standard" | "express"): number {
  if (deliveryMethod === "express") return settings.shipping.expressFee;
  if (subtotal >= settings.shipping.freeShippingThreshold) return 0;
  return settings.shipping.standardFee;
}

function taxFor(amount: number, settings: SiteSettings): number {
  if (settings.taxInclusive) return round2((amount * settings.taxPercent) / (100 + settings.taxPercent));
  return round2(amount * (settings.taxPercent / 100));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMoney(amount: number, settings: Pick<SiteSettings, "currencySymbol">): string {
  return `${settings.currencySymbol} ${amount.toFixed(2)}`;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FK-${y}${m}${d}-${rand}`;
}
