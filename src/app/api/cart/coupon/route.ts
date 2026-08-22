import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getOrCreateCart, getCartWithItems } from "@/lib/server/cart";
import { buildCartView } from "@/lib/server/cart-view";
import { applyCouponSchema } from "@/lib/validation/cart";

export async function POST(req: NextRequest) {
  const body = applyCouponSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Enter a coupon code." }, { status: 400 });

  const code = body.data.code.trim().toUpperCase();
  const coupon = await db.coupon.findUnique({ where: { code } });
  const now = new Date();

  if (!coupon || !coupon.isActive || coupon.startDate > now || coupon.endDate < now) {
    return NextResponse.json({ error: "This coupon is invalid or has expired." }, { status: 400 });
  }
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 400 });
  }

  const cart = await getOrCreateCart();
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: code } });

  const [full, settings] = await Promise.all([getCartWithItems(cart.id), getSettings()]);
  return NextResponse.json(await buildCartView(full, settings));
}

export async function DELETE() {
  const cart = await getOrCreateCart();
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });

  const [full, settings] = await Promise.all([getCartWithItems(cart.id), getSettings()]);
  return NextResponse.json(await buildCartView(full, settings));
}
