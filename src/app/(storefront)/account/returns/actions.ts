"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/notifications/registry";
import { returnRequestSchema, type ReturnRequestInput } from "@/lib/validation/return";

export async function requestReturn(raw: ReturnRequestInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Please sign in to request a return.");

  const input = returnRequestSchema.parse(raw);

  const orderItem = await db.orderItem.findUnique({
    where: { id: input.orderItemId },
    include: { order: true, returns: true },
  });
  if (!orderItem || orderItem.order.userId !== session.user.id) throw new Error("Order item not found.");
  if (orderItem.order.status !== "DELIVERED") throw new Error("Only delivered items can be returned.");
  if (orderItem.returns.length > 0) throw new Error("A return has already been requested for this item.");

  await db.return.create({
    data: {
      orderId: orderItem.orderId,
      orderItemId: orderItem.id,
      reason: input.reason,
      description: input.description || null,
      status: "REQUESTED",
    },
  });

  if (session.user.email) {
    try {
      await notify({
        channel: "EMAIL",
        to: session.user.email,
        templateKey: "return_requested",
        variables: { order_number: orderItem.order.orderNumber },
      });
    } catch (err) {
      console.error("[requestReturn] notify failed", err);
    }
  }

  revalidatePath("/account/returns");
  revalidatePath(`/account/orders/${orderItem.orderId}`);
}
