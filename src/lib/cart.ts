import type { SiteSettings } from "@/lib/settings";
import { formatINR } from "@/lib/currency";

export interface PricedLine {
  price: number;
  salePrice: number | null;
  quantity: number;
  /** Effective GST % for this line — caller resolves product.gstRate ?? settings.taxPercent. */
  gstRate: number;
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
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
  freeShippingApplied: boolean;
  couponError?: string;
}

/**
 * GST is computed per line (lines can carry different rates), summed, then
 * split once at the order level into CGST+SGST (same state as the seller)
 * or IGST (different state) — GST law taxes each line at its own rate on
 * its own (discounted) value, so the coupon discount is prorated per line
 * rather than applied as one blended deduction before tax.
 */
export function calculateTotals(
  lines: PricedLine[],
  settings: SiteSettings,
  coupon: AppliedCoupon | null,
  deliveryMethod: "standard" | "express" = "standard",
  shippingState: string | null = null
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
  const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0;

  let totalGstAmount = 0;
  for (const line of lines) {
    const lineTaxable = Math.max(lineSubtotal(line) * (1 - discountRatio), 0);
    totalGstAmount += taxFor(lineTaxable, line.gstRate, settings.taxInclusive);
  }
  totalGstAmount = round2(totalGstAmount);

  const shippingFee = freeShippingFromCoupon ? 0 : shippingFeeFor(subtotal, settings, deliveryMethod);
  const taxableAmount = Math.max(subtotal - discountAmount, 0);

  const isIntraState = Boolean(
    shippingState && settings.gst.sellerState && normalizeState(shippingState) === normalizeState(settings.gst.sellerState)
  );
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  if (isIntraState) {
    cgstAmount = round2(totalGstAmount / 2);
    sgstAmount = round2(totalGstAmount - cgstAmount);
  } else {
    igstAmount = totalGstAmount;
  }
  const taxAmount = round2(cgstAmount + sgstAmount + igstAmount);

  const total = round2(settings.taxInclusive ? taxableAmount + shippingFee : taxableAmount + shippingFee + taxAmount);

  return {
    subtotal,
    discountAmount,
    shippingFee,
    taxAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    total,
    freeShippingApplied: shippingFee === 0,
    couponError,
  };
}

function normalizeState(state: string): string {
  return state.trim().toUpperCase();
}

function shippingFeeFor(subtotal: number, settings: SiteSettings, deliveryMethod: "standard" | "express"): number {
  if (deliveryMethod === "express") return settings.shipping.expressFee;
  if (subtotal >= settings.shipping.freeShippingThreshold) return 0;
  return settings.shipping.standardFee;
}

function taxFor(amount: number, gstRate: number, taxInclusive: boolean): number {
  if (taxInclusive) return round2((amount * gstRate) / (100 + gstRate));
  return round2(amount * (gstRate / 100));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMoney(amount: number): string {
  return formatINR(amount);
}

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FK-${y}${m}${d}-${rand}`;
}
