import type { CartWithItems } from "@/lib/server/cart";
import { calculateTotals, type AppliedCoupon } from "@/lib/cart";
import type { SiteSettings } from "@/lib/settings";
import { db } from "@/lib/db";

export interface CartLineView {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  size: string | null;
  color: string | null;
  price: number;
  salePrice: number | null;
  quantity: number;
  stock: number;
  image: string | null;
  gstRate: number;
}

export interface CartView {
  id: string | null;
  lines: CartLineView[];
  couponCode: string | null;
  couponError?: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
  freeShippingApplied: boolean;
}

export async function buildCartView(cart: CartWithItems | null, settings: SiteSettings): Promise<CartView> {
  if (!cart) {
    const empty = calculateTotals([], settings, null);
    return { id: null, lines: [], couponCode: null, ...empty };
  }

  const lines: CartLineView[] = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    productSlug: item.product.slug,
    variantId: item.variantId,
    size: item.variant.size,
    color: item.variant.color,
    price: Number(item.variant.price),
    salePrice: item.variant.salePrice ? Number(item.variant.salePrice) : null,
    quantity: item.quantity,
    stock: item.variant.stock,
    image: item.variant.imageUrl ?? item.product.images[0]?.url ?? null,
    gstRate: item.product.gstRate != null ? Number(item.product.gstRate) : settings.taxPercent,
  }));

  let coupon: AppliedCoupon | null = null;
  if (cart.couponCode) {
    const record = await db.coupon.findUnique({ where: { code: cart.couponCode } });
    if (record && record.isActive && record.startDate <= new Date() && record.endDate >= new Date()) {
      coupon = {
        discountType: record.discountType,
        discountValue: Number(record.discountValue),
        minOrderValue: record.minOrderValue ? Number(record.minOrderValue) : null,
        maxDiscountAmount: record.maxDiscountAmount ? Number(record.maxDiscountAmount) : null,
      };
    }
  }

  const totals = calculateTotals(
    lines.map((l) => ({ price: l.price, salePrice: l.salePrice, quantity: l.quantity, gstRate: l.gstRate })),
    settings,
    coupon
  );

  return { id: cart.id, lines, couponCode: cart.couponCode, ...totals };
}
