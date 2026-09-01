"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendOrderEmail } from "@/lib/notifications/order-email";
import { returnRequestSchema, type ReturnRequestInput } from "@/lib/validation/return";
import { createTicketFromSystemEvent } from "@/lib/customer-care/auto-create";

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

  await sendOrderEmail({
    orderId: orderItem.orderId,
    userId: session.user.id,
    to: session.user.email,
    templateKey: "return_requested",
    variables: { order_number: orderItem.order.orderNumber },
  });

  await createTicketFromSystemEvent({
    category: "RETURN_REQUEST",
    source: "RETURN_REQUEST",
    orderId: orderItem.orderId,
    customerId: session.user.id,
    subject: `Return request — ${orderItem.order.orderNumber}`,
    description: input.description ? `${input.reason}: ${input.description}` : input.reason,
  });

  revalidatePath("/account/returns");
  revalidatePath(`/account/orders/${orderItem.orderId}`);
}
