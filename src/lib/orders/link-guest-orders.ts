import { db } from "@/lib/db";

/**
 * Retroactively attaches guest orders (placed with `userId: null`, identified
 * only by `guestEmail`) to an account once someone signs up or logs in with
 * that same email — otherwise an order placed as a guest can never show up
 * under "My Orders", even after creating an account with the same address.
 * Idempotent: matches only unlinked orders, so it's cheap to call on every
 * account page load rather than just once at signup.
 */
export async function linkGuestOrdersToUser(userId: string, email: string): Promise<void> {
  await db.order.updateMany({
    where: { userId: null, guestEmail: { equals: email, mode: "insensitive" } },
    data: { userId },
  });
}
