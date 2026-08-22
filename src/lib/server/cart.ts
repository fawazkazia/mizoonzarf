import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const CART_COOKIE = "cart_token";

const cartInclude = {
  items: {
    include: {
      product: { include: { images: { orderBy: { sortOrder: "asc" as const } } } },
      variant: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof getCartForRead>>>;

/** Read-only lookup safe to call from Server Components (never writes cookies). */
export async function getCartForRead() {
  const session = await auth();
  if (session?.user) {
    return db.cart.findUnique({ where: { userId: session.user.id }, include: cartInclude });
  }
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (!token) return null;
  return db.cart.findUnique({ where: { sessionToken: token }, include: cartInclude });
}

/** Call only from Route Handlers / Server Actions — may set the guest cart cookie. */
export async function getOrCreateCart() {
  const session = await auth();
  if (session?.user) {
    const existing = await db.cart.findUnique({ where: { userId: session.user.id } });
    if (existing) return existing;
    return db.cart.create({ data: { userId: session.user.id } });
  }

  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (token) {
    const existing = await db.cart.findUnique({ where: { sessionToken: token } });
    if (existing) return existing;
  }

  const newToken = randomUUID();
  store.set(CART_COOKIE, newToken, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 60,
    path: "/",
  });
  return db.cart.create({ data: { sessionToken: newToken } });
}

export async function getCartWithItems(cartId: string) {
  return db.cart.findUnique({ where: { id: cartId }, include: cartInclude });
}

/** Folds a guest cart (identified by cookie) into the signed-in user's cart, then clears the cookie. */
export async function mergeGuestCartIntoUser(userId: string) {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value;
  if (!token) return;

  const guestCart = await db.cart.findUnique({ where: { sessionToken: token }, include: { items: true } });
  if (!guestCart) {
    store.delete(CART_COOKIE);
    return;
  }

  const userCart = await db.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  for (const item of guestCart.items) {
    await db.cartItem.upsert({
      where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
      update: { quantity: { increment: item.quantity } },
      create: {
        cartId: userCart.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      },
    });
  }

  await db.cart.delete({ where: { id: guestCart.id } });
  store.delete(CART_COOKIE);
}
