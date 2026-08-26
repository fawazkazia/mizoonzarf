import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
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

  const session = await auth();
  if (coupon.customerIds.length > 0 && (!session?.user || !coupon.customerIds.includes(session.user.id))) {
    return NextResponse.json({ error: "This coupon isn't available on your account." }, { status: 400 });
  }

  const cart = await getOrCreateCart();

  if (coupon.categorySlugs.length > 0 || coupon.productIds.length > 0) {
    const cartWithItems = await getCartWithItems(cart.id);
    const cartItems = cartWithItems?.items ?? [];

    const allowedCategoryIds = coupon.categorySlugs.length
      ? (await db.category.findMany({ where: { slug: { in: coupon.categorySlugs } }, select: { id: true } })).map((c) => c.id)
      : [];

    const matches = cartItems.some(
      (item) => coupon.productIds.includes(item.productId) || allowedCategoryIds.includes(item.product.categoryId)
    );
    if (!matches) {
      return NextResponse.json({ error: "This coupon only applies to select products." }, { status: 400 });
    }
  }

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
