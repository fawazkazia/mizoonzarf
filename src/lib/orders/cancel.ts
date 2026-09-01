import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { notify, ORDER_EVENT_TEMPLATES } from "@/lib/notifications/registry";
import { sendOrderEmail } from "@/lib/notifications/order-email";
import { createNotification } from "@/lib/notifications/inapp";
import { reverseLoyaltyPoints } from "@/lib/loyalty";
import { recomputeUserReliability } from "@/lib/risk/recomputeReliability";
import { processRefund } from "@/lib/finance/refunds";
import { createTicketFromSystemEvent } from "@/lib/customer-care/auto-create";
import type { OrderStatus } from "@/generated/prisma/client";

/** Statuses a customer (or staff, via the same guard) can still cancel from — once an order
 * reaches SHIPPED or later, it's out for physical fulfillment and can no longer be cancelled. */
export const CANCELLABLE_ORDER_STATUSES: OrderStatus[] = ["ORDER_PLACED", "PAYMENT_CONFIRMED", "PROCESSING", "PACKED"];

export type CancelOrderResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "NOT_CANCELLABLE" };

/**
 * Full order-cancellation flow: eligibility re-checked here (never trust the caller — this is
 * the enforcement point a direct API call can't bypass), inventory restored, prepaid+paid orders
 * refunded through the existing gateway/ledger machinery, and the customer notified. Mirrors
 * markOrderFailed()'s idiom (src/lib/orders/payment-events.ts) of guarding the transition with
 * the transaction's own WHERE clause rather than a preceding read-then-check, so a concurrent
 * "mark shipped" can't race past this into an inconsistent state.
 */
export async function cancelOrder(params: { orderId: string; reason: string; cancelledById: string }): Promise<CancelOrderResult> {
  const { orderId, reason, cancelledById } = params;

  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { ok: false, reason: "NOT_FOUND" };

  const now = new Date();

  const processed = await db.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: orderId, status: { in: CANCELLABLE_ORDER_STATUSES } },
      data: { status: "CANCELLED", cancelledAt: now, cancellationReason: reason, cancelledById },
    });
    if (result.count === 0) return false;

    await tx.orderStatusHistory.create({ data: { orderId, status: "CANCELLED", note: reason } });

    // Restore the flat stock counter the same way checkout decremented it (src/app/api/checkout/route.ts)
    // and the same way a failed prepaid payment already releases it (markOrderFailed).
    for (const item of order.items) {
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
      await tx.product.update({ where: { id: item.productId }, data: { purchaseCount: { decrement: item.quantity } } });
    }

    await reverseLoyaltyPoints(tx, orderId, order.orderNumber);
    if (order.userId) {
      await recomputeUserReliability(tx, order.userId);
    }

    return true;
  });

  if (!processed) return { ok: false, reason: "NOT_CANCELLABLE" };

  // Surfaces the cancellation in the Customer Care queue. Best-effort/non-blocking — a ticket
  // is a convenience for support staff, not part of the cancellation's correctness.
  await createTicketFromSystemEvent({
    category: "ORDER_CANCELLATION",
    source: "ORDER_CANCELLATION",
    orderId,
    customerId: order.userId,
    guestEmail: order.guestEmail,
    guestPhone: order.guestPhone,
    subject: `Order cancelled — ${order.orderNumber}`,
    description: reason,
  });

  // Prepaid orders that were actually charged get refunded through the same gateway/ledger path
  // as every other refund in the app. COD, and prepaid orders that never reached PAID, have
  // nothing to reverse. A gateway failure here must not undo the cancellation that already
  // committed above — staff can complete it via the existing "Refund Payment" admin action.
  if (order.paymentMethod !== "COD" && order.paymentStatus === "PAID") {
    try {
      await processRefund({
        orderId,
        amount: Number(order.total),
        reason: `Order cancelled: ${reason}`,
        requestedById: cancelledById,
        orderStatus: "CANCELLED",
        // The cancellation ticket above already covers this event — a prepaid refund
        // triggered by the same cancellation shouldn't spawn a second, duplicate ticket.
        skipTicketCreation: true,
      });
    } catch (err) {
      console.error("[cancel-order] refund failed", err);
      await db.auditLog.create({
        data: { action: "REFUND_FAILED", entityType: "Order", entityId: orderId, meta: { kind: "ORDER_CANCEL_REFUND", error: String(err) } },
      });
    }
  }

  const user = order.userId ? await db.user.findUnique({ where: { id: order.userId }, select: { email: true, phone: true } }) : null;
  const contactEmail = order.guestEmail ?? user?.email;
  const contactPhone = order.guestPhone ?? user?.phone;
  const variables = { order_number: order.orderNumber, order_total: Number(order.total) };
  const templateKey = ORDER_EVENT_TEMPLATES.CANCELLED;

  await sendOrderEmail({ orderId, userId: order.userId, to: contactEmail, templateKey, variables });
  for (const channel of ["SMS", "WHATSAPP"] as const) {
    if (!contactPhone) continue;
    try {
      await notify({ channel, to: contactPhone, templateKey, variables });
    } catch (err) {
      console.error(`[cancel-order] notify(${channel}) failed`, err);
    }
  }

  if (order.userId) {
    await createNotification({
      userId: order.userId,
      type: "ORDER_STATUS",
      title: `Order ${order.orderNumber}`,
      body: `Your order has been cancelled. Reason: ${reason}`,
      link: `/account/orders/${orderId}`,
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/account/orders");

  return { ok: true };
}
