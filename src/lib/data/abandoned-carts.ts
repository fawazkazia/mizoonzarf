import { db } from "@/lib/db";

const ABANDONED_AFTER_MS = 60 * 60 * 1000;

/**
 * Checkout empties CartItem rows on success (see src/app/api/checkout/route.ts),
 * so any Cart with items left is by definition not-yet-converted — the only
 * extra signal needed is "stale enough to no longer be an active session".
 */
export async function getAbandonedCarts() {
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_MS);

  const carts = await db.cart.findMany({
    where: { updatedAt: { lte: cutoff }, items: { some: {} } },
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true, slug: true } },
          variant: { select: { size: true, color: true, price: true, salePrice: true, imageUrl: true } },
        },
      },
    },
  });

  return carts.map((cart) => {
    const value = cart.items.reduce((sum, item) => {
      const unit = Number(item.variant.salePrice ?? item.variant.price);
      return sum + unit * item.quantity;
    }, 0);

    return {
      id: cart.id,
      customerName: cart.user?.name ?? null,
      customerEmail: cart.user?.email ?? null,
      isGuest: !cart.user,
      updatedAt: cart.updatedAt,
      value,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      items: cart.items.map((item) => ({
        productName: item.product.name,
        productSlug: item.product.slug,
        variantLabel: [item.variant.size, item.variant.color].filter(Boolean).join(" / "),
        imageUrl: item.variant.imageUrl,
        quantity: item.quantity,
      })),
    };
  });
}

export async function countAbandonedCarts(from: Date, to: Date): Promise<number> {
  return db.cart.count({
    where: { updatedAt: { gte: from, lte: to }, items: { some: {} } },
  });
}
