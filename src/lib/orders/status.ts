import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { notify, ORDER_EVENT_TEMPLATES } from "@/lib/notifications/registry";
import { createNotification } from "@/lib/notifications/inapp";
import { estimatePointsEarned, reverseLoyaltyPoints } from "@/lib/loyalty";
import { recomputeUserReliability } from "@/lib/risk/recomputeReliability";
import type { OrderStatus } from "@/generated/prisma/client";

const POINTS_REVERSING_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED", "RETURNED"];

/**
 * Core order-status transition: history row, loyalty earn/reverse, customer
 * notifications. Shared by the admin "Update Status" action (after
 * requireStaff()) and Shiprocket-driven transitions (webhook + cron sync),
 * so a courier-driven DELIVERED behaves identically to an admin-driven one
 * instead of drifting into a second implementation.
 */
export async function applyOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<void> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found.");

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status } });
    await tx.orderStatusHistory.create({ data: { orderId, status, note: note || undefined } });

    if (status === "DELIVERED" && order.userId) {
      const alreadyEarned = await tx.loyaltyTransaction.findFirst({ where: { orderId, type: "EARN_ORDER" } });
      if (!alreadyEarned) {
        const points = estimatePointsEarned(Number(order.total));
        if (points > 0) {
          const account = await tx.loyaltyAccount.upsert({
            where: { userId: order.userId },
            create: { userId: order.userId, pointsBalance: 0 },
            update: {},
          });
          await tx.loyaltyTransaction.create({
            data: { loyaltyAccountId: account.id, orderId, points, type: "EARN_ORDER", description: `Order ${order.orderNumber}` },
          });
          await tx.loyaltyAccount.update({ where: { id: account.id }, data: { pointsBalance: { increment: points } } });
        }
      }
    }

    if (POINTS_REVERSING_STATUSES.includes(status)) {
      await reverseLoyaltyPoints(tx, orderId, order.orderNumber);
    }

    if (order.userId && (status === "CANCELLED" || status === "DELIVERED")) {
      await recomputeUserReliability(tx, order.userId);
    }
  });

  const templateKey = ORDER_EVENT_TEMPLATES[status];
  const user = order.userId ? await db.user.findUnique({ where: { id: order.userId } }) : null;
  const contactEmail = order.guestEmail ?? user?.email;
  const contactPhone = order.guestPhone ?? user?.phone;
  const variables = { order_number: order.orderNumber, order_total: Number(order.total) };

  if (templateKey) {
    for (const notification of [
      { channel: "EMAIL" as const, to: contactEmail },
      { channel: "SMS" as const, to: contactPhone },
      { channel: "WHATSAPP" as const, to: contactPhone },
    ]) {
      if (!notification.to) continue;
      try {
        await notify({ channel: notification.channel, to: notification.to, templateKey, variables });
      } catch (err) {
        console.error(`[applyOrderStatus] notify(${notification.channel}) failed`, err);
      }
    }
  }

  if (order.userId) {
    await createNotification({
      userId: order.userId,
      type: "ORDER_STATUS",
      title: `Order ${order.orderNumber}`,
      body: `Your order is now ${status.replace(/_/g, " ").toLowerCase()}.`,
      link: `/account/orders/${orderId}`,
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/account/orders");
}
