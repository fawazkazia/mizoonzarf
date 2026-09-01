"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cancelOrder, CANCELLABLE_ORDER_STATUSES } from "@/lib/orders/cancel";
import { cancelOrderSchema, type CancelOrderInput } from "@/lib/validation/order";

export async function cancelMyOrder(raw: CancelOrderInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Please sign in to cancel this order.");

  const input = cancelOrderSchema.parse(raw);

  const order = await db.order.findUnique({ where: { id: input.orderId }, select: { userId: true, status: true } });
  if (!order || order.userId !== session.user.id) throw new Error("Order not found.");
  if (!CANCELLABLE_ORDER_STATUSES.includes(order.status)) {
    throw new Error("This order can no longer be cancelled — it has already been shipped.");
  }

  const result = await cancelOrder({ orderId: input.orderId, reason: input.reason, cancelledById: session.user.id });
  if (!result.ok) {
    throw new Error(
      result.reason === "NOT_FOUND" ? "Order not found." : "This order can no longer be cancelled — it has already been shipped."
    );
  }
}
