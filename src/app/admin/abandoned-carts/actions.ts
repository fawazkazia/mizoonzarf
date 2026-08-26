"use server";

import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin-auth";
import { notify } from "@/lib/notifications/registry";

export async function sendCartRecoveryEmail(cartId: string) {
  await requireStaff();

  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: { user: { select: { name: true, email: true } }, items: true },
  });
  if (!cart) throw new Error("Cart not found.");
  if (!cart.user?.email) throw new Error("This cart has no contact information to recover it with.");

  await notify({
    channel: "EMAIL",
    to: cart.user.email,
    templateKey: "cart_abandoned",
    variables: { customer_name: cart.user.name ?? "there", item_count: cart.items.length },
  });
}
