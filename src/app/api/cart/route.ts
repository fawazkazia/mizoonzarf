import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getCartForRead, getOrCreateCart, getCartWithItems } from "@/lib/server/cart";
import { buildCartView } from "@/lib/server/cart-view";
import { addToCartSchema, updateCartItemSchema } from "@/lib/validation/cart";

export async function GET() {
  const [cart, settings] = await Promise.all([getCartForRead(), getSettings()]);
  return NextResponse.json(await buildCartView(cart, settings));
}

export async function POST(req: NextRequest) {
  const body = addToCartSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }

  const variant = await db.productVariant.findUnique({ where: { id: body.data.variantId } });
  if (!variant) return NextResponse.json({ error: "This item is no longer available." }, { status: 404 });

  const cart = await getOrCreateCart();
  const existing = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
  });

  const desiredQty = (existing?.quantity ?? 0) + body.data.quantity;
  const cappedQty = Math.min(desiredQty, Math.max(variant.stock, 0));

  if (cappedQty <= 0) {
    return NextResponse.json({ error: "This item is out of stock." }, { status: 400 });
  }

  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    update: { quantity: cappedQty },
    create: { cartId: cart.id, productId: variant.productId, variantId: variant.id, quantity: cappedQty },
  });

  const [full, settings] = await Promise.all([getCartWithItems(cart.id), getSettings()]);
  return NextResponse.json(await buildCartView(full, settings));
}

export async function PATCH(req: NextRequest) {
  const body = updateCartItemSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.issues[0].message }, { status: 400 });
  }

  const cart = await getOrCreateCart();
  const item = await db.cartItem.findFirst({ where: { id: body.data.itemId, cartId: cart.id } });
  if (!item) return NextResponse.json({ error: "Item not found in cart." }, { status: 404 });

  if (body.data.quantity === 0) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    const variant = await db.productVariant.findUnique({ where: { id: item.variantId } });
    const cappedQty = Math.min(body.data.quantity, Math.max(variant?.stock ?? 0, 0));
    await db.cartItem.update({ where: { id: item.id }, data: { quantity: cappedQty } });
  }

  const [full, settings] = await Promise.all([getCartWithItems(cart.id), getSettings()]);
  return NextResponse.json(await buildCartView(full, settings));
}

export async function DELETE(req: NextRequest) {
  const itemId = req.nextUrl.searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "Missing itemId." }, { status: 400 });

  const cart = await getOrCreateCart();
  await db.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });

  const [full, settings] = await Promise.all([getCartWithItems(cart.id), getSettings()]);
  return NextResponse.json(await buildCartView(full, settings));
}
